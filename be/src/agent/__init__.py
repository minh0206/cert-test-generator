"""RAG Agent.

This module defines a Retrieval-Augmented Generation (RAG) agent graph.
It retrieves relevant documents from a vector store and uses them as
context to generate grounded responses.
"""

from agent.graph import graph

__all__ = ["graph"]
