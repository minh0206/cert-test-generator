import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useExams } from "@/hooks/useExams"
import {
  AlertCircle,
  BadgeCheck,
  Clock3,
  Fingerprint,
  ListChecks,
} from "lucide-react"
import { useState } from "react"

export interface SelectedExamConfig {
  id: string
  name: string
  numQuestions: number
}

interface ExamSelectionProps {
  readonly onStart: (config: SelectedExamConfig) => void
}

export function ExamSelection({ onStart }: ExamSelectionProps) {
  const { exams } = useExams()

  const [selectedExamId, setSelectedExamId] = useState("")

  const selectedExam = exams.find((exam) => exam.id === selectedExamId)

  function handleStart() {
    if (!selectedExam) return

    onStart({
      id: selectedExam.id,
      name: selectedExam.name,
      numQuestions: selectedExam.totalQuestions,
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Choose Your Exam</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select an exam to preview its details, then begin.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Select Exam</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Exam</p>
            <Select
              value={selectedExamId || undefined}
              onValueChange={setSelectedExamId}
            >
              <SelectTrigger className="h-10 w-full justify-between px-3">
                <SelectValue placeholder="Select an exam" />
              </SelectTrigger>
              <SelectContent position="popper" className="w-full">
                {exams.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedExam && (
        <Card className="overflow-hidden border-border shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
            <div className="space-y-1">
              <CardTitle className="text-base">{selectedExam.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {selectedExam.description}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant="secondary">{selectedExam.shortName}</Badge>
                <Badge variant="outline">{selectedExam.category}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 rounded-lg bg-muted/70 p-3 sm:grid-cols-2">
              <div className="rounded-md border border-sky-500/35 bg-sky-500/10 p-3">
                <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
                  <ListChecks className="h-4 w-4" />
                  <p className="text-xs tracking-wide uppercase">
                    Total Questions
                  </p>
                </div>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {selectedExam.totalQuestions}
                </p>
              </div>
              <div className="rounded-md border border-amber-500/35 bg-amber-500/10 p-3">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                  <Clock3 className="h-4 w-4" />
                  <p className="text-xs tracking-wide uppercase">
                    Estimated Time
                  </p>
                </div>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {selectedExam.estimatedMinutes} min
                </p>
              </div>
              <div className="rounded-md border border-emerald-500/35 bg-emerald-500/10 p-3">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <BadgeCheck className="h-4 w-4" />
                  <p className="text-xs tracking-wide uppercase">Pass Score</p>
                </div>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {selectedExam.passScorePercent}%
                </p>
              </div>
              <div className="rounded-md border border-violet-500/35 bg-violet-500/10 p-3">
                <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
                  <Fingerprint className="h-4 w-4" />
                  <p className="text-xs tracking-wide uppercase">Exam ID</p>
                </div>
                <p className="mt-2 truncate text-sm font-medium text-foreground">
                  {selectedExam.id}
                </p>
              </div>
            </div>

            {selectedExam.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedExam.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="rounded-lg border-2 border-amber-500/40 bg-amber-50/80 p-4 text-sm shadow-sm dark:bg-amber-950/25">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
                <div>
                  <p className="font-semibold tracking-wide text-amber-900 uppercase dark:text-amber-100">
                    AI-Generated Questions Disclaimer
                  </p>
                  <p className="mt-1 text-amber-900/90 dark:text-amber-100/90">
                    Questions are AI generated and may contain inaccuracies.
                    Always cross-check critical facts with official
                    certification documentation.
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={handleStart} className="w-full sm:w-auto">
              Start Exam
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ExamSelection
