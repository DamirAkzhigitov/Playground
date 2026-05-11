import { Link, useParams } from 'react-router-dom'

import { ErrorState } from '../components/ErrorState'
import { LoadingState } from '../components/LoadingState'
import { useApartment } from '../hooks'

export function ApartmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isPending, isError, error } = useApartment(id)

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-gray-900">
          Apartment Detail
        </h1>
      </header>

      {isPending ? <LoadingState label="Loading apartment detail..." /> : null}
      {isError ? <ErrorState message={error.message} /> : null}

      {!isPending && !isError && data ? (
        <article className="space-y-2 rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-lg font-medium text-gray-900">{data.title}</h2>
          <p className="text-sm text-gray-600">
            {data.address ?? 'No address yet'}
          </p>
          <Link
            className="text-sm font-medium text-blue-600"
            to={`/apartments/${data.id}/inspect`}
          >
            Start inspection
          </Link>
        </article>
      ) : null}
    </section>
  )
}
