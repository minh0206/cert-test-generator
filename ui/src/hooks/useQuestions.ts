import { fetchQuestions } from "@/services/questionService"
import type { Question } from "@/types/question"
import { useEffect, useState } from "react"

interface UseQuestionsResult {
  questions: Question[]
  total: number
  isLoading: boolean
  error: string | null
  retry: () => void
}

interface UseQuestionsOptions {
  examId: string
  numQuestions?: number
}

export function useQuestions({
  examId,
  numQuestions = 10,
}: UseQuestionsOptions): UseQuestionsResult {
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  function retry() {
    setRetryCount((prev) => prev + 1)
  }

  useEffect(() => {
    if (!examId.trim()) {
      setQuestions([])
      setError("No exam selected.")
      setIsLoading(false)
      return
    }

    const controller = new AbortController()

    setIsLoading(true)
    setError(null)

    async function loadQuestions() {
      try {
        const parsed = await fetchQuestions(
          examId,
          numQuestions,
          controller.signal
        )

        if (controller.signal.aborted) {
          return
        }

        setQuestions(parsed)
      } catch (err) {
        if (controller.signal.aborted) {
          return
        }

        setQuestions([])
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load questions. Please try again."
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadQuestions()

    return () => {
      controller.abort()
    }
  }, [examId, numQuestions, retryCount])

  return {
    questions,
    total: questions.length,
    isLoading,
    error,
    retry,
  }
}
