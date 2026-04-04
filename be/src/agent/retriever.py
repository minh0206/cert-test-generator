"""Vector store and retriever setup for the RAG agent.

This module manages the lifecycle of the vector store used to retrieve
relevant documents during the RAG pipeline. It uses an in-memory vector
store backed by fastembed embeddings — a lightweight, ONNX-based local
embedding library that requires no API key.

To adapt this for your use case:
1. Point PDF_PATH at your real certification study material.
2. Tune CHUNK_SIZE and CHUNK_OVERLAP to suit the density of your PDF content.
3. Swap InMemoryVectorStore for a persistent store (e.g. Chroma, Pinecone, pgvector)
   once you are ready to move beyond prototyping.
4. Change the default embedding model in context.py to any model listed at
   https://qdrant.github.io/fastembed/examples/Supported_Models/
"""

from __future__ import annotations

from langchain_community.document_loaders import PyPDFLoader
from langchain_community.embeddings import FastEmbedEmbeddings
from langchain_core.documents import Document
from langchain_core.vectorstores import InMemoryVectorStore, VectorStoreRetriever
from langchain_text_splitters import RecursiveCharacterTextSplitter

# ---------------------------------------------------------------------------
# PDF source
# Change this path to point at your certification study material.
# ---------------------------------------------------------------------------

PDF_PATH: str = ""  # No default PDF path

# ---------------------------------------------------------------------------
# Splitter settings
# CHUNK_SIZE   – maximum number of characters per chunk.
# CHUNK_OVERLAP – how many characters are shared between adjacent chunks so
#                 that context is not lost at chunk boundaries.
# ---------------------------------------------------------------------------

CHUNK_SIZE: int = 1000
CHUNK_OVERLAP: int = 200

# ---------------------------------------------------------------------------
# Vector store cache
# Keyed by embedding model name so that switching models forces a rebuild.
# ---------------------------------------------------------------------------

_stores: dict[str, InMemoryVectorStore] = {}


async def load_pdf(path: str = PDF_PATH) -> list[Document]:
    """Load a PDF from *path* and split it into overlapping text chunks.

    Uses :class:`~langchain_community.document_loaders.PyPDFLoader` to parse
    the PDF (one :class:`~langchain_core.documents.Document` per page) and
    then :class:`~langchain_text_splitters.RecursiveCharacterTextSplitter` to
    break long pages into smaller, semantically coherent chunks that fit
    comfortably inside an embedding model's context window.

    Each chunk inherits the page-level metadata produced by the loader
    (``source``, ``page``) so that retrieved passages can be traced back to
    their origin.

    Args:
        path: Absolute or relative path to the PDF file to load.
              Defaults to :data:`PDF_PATH`.

    Returns:
        A flat list of :class:`~langchain_core.documents.Document` chunks
        ready to be embedded and inserted into the vector store.

    Raises:
        FileNotFoundError: If *path* does not point to an existing file.
    """
    loader = PyPDFLoader(path)
    pages = await loader.aload()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
    )
    chunks = splitter.split_documents(pages)
    return chunks


async def get_retriever(
    embedding_model: str,
    k: int,
    documents: list[Document] | None = None,
) -> VectorStoreRetriever:
    """Return a retriever backed by an in-memory vector store.

    The vector store is lazily initialised and cached per embedding model so
    that the PDF is only loaded and embedded once per process lifetime.

    On the first call for a given *embedding_model*:

    * If *documents* is provided, those documents are indexed directly.
    * Otherwise the PDF at :data:`PDF_PATH` is loaded, split into chunks,
      and indexed.

    Subsequent calls with the same *embedding_model* reuse the existing store
    and ignore *documents*.

    Args:
        embedding_model: A fastembed-compatible model name
            (e.g. ``BAAI/bge-small-en-v1.5``). No API key is required —
            the model is downloaded once and run locally via ONNX.
        k: Number of documents to return per query.
        documents: Optional list of :class:`~langchain_core.documents.Document`
            objects to index instead of loading from :data:`PDF_PATH`.

    Returns:
        A :class:`~langchain_core.vectorstores.VectorStoreRetriever` configured
        to return ``k`` documents.
    """
    global _stores

    if embedding_model not in _stores:
        embeddings = FastEmbedEmbeddings(model_name=embedding_model)
        store = InMemoryVectorStore(embeddings)

        docs_to_index = documents if documents is not None else await load_pdf()
        await store.aadd_documents(docs_to_index)

        _stores[embedding_model] = store

    return _stores[embedding_model].as_retriever(search_kwargs={"k": k})


async def add_documents(
    embedding_model: str,
    documents: list[Document],
) -> None:
    """Add new documents to an already-initialised vector store.

    If the store for the given *embedding_model* has not been created yet,
    this call initialises it with the provided documents (skipping the PDF
    load).

    Args:
        embedding_model: A fastembed-compatible model name.
        documents: Documents to add to the vector store.
    """
    if embedding_model not in _stores:
        await get_retriever(embedding_model, k=4, documents=documents)
    else:
        await _stores[embedding_model].aadd_documents(documents)
