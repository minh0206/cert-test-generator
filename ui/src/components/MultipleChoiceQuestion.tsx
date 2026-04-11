import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Question } from "@/types/question"
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  XCircle,
} from "lucide-react"
import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const CHOICE_LABELS = ["A", "B", "C", "D"]

interface MultipleChoiceQuestionProps extends Question {
  questionNumber?: number
  totalQuestions?: number
  selectedIndex: number | null
  showFeedback?: boolean
  lockSelection?: boolean
  onSelect?: (index: number) => void
}

export function MultipleChoiceQuestion({
  question,
  choices,
  correctChoiceIndex,
  explanation,
  relatedInfo,
  questionNumber,
  totalQuestions,
  selectedIndex,
  showFeedback = true,
  lockSelection = true,
  onSelect,
}: Readonly<MultipleChoiceQuestionProps>) {
  const [showRelatedInfo, setShowRelatedInfo] = useState(false)

  const hasAnswered = selectedIndex !== null
  const shouldShowFeedback = showFeedback && hasAnswered
  let answerState: "unanswered" | "correct" | "incorrect" = "unanswered"

  if (hasAnswered && selectedIndex === correctChoiceIndex) {
    answerState = "correct"
  } else if (hasAnswered) {
    answerState = "incorrect"
  }

  function handleChoiceClick(index: number) {
    if (lockSelection) return
    onSelect?.(index)
  }

  function getChoiceState(index: number) {
    if (!shouldShowFeedback) {
      return selectedIndex === index ? "selected" : "default"
    }
    if (index === correctChoiceIndex) return "correct"
    if (index === selectedIndex) return "incorrect"
    return "default"
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-4">
      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-base">
              {questionNumber !== undefined && totalQuestions !== undefined
                ? `Question ${questionNumber}`
                : "Question"}
            </CardTitle>
            <Badge
              variant={answerState === "correct" ? "default" : "destructive"}
              className={cn(
                "mt-0.5 shrink-0",
                !shouldShowFeedback && "invisible"
              )}
            >
              {answerState === "correct" ? "Correct" : "Incorrect"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-2">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{question}</ReactMarkdown>

          {choices.map((choiceText, index) => {
            const state = getChoiceState(index)
            const isCorrect = state === "correct"
            const isWrong = state === "incorrect"
            const isSelected = selectedIndex === index

            return (
              <button
                key={`${CHOICE_LABELS[index] ?? index}-${choiceText}`}
                onClick={() => handleChoiceClick(index)}
                disabled={lockSelection}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  !lockSelection && "cursor-pointer hover:bg-muted/60",
                  !shouldShowFeedback &&
                    isSelected &&
                    "border-primary bg-primary/5",
                  !shouldShowFeedback && !isSelected && "border-border",
                  isCorrect &&
                    "border-green-500 bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300",
                  isWrong &&
                    "border-red-500 bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300",
                  shouldShowFeedback &&
                    !isCorrect &&
                    !isWrong &&
                    "cursor-default opacity-50"
                )}
              >
                {/* Choice label bubble */}
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                    !shouldShowFeedback && isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30 text-muted-foreground",
                    isCorrect &&
                      "border-green-500 bg-green-500 text-white dark:border-green-400 dark:bg-green-400",
                    isWrong &&
                      "border-red-500 bg-red-500 text-white dark:border-red-400 dark:bg-red-400"
                  )}
                >
                  {CHOICE_LABELS[index] ?? index + 1}
                </span>

                <div className="flex-1 [&_p]:m-0">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {choiceText}
                  </ReactMarkdown>
                </div>

                {/* Status icon */}
                {isCorrect && shouldShowFeedback && (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                )}
                {isWrong && shouldShowFeedback && (
                  <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                )}
              </button>
            )
          })}
        </CardContent>
      </Card>

      {/* Explanation Card — shown after answering */}
      {shouldShowFeedback && (
        <Card
          className={cn(
            "border-l-4",
            answerState === "correct"
              ? "border-l-green-500"
              : "border-l-red-500"
          )}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">
                Explanation
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {explanation}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Related Information Card — collapsible, shown after answering */}
      {shouldShowFeedback && (
        <Card>
          <CardHeader
            className="cursor-pointer pb-2"
            onClick={() => setShowRelatedInfo((prev) => !prev)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold">
                  Related Information
                </CardTitle>
              </div>
              {showRelatedInfo ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          {showRelatedInfo && (
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {relatedInfo}
              </p>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}

export default MultipleChoiceQuestion
