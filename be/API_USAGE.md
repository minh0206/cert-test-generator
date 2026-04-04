# FastAPI + LangGraph Integration

This document explains how to run the FastAPI server that wraps the LangGraph question generation agent.

## Installation

1. Install dependencies (if not already done):

```bash
cd be
pip install -e .
# or with uv:
uv pip install -e .
```

2. Make sure your `.env` file is configured with the necessary API keys (see main README.md).

## Running the API Server

### Development Mode (with auto-reload)

```bash
cd be
python run_api.py
```

The server will start on `http://localhost:8000` with auto-reload enabled.

### Production Mode

```bash
cd be
uvicorn src.agent.api:app --host 0.0.0.0 --port 8000
```

## API Endpoints

### Health Check

```bash
GET /health
```

Returns the health status of the API.

**Example:**

```bash
curl http://localhost:8000/health
```

**Response:**

```json
{
  "status": "healthy"
}
```

### List Available Exams

```bash
GET /exams
```

Returns a list of available exam guides.

**Example:**

```bash
curl http://localhost:8000/exams
```

**Response:**

```json
{
  "exams": ["databricks-de-associate"]
}
```

### Generate Questions

```bash
POST /generate
```

Generates exam questions for a specific exam using the LangGraph agent.

**Request Body:**

```json
{
  "exam_id": "databricks-de-associate",
  "num_questions": 10
}
```

**Example:**

```bash
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{"exam_id": "databricks-de-associate", "num_questions": 5}'
```

**Response:**

```json
{
  "questions": {
    "questions": [
      {
        "id": "dbx-de-001",
        "question": "What is...",
        "options": ["A", "B", "C", "D"],
        "correct_answer": "A",
        "explanation": "..."
      }
    ]
  }
}
```

## CORS Configuration

The API is configured to accept requests from `http://localhost:5173` (Vite's default port).

To add more origins, edit `be/src/agent/api.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",  # Add more origins
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Interactive API Documentation

Once the server is running, you can access:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

These provide interactive documentation where you can test the endpoints directly from your browser.

## Integration with UI

Update your UI's `agentApi.ts` to use the FastAPI endpoints:

```typescript
const API_BASE_URL = "http://localhost:8000";

export async function generateQuestions(
  examId: string,
  numQuestions: number = 10,
) {
  const response = await fetch(`${API_BASE_URL}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      exam_id: examId,
      num_questions: numQuestions,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate questions: ${response.statusText}`);
  }

  const data = await response.json();
  return data.questions;
}
```

## Troubleshooting

### Port Already in Use

If port 8000 is already in use, change the port in `run_api.py`:

```python
uvicorn.run(
    "src.agent.api:app",
    host="0.0.0.0",
    port=8001,  # Change to a different port
    reload=True,
)
```

### CORS Errors

If you get CORS errors from your UI, make sure:

1. The UI's origin is listed in the `allow_origins` list
2. The API server is running
3. You're using the correct API URL in your UI code
