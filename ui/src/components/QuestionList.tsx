import { MultipleChoiceQuestion } from "@/components/MultipleChoiceQuestion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { useQuestions } from "@/hooks/useQuestions"
import { cn } from "@/lib/utils"
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCcw,
  Trophy,
  XCircle,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

const QUESTIONS_PER_PAGE = 5
const MAX_PAGINATION_ITEMS = 7

type PaginationItem = number | "ellipsis-left" | "ellipsis-right"

function appendPageWithGap(items: PaginationItem[], page: number) {
  const previousItem = items.at(-1)

  if (typeof previousItem !== "number") {
    items.push(page)
    return
  }

  const gap = page - previousItem

  if (gap === 2) {
    items.push(previousItem + 1)
  } else if (gap > 2) {
    items.push(
      items.includes("ellipsis-left") ? "ellipsis-right" : "ellipsis-left"
    )
  }

  items.push(page)
}

function getPaginationItems(
  currentPage: number,
  totalPages: number
): PaginationItem[] {
  if (totalPages <= MAX_PAGINATION_ITEMS) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set<number>([
    1,
    totalPages,
    currentPage,
    currentPage - 1,
    currentPage + 1,
  ])

  if (currentPage <= 4) {
    pages.add(2)
    pages.add(3)
    pages.add(4)
  }

  if (currentPage >= totalPages - 3) {
    pages.add(totalPages - 1)
    pages.add(totalPages - 2)
    pages.add(totalPages - 3)
  }

  const sortedPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b)

  const items: PaginationItem[] = []

  for (const page of sortedPages) {
    appendPageWithGap(items, page)
  }

  return items
}

interface QuestionListProps {
  readonly examId: string
  readonly examName?: string
  readonly numQuestions: number
  readonly onExit?: () => void
}

export function QuestionList({
  examId,
  examName,
  numQuestions,
  onExit,
}: QuestionListProps) {
  const { questions, isLoading, error, retry } = useQuestions({
    examId,
    numQuestions,
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isReviewIncorrect, setIsReviewIncorrect] = useState(false)
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, number>
  >({})
  const topRef = useRef<HTMLDivElement>(null)
  const pendingScrollQuestionIdRef = useRef<string | null>(null)

  const hasAnswer = (questionId: string) =>
    Object.hasOwn(selectedAnswers, questionId)

  const answeredCount = Object.keys(selectedAnswers).length
  const correctCount = questions.filter(
    (q) => hasAnswer(q.id) && selectedAnswers[q.id] === q.correctChoiceIndex
  ).length
  const progressPercent =
    questions.length > 0
      ? Math.round((answeredCount / questions.length) * 100)
      : 0
  const allAnswered = answeredCount === questions.length && questions.length > 0
  const incorrectQuestions = questions.filter(
    (q) => hasAnswer(q.id) && selectedAnswers[q.id] !== q.correctChoiceIndex
  )
  const visibleQuestions = isReviewIncorrect ? incorrectQuestions : questions
  const unansweredQuestions = questions
    .map((q, index) => ({ id: q.id, number: index + 1 }))
    .filter((q) => !hasAnswer(q.id))
  const scorePercent =
    questions.length > 0
      ? Math.round((correctCount / questions.length) * 100)
      : 0

  const totalPages = Math.ceil(visibleQuestions.length / QUESTIONS_PER_PAGE)
  const displayTotalPages = Math.max(totalPages, 1)
  const pageStartIndex = (currentPage - 1) * QUESTIONS_PER_PAGE
  const pageQuestions = visibleQuestions.slice(
    pageStartIndex,
    pageStartIndex + QUESTIONS_PER_PAGE
  )
  const paginationItems = getPaginationItems(currentPage, totalPages)

  const goToPage = useCallback(
    (page: number) => {
      if (totalPages === 0) return

      const nextPage = Math.max(1, Math.min(page, totalPages))
      setCurrentPage(nextPage)
    },
    [totalPages]
  )

  function getQuestionNumber(questionId: string): number {
    return questions.findIndex((q) => q.id === questionId) + 1
  }

  useEffect(() => {
    if (pendingScrollQuestionIdRef.current) return
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [currentPage])

  useEffect(() => {
    const targetId = pendingScrollQuestionIdRef.current
    if (!targetId) return

    const target = document.getElementById(`question-${targetId}`)
    if (!target) return

    target.scrollIntoView({ behavior: "smooth", block: "start" })
    pendingScrollQuestionIdRef.current = null
  }, [currentPage, pageQuestions])

  useEffect(() => {
    function handleKeyboardNavigation(event: KeyboardEvent) {
      const targetElement = event.target as HTMLElement | null
      const isInteractiveTarget =
        targetElement?.isContentEditable ||
        targetElement?.tagName === "INPUT" ||
        targetElement?.tagName === "TEXTAREA" ||
        targetElement?.tagName === "SELECT"

      if (
        isInteractiveTarget ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return
      }

      if (event.key === "ArrowLeft") {
        goToPage(currentPage - 1)
      }

      if (event.key === "ArrowRight") {
        goToPage(currentPage + 1)
      }
    }

    globalThis.addEventListener("keydown", handleKeyboardNavigation)
    return () => {
      globalThis.removeEventListener("keydown", handleKeyboardNavigation)
    }
  }, [currentPage, goToPage])

  function handleSelect(questionId: string, index: number) {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: index }))

    if (isSubmitted) {
      setIsSubmitted(false)
      setIsReviewIncorrect(false)
      setCurrentPage(1)
    }
  }

  function handleReset() {
    setSelectedAnswers({})
    setCurrentPage(1)
    setIsSubmitted(false)
    setIsReviewIncorrect(false)
    pendingScrollQuestionIdRef.current = null
  }

  function handleSubmit() {
    if (!allAnswered) return
    setIsSubmitted(true)
    setIsReviewIncorrect(false)
    setCurrentPage(1)
  }

  function handleReviewIncorrect() {
    if (incorrectQuestions.length === 0) return
    setCurrentPage(1)
    setIsReviewIncorrect(true)
  }

  function handleRetakeIncorrect() {
    if (incorrectQuestions.length === 0) return

    const incorrectIds = new Set(incorrectQuestions.map((q) => q.id))

    setSelectedAnswers((prev) => {
      const nextAnswers: Record<string, number> = {}

      for (const [questionId, answerIndex] of Object.entries(prev)) {
        if (!incorrectIds.has(questionId)) {
          nextAnswers[questionId] = answerIndex
        }
      }

      return nextAnswers
    })

    setCurrentPage(1)
    setIsSubmitted(false)
    setIsReviewIncorrect(false)
    pendingScrollQuestionIdRef.current = null
  }

  function handleExit() {
    if (!onExit) return

    const hasInProgressWork = answeredCount > 0 && !isSubmitted

    if (hasInProgressWork) {
      const shouldExit = globalThis.confirm(
        `You have answered ${answeredCount} question${answeredCount === 1 ? "" : "s"}. Leave this exam now?`
      )

      if (!shouldExit) {
        return
      }
    }

    onExit()
  }

  function goToQuestion(questionId: string) {
    const questionIndex = questions.findIndex((q) => q.id === questionId)
    if (questionIndex < 0) return

    const targetPage = Math.floor(questionIndex / QUESTIONS_PER_PAGE) + 1
    pendingScrollQuestionIdRef.current = questionId
    setCurrentPage(targetPage)
  }

  function goToNextUnanswered() {
    if (unansweredQuestions.length === 0) return

    const currentRangeEnd = pageStartIndex + QUESTIONS_PER_PAGE
    const nextQuestion = unansweredQuestions.find(
      (q) => q.number > currentRangeEnd
    )

    goToQuestion((nextQuestion ?? unansweredQuestions[0]).id)
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="text-sm">Loading questions...</p>
        </div>

        {["one", "two", "three"].map((skeleton) => (
          <Card key={skeleton} className="overflow-hidden">
            <CardHeader className="space-y-3">
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              <div className="h-5 w-5/6 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent className="space-y-2 pb-5">
              <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
              <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
              <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
              <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm font-medium">Could not load questions</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={retry}>
              <RotateCcw className="h-3.5 w-3.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
            <p className="text-sm font-medium">No questions available</p>
            <p className="text-sm text-muted-foreground">
              Try again in a moment.
            </p>
            <Button variant="outline" size="sm" onClick={retry}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  let borderColor: string
  let trophyColor: string
  let scoreMessage: string

  if (scorePercent >= 80) {
    borderColor = "border-green-500"
    trophyColor = "text-green-500"
    scoreMessage = "Great job! You passed."
  } else if (scorePercent >= 60) {
    borderColor = "border-yellow-500"
    trophyColor = "text-yellow-500"
    scoreMessage = "Almost there - keep studying!"
  } else {
    borderColor = "border-red-500"
    trophyColor = "text-red-500"
    scoreMessage = "Keep practicing!"
  }

  return (
    <div ref={topRef} className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-2">
          {onExit && (
            <>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={handleExit}
                aria-label="Back to exam selection"
                title="Back to exam selection"
                className="mt-0.5 sm:hidden"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExit}
                aria-label="Back to exam selection"
                title="Back to exam selection"
                className="mt-0.5 hidden gap-1.5 sm:inline-flex"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to exams
              </Button>
            </>
          )}

          <div className="ml-auto flex flex-wrap items-center gap-2 sm:justify-end">
            <Badge variant="outline" className="font-mono text-xs">
              {isSubmitted
                ? `${correctCount} / ${questions.length} correct`
                : `${answeredCount} / ${questions.length} answered`}
            </Badge>
            {isSubmitted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsSubmitted(false)
                  setIsReviewIncorrect(false)
                  setCurrentPage(1)
                }}
                className="gap-1.5"
              >
                Edit answers
              </Button>
            )}
            {answeredCount > 0 && (
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

        <div>
          <h1 className="text-xl font-bold tracking-tight">{examName}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {answeredCount} of {questions.length} questions answered
          </p>
          {isReviewIncorrect && (
            <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-300">
              Reviewing incorrect questions only
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Progress value={progressPercent} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progressPercent}% complete</span>
            <span>
              Page {currentPage} of {displayTotalPages}
            </span>
          </div>
        </div>

        {!isSubmitted && unansweredQuestions.length > 0 && (
          <div className="rounded-lg border bg-muted/30 p-2.5">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>Jump to unanswered</span>
              <span>{unansweredQuestions.length} remaining</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {unansweredQuestions.slice(0, 12).map((q) => (
                <button
                  key={q.id}
                  onClick={() => goToQuestion(q.id)}
                  className="h-7 min-w-7 rounded-full border px-2 text-xs font-medium transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {q.number}
                </button>
              ))}
              {unansweredQuestions.length > 12 && (
                <span className="inline-flex h-7 items-center rounded-full border px-2 text-xs text-muted-foreground">
                  +{unansweredQuestions.length - 12} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <Separator />

      {allAnswered && isSubmitted && (
        <Card className={cn("border-2", borderColor)}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Trophy className={cn("h-5 w-5", trophyColor)} />
                <CardTitle className="text-base">Exam Complete!</CardTitle>
              </div>
              <Badge
                variant={scorePercent >= 80 ? "default" : "destructive"}
                className="px-3 py-1 text-sm"
              >
                {scorePercent}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  {questions.length - correctCount} incorrect
                </span>
              </div>
              <p className="ml-auto text-sm text-muted-foreground">
                {scoreMessage}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleReviewIncorrect}
                disabled={incorrectQuestions.length === 0}
              >
                Review incorrect only
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRetakeIncorrect}
                disabled={incorrectQuestions.length === 0}
              >
                Retake incorrect
              </Button>
              {onExit && (
                <Button size="sm" variant="ghost" onClick={handleExit}>
                  Exit exam
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col divide-y">
        {pageQuestions.length === 0 && (
          <Card className="border-dashed bg-muted/20">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No questions to show for this view.
            </CardContent>
          </Card>
        )}

        {pageQuestions.map((q, index) => (
          <div
            key={q.id}
            id={`question-${q.id}`}
            className={cn(
              index !== 0 && "pt-10",
              index !== pageQuestions.length - 1 && "pb-10"
            )}
          >
            <MultipleChoiceQuestion
              {...q}
              questionNumber={getQuestionNumber(q.id)}
              totalQuestions={questions.length}
              selectedIndex={selectedAnswers[q.id] ?? null}
              showFeedback={isSubmitted}
              lockSelection={isSubmitted}
              onSelect={(idx) => handleSelect(q.id, idx)}
            />
          </div>
        ))}
      </div>

      {visibleQuestions.length > 0 && (
        <div className="sticky bottom-3 z-10 mt-2 rounded-xl border bg-background/95 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/75">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Page {currentPage} of {displayTotalPages}
            </span>
            {!isSubmitted && (
              <span>{unansweredQuestions.length} unanswered</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-between sm:gap-3">
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

          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            {!isSubmitted && (
              <Button
                variant="secondary"
                size="sm"
                onClick={goToNextUnanswered}
                disabled={unansweredQuestions.length === 0}
              >
                Next unanswered
              </Button>
            )}
            {!isSubmitted && (
              <Button size="sm" onClick={handleSubmit} disabled={!allAnswered}>
                Submit exam
              </Button>
            )}
          </div>

          {totalPages > 1 && (
            <nav aria-label="Page navigation" className="mt-2">
              <div className="flex items-center justify-center gap-1 overflow-x-auto pb-1">
                {paginationItems.map((item) => {
                  if (typeof item !== "number") {
                    return (
                      <span
                        key={item}
                        aria-hidden="true"
                        className="inline-flex h-8 w-8 items-center justify-center text-xs text-muted-foreground"
                      >
                        ...
                      </span>
                    )
                  }

                  return (
                    <button
                      key={item}
                      onClick={() => goToPage(item)}
                      aria-label={`Go to page ${item}`}
                      aria-current={currentPage === item ? "page" : undefined}
                      className={cn(
                        "relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors",
                        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                        currentPage === item
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {item}
                    </button>
                  )
                })}
              </div>
              <p className="mt-1 text-center text-[11px] text-muted-foreground">
                Tip: Use Left/Right arrow keys to switch pages.
              </p>
            </nav>
          )}
        </div>
      )}
    </div>
  )
}

export default QuestionList
