import questionsData from "@/data/questions.json"
import { fetchAllExams } from "@/services/examService"
import type { Exam } from "@/types/exam"
import type { Question } from "@/types/question"
import { useEffect, useMemo, useState } from "react"

export type QuestionLimitValue = "5" | "10" | "15" | "all"

interface UseExamsResult {
  exams: readonly Exam[]
  totalQuestions: number
  questionCountOptions: QuestionLimitValue[]
  defaultQuestionLimit: QuestionLimitValue
}

const fallbackTotalQuestions = (questionsData as Question[]).length

const FALLBACK_EXAMS: readonly Exam[] = [
  {
    id: "aws-practitioner",
    name: "AWS Practice Exam",
    shortName: "AWS",
    description: "Core cloud concepts, architecture, security, and operations.",
    category: "Cloud Fundamentals",
    totalQuestions: fallbackTotalQuestions,
    estimatedMinutes: 45,
    passScorePercent: 70,
    tags: ["cloud", "fundamentals", "security"],
  },
]

export function useExams(): UseExamsResult {
  const [exams, setExams] = useState<readonly Exam[]>(FALLBACK_EXAMS)
  const [totalQuestions, setTotalQuestions] = useState(fallbackTotalQuestions)

  useEffect(() => {
    const controller = new AbortController()

    async function loadExams() {
      try {
        const exams = await fetchAllExams(controller.signal)

        if (exams.length === 0) {
          return
        }

        const mappedExams = exams.map((exam) => ({
          id: exam.id,
          name: exam.name,
          shortName: exam.short_name,
          description: exam.description,
          category: exam.category,
          totalQuestions: exam.total_questions,
          estimatedMinutes: exam.estimated_minutes,
          passScorePercent: exam.pass_score_percent,
          tags: exam.tags,
        }))

        setExams(mappedExams)
        setTotalQuestions(
          mappedExams[0]?.totalQuestions ?? fallbackTotalQuestions
        )
      } catch {
        // Keep local fallback exams if backend is unreachable.
      }
    }

    void loadExams()

    return () => {
      controller.abort()
    }
  }, [])

  const questionCountOptions = useMemo(() => {
    const numeric = [5, 10, 15].filter((count) => count < totalQuestions)
    return [...numeric.map(String), "all"] as QuestionLimitValue[]
  }, [totalQuestions])

  const defaultQuestionLimit = questionCountOptions.includes("10")
    ? "10"
    : questionCountOptions[0]

  return {
    exams,
    totalQuestions,
    questionCountOptions,
    defaultQuestionLimit,
  }
}
