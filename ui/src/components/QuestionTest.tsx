import { useState, useEffect, useRef } from "react"
import { useQuestions } from "@/hooks/useQuestions"
import { MultipleChoiceQuestion } from "@/components/MultipleChoiceQuestion"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ChevronLeft,
  ChevronRight,
  Trophy,
  RotateCcw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

const QUESTIONS_PER_PAGE = 5

export function QuestionTest() {
  const { questions, total, isLoading, error } = useQuestions()
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, number>
  >({})
  const topRef = useRef<HTMLDivElement>(null)

  const totalPages = Math.ceil(total / QUESTIONS_PER_PAGE)
  const answeredCount = Object.keys(selectedAnswers).length
  const correctCount = questions.filter(
    (q) =>
      q.id in selectedAnswers && selectedAnswers[q.id] === q.correctChoiceIndex
  ).length
  const progressPercent =
    total > 0 ? Math.round((answeredCount / total) * 100) : 0
  const allAnswered = answeredCount === total && total > 0
  const scorePercent = total > 0 ? Math.round((correctCount / total) * 100) : 0

  const pageStartIndex = (currentPage - 1) * QUESTIONS_PER_PAGE
  const pageQuestions = questions.slice(
    pageStartIndex,
    pageStartIndex + QUESTIONS_PER_PAGE
  )

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [currentPage])

  function handleSelect(questionId: string, index: number) {
    setSelectedAnswers((prev) => {
      if (questionId in prev) return prev
      return { ...prev, [questionId]: index }
    })
  }

  function handleReset() {
    setSelectedAnswers({})
    setCurrentPage(1)
  }

  function goToPage(page: number) {
    setCurrentPage(page)
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Loading questions…</p>
        </div>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Main ───────────────────────────────────────────────────────────────────
  return (
    <div ref={topRef} className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              AWS Practice Test
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {answeredCount} of {total} questions answered
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {correctCount} / {total} correct
            </Badge>
            {allAnswered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restart
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex flex-col gap-1.5">
          <Progress value={progressPercent} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progressPercent}% complete</span>
            <span>
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {/* ── Score summary (shown when all questions are answered) ── */}
      {allAnswered && (
        <Card
          className={cn(
            "border-2",
            scorePercent >= 80
              ? "border-green-500"
              : scorePercent >= 60
                ? "border-yellow-500"
                : "border-red-500"
          )}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy
                  className={cn(
                    "h-5 w-5",
                    scorePercent >= 80
                      ? "text-green-500"
                      : scorePercent >= 60
                        ? "text-yellow-500"
                        : "text-red-500"
                  )}
                />
                <CardTitle className="text-base">Test Complete!</CardTitle>
              </div>
              <Badge
                variant={scorePercent >= 80 ? "default" : "destructive"}
                className="px-3 py-1 text-sm"
              >
                {scorePercent}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="font-medium text-green-700 dark:text-green-400">
                  {correctCount} correct
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="font-medium text-red-700 dark:text-red-400">
                  {total - correctCount} incorrect
                </span>
              </div>
              <p className="ml-auto text-sm text-muted-foreground">
                {scorePercent >= 80
                  ? "🎉 Great job! You passed."
                  : scorePercent >= 60
                    ? "📚 Almost there — keep studying!"
                    : "💪 Keep practicing!"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Questions for current page ── */}
      <div className="flex flex-col divide-y">
        {pageQuestions.map((q, index) => (
          <div
            key={q.id}
            className={cn(
              index !== 0 && "pt-10",
              index !== pageQuestions.length - 1 && "pb-10"
            )}
          >
            <MultipleChoiceQuestion
              {...q}
              questionNumber={pageStartIndex + index + 1}
              totalQuestions={total}
              selectedIndex={selectedAnswers[q.id] ?? null}
              onSelect={(idx) => handleSelect(q.id, idx)}
            />
          </div>
        ))}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <>
          <Separator />
          <div className="flex items-center justify-between">
            {/* Previous */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="gap-1.5"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            {/* Page number pills */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => {
                  const pageSliceStart = (page - 1) * QUESTIONS_PER_PAGE
                  const pageSliceEnd = pageSliceStart + QUESTIONS_PER_PAGE
                  const pageQs = questions.slice(pageSliceStart, pageSliceEnd)
                  const pageAnswered = pageQs.filter(
                    (q) => q.id in selectedAnswers
                  ).length
                  const isPageComplete = pageAnswered === pageQs.length

                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={cn(
                        "relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors",
                        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                        currentPage === page
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {page}
                      {/* Green dot when page is fully answered and not current */}
                      {isPageComplete && currentPage !== page && (
                        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500" />
                      )}
                    </button>
                  )
                }
              )}
            </div>

            {/* Next */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="gap-1.5"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

export default QuestionTest
