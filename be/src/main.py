"""FastAPI application for the question generation agent."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agent.context import Context
from agent.graph import graph
from agent.state import InputState

# Load environment variables from .env file
load_dotenv()


class GenerateRequest(BaseModel):
    """Request body for generating questions."""

    exam_id: str
    num_questions: int = 45


class GenerateResponse(BaseModel):
    """Response containing generated questions."""

    questions: dict


class ExamMetadata(BaseModel):
    """Metadata for an exam."""

    id: str
    name: str
    short_name: str
    description: str
    category: str
    total_questions: int
    estimated_minutes: int
    pass_score_percent: int
    tags: list[str]


class ExamsListResponse(BaseModel):
    """Response containing list of available exams."""

    exams: list[ExamMetadata]


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifecycle manager for the FastAPI app."""
    # Startup: you can initialize resources here if needed
    yield
    # Shutdown: cleanup resources


app = FastAPI(
    title="Question Generation API",
    description="Generate exam questions using LangGraph",
    version="0.0.1",
    lifespan=lifespan,
)

# Configure CORS for your UI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.post("/generate", response_model=GenerateResponse)
async def generate_questions(request: GenerateRequest):
    """Generate exam questions.

    Args:
        request: Contains exam_id and num_questions

    Returns:
        Generated questions in JSON format
    """
    try:
        # Validate exam exists
        exam_metadata = {
            "databricks-de-associate": "Databricks Certified Data Engineer Associate",
        }

        if request.exam_id not in exam_metadata:
            raise HTTPException(
                status_code=404, detail=f"Exam '{request.exam_id}' not found"
            )

        # Create context for the graph
        context = Context()

        # Create input state
        input_state = InputState(
            exam_id=request.exam_id,
            num_questions=request.num_questions,
        )

        # Run the graph
        result = await graph.ainvoke(input_state, context=context)

        # Extract the exam output
        exam_output = result.get("exam_output")

        if exam_output:
            return GenerateResponse(questions=exam_output.model_dump())
        else:
            raise HTTPException(status_code=500, detail="Failed to generate questions")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating questions: {str(e)}"
        )


@app.get("/exams", response_model=ExamsListResponse)
async def list_exams():
    """List available exams with metadata."""
    # Map of exam IDs to their metadata
    exam_metadata = {
        "databricks-de-associate": ExamMetadata(
            id="databricks-de-associate",
            name="Databricks Certified Data Engineer Associate",
            short_name="DE Associate",
            description="Assess your ability to use the Databricks Data Intelligence Platform to complete data engineering tasks. This includes understanding the platform architecture, performing ETL tasks using Apache Spark SQL or PySpark, and deploying workloads using Databricks workflows.",
            category="Databricks",
            total_questions=45,
            estimated_minutes=90,
            pass_score_percent=70,
            tags=[
                "Databricks Platform",
                "Delta Lake",
                "Auto Loader",
                "Unity Catalog",
                "PySpark",
                "Spark SQL",
                "Medallion Architecture",
                "ETL",
                "Data Pipelines",
                "Databricks Workflows",
            ],
        ),
    }

    return ExamsListResponse(exams=list(exam_metadata.values()))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
