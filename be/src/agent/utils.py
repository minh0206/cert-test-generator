"""Utility & helper functions."""

from typing import List

from langchain.chat_models import init_chat_model
from langchain_core.documents import Document
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import BaseMessage


def get_message_text(msg: BaseMessage) -> str:
    """Get the text content of a message."""
    content = msg.content
    if isinstance(content, str):
        return content
    elif isinstance(content, dict):
        return content.get("text", "")
    else:
        txts = [c if isinstance(c, str) else (c.get("text") or "") for c in content]
        return "".join(txts).strip()


def load_chat_model(fully_specified_name: str) -> BaseChatModel:
    """Load a chat model from a fully specified name.

    Args:
        fully_specified_name (str): String in the format 'provider/model'.
    """
    provider, model = fully_specified_name.split("/", maxsplit=1)
    return init_chat_model(model, model_provider=provider)


def format_docs(documents: List[Document]) -> str:
    """Format a list of retrieved documents into a single context string.

    Each document is rendered as a numbered block that includes any available
    metadata (source, topic) followed by its content. The blocks
    are separated by a blank line so the LLM can clearly distinguish between
    individual documents.

    Args:
        documents: The list of :class:`~langchain_core.documents.Document`
            objects returned by the retriever.

    Returns:
        A formatted string suitable for injection into the system prompt's
        ``{context}`` placeholder.  Returns an empty string when the list is
        empty so callers can detect the no-context case without extra logic.
    """
    if not documents:
        return ""

    blocks: List[str] = []
    for i, doc in enumerate(documents, start=1):
        meta_parts: List[str] = []
        for key in ("source", "topic"):
            value = doc.metadata.get(key)
            if value:
                meta_parts.append(f"{key}: {value}")

        header = f"[Document {i}]"
        if meta_parts:
            header += f" ({', '.join(meta_parts)})"

        blocks.append(f"{header}\n{doc.page_content.strip()}")

    return "\n\n".join(blocks)
