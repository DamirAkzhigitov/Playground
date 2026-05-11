import { useParams } from 'react-router-dom'

export function InspectionPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <section className="space-y-3">
      <h1 className="text-xl font-semibold text-gray-900">Inspection</h1>
      <p className="text-sm text-gray-600">Apartment id: {id}</p>
      <p className="text-sm text-gray-600">
        Guided one-question flow lands in Phase 3.
      </p>
    </section>
  )
}
