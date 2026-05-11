import { Link } from 'react-router-dom'

import { ErrorState } from '../components/ErrorState'
import { LoadingState } from '../components/LoadingState'
import { useApartments } from '../hooks'

export function ApartmentsPage() {
  const { data, isPending, isError, error } = useApartments()

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Apartments</h1>
        <Link
          className="text-sm font-medium text-blue-600"
          to="/apartments/new"
        >
          New
        </Link>
      </header>

      {isPending ? <LoadingState label="Loading apartments..." /> : null}
      {isError ? <ErrorState message={error.message} /> : null}

      {!isPending && !isError ? (
        <ul className="space-y-2">
          {(data ?? []).map((apartment) => (
            <li
              key={apartment.id}
              className="rounded-lg border border-gray-200 bg-white p-3"
            >
              <Link
                className="font-medium text-gray-900"
                to={`/apartments/${apartment.id}`}
              >
                {apartment.title}
              </Link>
              <p className="text-sm text-gray-600">
                {apartment.address ?? 'No address yet'}
              </p>
            </li>
          ))}
          {(data ?? []).length === 0 ? (
            <li className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
              No apartments yet.
            </li>
          ) : null}
        </ul>
      ) : null}
    </section>
  )
}
