"""Define the configurable parameters for the question-generation agent."""

from __future__ import annotations

import os
from dataclasses import dataclass, field, fields
from typing import Annotated


@dataclass(kw_only=True)
class Context:
    """Runtime context for the question-generation agent."""

    model: Annotated[str, {"__template_metadata__": {"kind": "llm"}}] = field(
        default="gemini-3.1-flash-lite-preview",
        metadata={"description": "The language model to use."},
    )

    def __post_init__(self) -> None:
        for f in fields(self):
            if not f.init:
                continue
            if getattr(self, f.name) == f.default:
                setattr(self, f.name, os.environ.get(f.name.upper(), f.default))
