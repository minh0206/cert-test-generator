import os

from agent.context import Context


def test_context_init() -> None:
    context = Context(model="groq/llama-3.3-70b-versatile")
    assert context.model == "groq/llama-3.3-70b-versatile"


def test_context_init_with_env_vars() -> None:
    os.environ["MODEL"] = "groq/llama-3.3-70b-versatile"
    context = Context()
    assert context.model == "groq/llama-3.3-70b-versatile"


def test_context_init_with_env_vars_and_passed_values() -> None:
    os.environ["MODEL"] = "groq/llama-3.3-70b-versatile"
    context = Context(model="groq/llama3-8b-8192")
    assert context.model == "groq/llama3-8b-8192"
