import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import {
  CheckCircle2,
  XCircle,
  Info,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Question } from "@/types/question"

const CHOICE_LABELS = ["A", "B", "C", "D"]

interface MultipleChoiceQuestionProps extends Question {
  questionNumber?: number
  totalQuestions?: number
  selectedIndex: number | null
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
  onSelect,
}: MultipleChoiceQuestionProps) {
  const [showRelatedInfo, setShowRelatedInfo] = useState(false)

  const hasAnswered = selectedIndex !== null
  const answerState = !hasAnswered
    ? "unanswered"
    : selectedIndex === correctChoiceIndex
      ? "correct"
      : "incorrect"

  function handleChoiceClick(index: number) {
    if (hasAnswered) return
    onSelect?.(index)
  }

  function getChoiceState(index: number) {
    if (!hasAnswered) {
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
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              {questionNumber !== undefined && (
                <span className="text-xs font-medium text-muted-foreground">
                  Question {questionNumber}
                  {totalQuestions !== undefined ? ` of ${totalQuestions}` : ""}
                </span>
              )}
              <CardTitle className="text-base leading-snug font-semibold">
                {question}
              </CardTitle>
            </div>
            <Badge
              variant={answerState === "correct" ? "default" : "destructive"}
              className={cn("mt-0.5 shrink-0", !hasAnswered && "invisible")}
            >
              {answerState === "correct" ? "Correct" : "Incorrect"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-2">
          {choices.map((choiceText, index) => {
            const state = getChoiceState(index)
            const isCorrect = state === "correct"
            const isWrong = state === "incorrect"
            const isSelected = selectedIndex === index

            return (
              <button
                key={index}
                onClick={() => handleChoiceClick(index)}
                disabled={hasAnswered}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  !hasAnswered && "cursor-pointer hover:bg-muted/60",
                  !hasAnswered && isSelected && "border-primary bg-primary/5",
                  !hasAnswered && !isSelected && "border-border",
                  isCorrect &&
                    "border-green-500 bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300",
                  isWrong &&
                    "border-red-500 bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300",
                  hasAnswered &&
                    !isCorrect &&
                    !isWrong &&
                    "cursor-default opacity-50"
                )}
              >
                {/* Choice label bubble */}
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                    !hasAnswered && isSelected
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

                <span className="flex-1">{choiceText}</span>

                {/* Status icon */}
                {isCorrect && (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                )}
                {isWrong && (
                  <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                )}
              </button>
            )
          })}
        </CardContent>
      </Card>

      {/* Explanation Card — shown after answering */}
      {hasAnswered && (
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
      {hasAnswered && (
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
