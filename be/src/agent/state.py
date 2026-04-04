"""State definitions for the question-generation agent."""

from __future__ import annotations

from dataclasses import dataclass, field

from agent.models import ExamOutput


@dataclass
class InputState:
    """Input state for the question-generation agent."""

    exam_id: str = "databricks-de-associate"
    num_questions: int = 10


@dataclass
class State(InputState):
    """Full agent state."""

    exam_output: ExamOutput | None = field(default=None)
