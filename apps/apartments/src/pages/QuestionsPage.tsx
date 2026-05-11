import { ErrorState } from '../components/ErrorState'
import { LoadingState } from '../components/LoadingState'
import { useQuestions } from '../hooks'

export function QuestionsPage() {
  const { data, isPending, isError, error } = useQuestions()

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">
        Question Management
      </h1>
      {isPending ? <LoadingState label="Loading questions..." /> : null}
      {isError ? <ErrorState message={error.message} /> : null}
      {!isPending && !isError ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
          Active questions fetched: {(data ?? []).length}
        </div>
      ) : null}
    </section>
  )
}
