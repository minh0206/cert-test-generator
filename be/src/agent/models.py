"""Pydantic models for structured LLM output.

These models mirror the shape expected by the UI
(see ui/src/data/databricks-de-associate-questions.json).
"""

from typing import List

from pydantic import BaseModel, Field


class Question(BaseModel):
    """A single multiple-choice exam question."""

    question: str = Field(description="The full question text.")
    choices: List[str] = Field(
        description=(
            "Exactly 4 answer choices as plain strings. "
            "Do NOT include A / B / C / D prefixes — the UI adds those."
        ),
        min_length=4,
        max_length=4,
    )
    correctChoiceIndex: int = Field(
        description="Zero-based index (0–3) of the correct answer within `choices`.",
        ge=0,
        le=3,
    )
    explanation: str = Field(
        description=(
            "Clear explanation of why the correct answer is right "
            "and why the other options are incorrect or less appropriate."
        )
    )
    relatedInfo: str = Field(
        description=(
            "Additional context, tips, related concepts, or documentation "
            "references that help the learner deepen their understanding "
            "of the topic covered by this question."
        )
    )


class ExamOutput(BaseModel):
    """Top-level structured output returned by the question-generation agent."""

    questions: List[Question] = Field(
        description="Ordered list of generated exam questions."
    )
