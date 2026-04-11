interface ExamMetadata {
  id: string
  name: string
  short_name: string
  description: string
  category: string
  total_questions: number
  estimated_minutes: number
  pass_score_percent: number
  tags: string[]
}

interface ExamsListResponse {
  exams: ExamMetadata[]
}

const DEFAULT_API_BASE_URL = "http://localhost:8000"

function getApiBaseUrl(): string {
  const envBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined
  const baseUrl = envBaseUrl?.trim() || DEFAULT_API_BASE_URL
  return baseUrl.replace(/\/$/, "")
}

export async function fetchAllExams(
  signal?: AbortSignal
): Promise<ExamMetadata[]> {
  const response = await fetch(`${getApiBaseUrl()}/exams`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
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

    throw new Error(`Failed to fetch exams: ${detail}`)
  }

  const data = (await response.json()) as ExamsListResponse
  return data.exams
}
