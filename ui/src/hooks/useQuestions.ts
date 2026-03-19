import { useState, useEffect } from "react"
import type { Question } from "@/types/question"
import questionsData from "@/data/questions.json"

interface UseQuestionsResult {
  questions: Question[]
  total: number
  isLoading: boolean
  error: string | null
}

const SIMULATED_DELAY_MS = 800

export function useQuestions(): UseQuestionsResult {
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    setError(null)

    const timer = setTimeout(() => {
      try {
        // Simulate parsing a backend response
        const parsed = questionsData as Question[]
        setQuestions(parsed)
      } catch {
        setError("Failed to load questions. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }, SIMULATED_DELAY_MS)

    return () => clearTimeout(timer)
  }, [])

  return {
    questions,
    total: questions.length,
    isLoading,
    error,
  }
}
