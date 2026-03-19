export interface Question {
  id: string
  question: string
  choices: string[]
  correctChoiceIndex: number
  explanation: string
  relatedInfo: string
}

export interface QuestionsResponse {
  total: number
  questions: Question[]
}
