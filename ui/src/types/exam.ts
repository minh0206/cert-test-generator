export interface Exam {
  id: string
  name: string
  shortName: string
  description: string
  category: string
  totalQuestions: number
  estimatedMinutes: number
  passScorePercent: number
  tags: readonly string[]
}
