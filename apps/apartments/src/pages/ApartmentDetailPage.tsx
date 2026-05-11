import { Link, useParams } from 'react-router-dom'

import { ErrorState } from '@/components/ErrorState'
import { LoadingState } from '@/components/LoadingState'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { useApartment } from '@/hooks'

export function ApartmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isPending, isError, error } = useApartment(id)

  return (
    <section className="space-y-4">
      <PageHeader title="Apartment Detail" />

      {isPending ? <LoadingState label="Loading apartment detail..." /> : null}
      {isError ? <ErrorState message={error.message} /> : null}

      {!isPending && !isError && data ? (
        <Card>
          <CardHeader>
            <CardTitle>{data.title}</CardTitle>
            <CardDescription>
              {data.address ?? 'No address yet'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to={`/apartments/${data.id}/inspect`}>
                Start inspection
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </section>
  )
}
