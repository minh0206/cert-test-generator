import type { Question } from "@/types/question"

interface GenerateQuestionsResponse {
  questions?: unknown
}

type BackendQuestion = Omit<Question, "id"> & {
  id?: string
}

const DEFAULT_API_BASE_URL = "http://localhost:8000"

function getApiBaseUrl(): string {
  const envBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined
  const baseUrl = envBaseUrl?.trim() || DEFAULT_API_BASE_URL
  return baseUrl.replace(/\/$/, "")
}

function extractQuestionsPayload(
  data: GenerateQuestionsResponse
): BackendQuestion[] {
  if (Array.isArray(data.questions)) {
    return data.questions as BackendQuestion[]
  }

  if (
    data.questions &&
    typeof data.questions === "object" &&
    "questions" in data.questions
  ) {
    const nestedQuestions = (data.questions as { questions?: unknown })
      .questions

    if (Array.isArray(nestedQuestions)) {
      return nestedQuestions as BackendQuestion[]
    }
  }

  return []
}

function normalizeQuestions(
  questions: BackendQuestion[],
  examId: string
): Question[] {
  return questions.map((question, index) => ({
    ...question,
    id: question.id?.trim() || `${examId}-${index + 1}`,
  }))
}

export async function fetchQuestions(
  examId: string,
  numQuestions: number,
  signal?: AbortSignal
): Promise<Question[]> {
  const response = await fetch(`${getApiBaseUrl()}/generate`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      exam_id: examId,
      num_questions: numQuestions,
    }),
    signal,
  })

  if (!response.ok) {
    let detail = response.statusText

    try {
      const errorBody = (await response.json()) as { detail?: string }
      if (errorBody.detail) {
        detail = errorBody.detail
      }
    } catch {
      // Ignore JSON parse errors and use HTTP status text as fallback detail.
    }

    throw new Error(`Failed to fetch questions: ${detail}`)
  }

  const data = (await response.json()) as GenerateQuestionsResponse
  const questions = extractQuestionsPayload(data)
  return normalizeQuestions(questions, examId)
}
