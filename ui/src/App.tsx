import ExamSelection, {
  type SelectedExamConfig,
} from "@/components/ExamSelection"
import { useState } from "react"
import QuestionList from "./components/QuestionList"

export function App() {
  const [selectedExam, setSelectedExam] = useState<SelectedExamConfig | null>(
    null
  )

  return (
    <div className="min-h-svh bg-background px-4 py-10">
      {selectedExam ? (
        <QuestionList
          key={selectedExam.id}
          examId={selectedExam.id}
          examName={selectedExam.name}
          numQuestions={selectedExam.numQuestions}
          onExit={() => setSelectedExam(null)}
        />
      ) : (
        <ExamSelection onStart={setSelectedExam} />
      )}
    </div>
  )
}

export default App
