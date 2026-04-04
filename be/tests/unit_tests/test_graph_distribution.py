import pytest

from agent.graph import (
    _chunk_sizes,
    _distribute_questions,
    _is_failed_generation_error,
)


def test_distribute_questions_uses_weighted_blueprint() -> None:
    distribution = _distribute_questions(45, [10, 30, 31, 18, 11])

    assert distribution == [4, 14, 14, 8, 5]
    assert sum(distribution) == 45


def test_distribute_questions_handles_small_totals() -> None:
    distribution = _distribute_questions(3, [10, 30, 31, 18, 11])

    assert distribution == [0, 1, 1, 1, 0]
    assert sum(distribution) == 3


def test_distribute_questions_rejects_invalid_input() -> None:
    with pytest.raises(ValueError, match="must not be empty"):
        _distribute_questions(10, [])

    with pytest.raises(ValueError, match="positive"):
        _distribute_questions(10, [0, 0, 0])

    with pytest.raises(ValueError, match="non-negative"):
        _distribute_questions(-1, [1, 1, 1])


def test_chunk_sizes_splits_into_expected_batches() -> None:
    assert _chunk_sizes(14, 5) == [5, 5, 4]
    assert _chunk_sizes(5, 5) == [5]
    assert _chunk_sizes(0, 5) == []


def test_chunk_sizes_rejects_invalid_input() -> None:
    with pytest.raises(ValueError, match="non-negative"):
        _chunk_sizes(-1, 5)

    with pytest.raises(ValueError, match="positive"):
        _chunk_sizes(1, 0)


@pytest.mark.parametrize(
    ("message", "expected"),
    [
        ("Error code: 400 - failed_generation", True),
        ("Failed to call a function while parsing tool output", True),
        ("Rate limit exceeded", False),
    ],
)
def test_is_failed_generation_error(message: str, expected: bool) -> None:
    assert _is_failed_generation_error(RuntimeError(message)) is expected
