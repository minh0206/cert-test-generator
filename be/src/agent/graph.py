"""Question-generation agent.

Pipeline:

    generate

1. **generate**: Calls the LLM with structured output to produce a list of
   multiple-choice questions matching the UI's expected JSON shape.
"""

import logging
from datetime import UTC, datetime
from typing import Dict

from langgraph.graph import StateGraph
from langgraph.runtime import Runtime
from langgraph.types import RetryPolicy
from rich.console import Console
from rich.logging import RichHandler
from rich.markdown import Markdown

from agent.context import Context
from agent.models import ExamOutput, Question
from agent.prompts.databricks import (
    DE_ASSOCIATE_OUTPUT_REQUIREMENTS,
    DE_ASSOCIATE_SECTION_PROMPTS,
)
from agent.state import InputState, State
from agent.utils import load_chat_model

# Configure logger with Rich handler
logging.basicConfig(
    level=logging.INFO,
    format="%(message)s",
    handlers=[RichHandler(rich_tracebacks=True)],
)
logger = logging.getLogger(__name__)


EXAM_SECTION_WEIGHTS = {
    "databricks-de-associate": {
        1: 10,
        2: 30,
        3: 31,
        4: 18,
        5: 11,
    },
}

MAX_QUESTIONS_PER_LLM_CALL = 20


def _distribute_questions(
    total_questions: int, section_weights: list[int]
) -> list[int]:
    """Distribute questions across sections based on relative weights.

    Uses the largest-remainder method so totals always match ``total_questions``.
    """
    if total_questions < 0:
        raise ValueError("total_questions must be non-negative")
    if not section_weights:
        raise ValueError("section_weights must not be empty")

    total_weight = sum(section_weights)
    if total_weight <= 0:
        raise ValueError("section_weights must sum to a positive value")

    raw_distribution = [
        total_questions * weight / total_weight for weight in section_weights
    ]
    distribution = [int(value) for value in raw_distribution]

    remaining = total_questions - sum(distribution)
    if remaining > 0:
        # Prioritize larger fractional remainder, then larger section weight.
        priority = sorted(
            range(len(section_weights)),
            key=lambda idx: (
                -(raw_distribution[idx] - distribution[idx]),
                -section_weights[idx],
                idx,
            ),
        )
        for idx in priority[:remaining]:
            distribution[idx] += 1

    return distribution


def _chunk_sizes(total: int, max_chunk_size: int) -> list[int]:
    """Split ``total`` into chunk sizes no larger than ``max_chunk_size``."""
    if total < 0:
        raise ValueError("total must be non-negative")
    if max_chunk_size <= 0:
        raise ValueError("max_chunk_size must be positive")

    chunks: list[int] = []
    remaining = total
    while remaining > 0:
        chunk = min(remaining, max_chunk_size)
        chunks.append(chunk)
        remaining -= chunk
    return chunks


def _is_failed_generation_error(error: Exception) -> bool:
    """Return true if an error indicates model tool-calling generation failure."""
    error_text = str(error).lower()
    return (
        "failed_generation" in error_text or "failed to call a function" in error_text
    )


def _build_section_prompt(section_prompt_template: str, num_questions: int) -> str:
    """Build the concrete prompt for a section request."""
    return section_prompt_template.format(
        num_questions=num_questions,
        output_requirements=DE_ASSOCIATE_OUTPUT_REQUIREMENTS,
        system_time=datetime.now(tz=UTC).isoformat(),
    )


async def _generate_section_batch(
    *,
    structured_model,
    section_prompt_template: str,
    section_id: int,
    num_questions: int,
) -> list[Question]:
    """Generate a single batch of section questions using structured output."""
    prompt = _build_section_prompt(section_prompt_template, num_questions)
    logger.info(
        "Invoking LLM for section %s with %s questions",
        section_id,
        num_questions,
    )

    # Gemini requires at least one non-system message in the request payload.
    result: ExamOutput = await structured_model.ainvoke(prompt)

    if len(result.questions) < num_questions:
        raise ValueError(
            "Model returned too few questions for section "
            f"{section_id}: expected {num_questions}, "
            f"got {len(result.questions)}"
        )

    return result.questions[:num_questions]


async def _generate_section_questions(
    *,
    structured_model,
    section_prompt_template: str,
    section_id: int,
    num_section_questions: int,
) -> list[Question]:
    """Generate all requested questions for one section with batching/fallback."""
    if num_section_questions == 0:
        logger.info(
            "Skipping section %s because requested question count is 0",
            section_id,
        )
        return []

    section_questions: list[Question] = []
    batch_sizes = _chunk_sizes(
        num_section_questions,
        MAX_QUESTIONS_PER_LLM_CALL,
    )

    for batch_size in batch_sizes:
        try:
            batch_questions = await _generate_section_batch(
                structured_model=structured_model,
                section_prompt_template=section_prompt_template,
                section_id=section_id,
                num_questions=batch_size,
            )
            section_questions.extend(batch_questions)
        except Exception as error:
            if batch_size > 1 and _is_failed_generation_error(error):
                logger.warning(
                    "Section %s batch of %s failed with tool-calling "
                    "generation error. Falling back to single-question "
                    "requests.",
                    section_id,
                    batch_size,
                )
                for _ in range(batch_size):
                    single_question_batch = await _generate_section_batch(
                        structured_model=structured_model,
                        section_prompt_template=section_prompt_template,
                        section_id=section_id,
                        num_questions=1,
                    )
                    section_questions.extend(single_question_batch)
                continue
            raise

    return section_questions


async def generate(state: State, runtime: Runtime[Context]) -> Dict[str, object]:
    """Generate multiple-choice questions.

    Uses structured output (Pydantic ``ExamOutput``) so the response is
    directly serialisable to the JSON shape consumed by the UI.

    Returns:
        A dict with the generated ``ExamOutput``.
    """
    logger.info(f"Starting question generation for exam: {state.exam_id}")

    # Map exam IDs to section-specific prompt templates.
    exam_section_prompts = {
        "databricks-de-associate": DE_ASSOCIATE_SECTION_PROMPTS,
    }

    if state.exam_id not in exam_section_prompts:
        raise ValueError(f"Unknown exam ID: {state.exam_id}")
    section_prompts = exam_section_prompts[state.exam_id]
    section_ids = sorted(section_prompts)

    if state.exam_id not in EXAM_SECTION_WEIGHTS:
        raise ValueError(f"Missing section weights for exam ID: {state.exam_id}")
    section_weights_by_id = EXAM_SECTION_WEIGHTS[state.exam_id]
    if set(section_ids) != set(section_weights_by_id):
        raise ValueError(
            "Section prompt IDs and section weight IDs do not match for exam "
            f"{state.exam_id}"
        )

    section_weights = [section_weights_by_id[section_id] for section_id in section_ids]
    distribution = _distribute_questions(state.num_questions, section_weights)

    model = load_chat_model(runtime.context.model)
    structured_model = model.with_structured_output(ExamOutput)

    try:
        all_questions: list[Question] = []

        for section_idx, section_id in enumerate(section_ids):
            num_section_questions = distribution[section_idx]
            section_questions = await _generate_section_questions(
                structured_model=structured_model,
                section_prompt_template=section_prompts[section_id],
                section_id=section_id,
                num_section_questions=num_section_questions,
            )

            all_questions.extend(section_questions)
            logger.info(
                "Section %s generated %s questions",
                section_id,
                len(section_questions),
            )

        exam_output = ExamOutput(questions=all_questions)
        logger.info("Successfully generated %s questions", len(exam_output.questions))
        return {"exam_output": exam_output}
    except Exception as e:
        logger.error(f"Error during question generation: {str(e)}", exc_info=True)
        raise


# ---------------------------------------------------------------------------
# Retry policy configuration
# ---------------------------------------------------------------------------

# Configure retry policy for resilient node execution
retry_policy = RetryPolicy(
    max_attempts=3,  # Maximum number of retry attempts
    initial_interval=1.0,  # Initial delay in seconds
    backoff_factor=2.0,  # Exponential backoff multiplier
    max_interval=10.0,  # Maximum interval between retries in seconds
    jitter=True,  # Add random jitter to retry delays
    retry_on=(Exception,),  # Retry on any exception
)

# ---------------------------------------------------------------------------
# Graph definition
# ---------------------------------------------------------------------------

builder = StateGraph(State, input_schema=InputState, context_schema=Context)

builder.add_node(generate, retry_policy=retry_policy)

builder.add_edge("__start__", "generate")
builder.add_edge("generate", "__end__")

graph = builder.compile(name="Question Generation Agent")


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------


async def main() -> None:
    """Invoke the question-generation graph with sample input."""
    from pathlib import Path

    from dotenv import load_dotenv

    from agent.context import Context

    # Load environment variables
    env_file = Path(__file__).parent.parent.parent / ".env"
    load_dotenv(env_file)

    # Configure logging for agent module only
    logging.basicConfig(level=logging.WARNING)
    agent_logger = logging.getLogger("agent")
    agent_logger.setLevel(logging.DEBUG)
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(levelname)s - %(name)s - %(message)s"))
    agent_logger.addHandler(handler)

    # Create runtime context
    context = Context()

    # Create input state
    input_state = InputState(
        exam_id="databricks-de-associate",
        num_questions=45,
    )

    # Invoke the graph
    result = await graph.ainvoke(
        input_state,
        context=context,
    )

    exam_output: ExamOutput = result["exam_output"]

    # Log results
    console = Console()

    markdown_output = "# Question Generation Results\n\n"
    markdown_output += (
        f"**Generated {len(exam_output.questions)} questions successfully**\n\n"
    )

    for i, question in enumerate(exam_output.questions, 1):
        markdown_output += f"## Question {i}\n\n"
        markdown_output += f"{question.question}\n\n"
        markdown_output += "### Choices:\n"
        for j, option in enumerate(question.choices, 1):
            marker = "✓" if j == question.correctChoiceIndex + 1 else " "
            markdown_output += f"- [{marker}] {option}\n"
        markdown_output += "\n"

    console.print(Markdown(markdown_output))


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
