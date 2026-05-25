import { apiRequest } from '@/lib/api'
import type {
  ActionDetail,
  CatalogSort,
  EnrollmentDetail,
  EnrollmentListItem,
  PaginatedActions,
  StepProgress,
  StepProgressStatus
} from '@/types'

const PAGE_SIZE = 20

export const catalogSortToApi = (sort: CatalogSort): string => {
  switch (sort) {
    case 'title':
      return 'a-z'
    case 'newest':
    case 'popular':
    default:
      return 'recent'
  }
}

export type ListActionsParams = {
  q?: string
  tag?: string
  sort?: CatalogSort
  page?: number
  limit?: number
}

export async function listActions(
  params: ListActionsParams = {}
): Promise<PaginatedActions> {
  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)
  if (params.tag) search.set('tag', params.tag)
  if (params.sort) search.set('sort', catalogSortToApi(params.sort))
  if (params.page) search.set('page', String(params.page))
  search.set('limit', String(params.limit ?? PAGE_SIZE))
  const qs = search.toString()
  return apiRequest<PaginatedActions>(`/api/actions${qs ? `?${qs}` : ''}`)
}

export async function getAction(slug: string): Promise<ActionDetail> {
  return apiRequest<ActionDetail>(`/api/actions/${slug}`)
}

export async function listEnrollments(): Promise<{
  items: EnrollmentListItem[]
}> {
  return apiRequest<{ items: EnrollmentListItem[] }>('/api/enrollments')
}

export async function getEnrollment(id: string): Promise<EnrollmentDetail> {
  return apiRequest<EnrollmentDetail>(`/api/enrollments/${id}`)
}

export async function createEnrollment(
  actionId: string
): Promise<{ enrollment: EnrollmentDetail['enrollment'] }> {
  return apiRequest('/api/enrollments', {
    method: 'POST',
    body: { actionId }
  })
}

export async function deleteEnrollment(id: string): Promise<void> {
  await apiRequest(`/api/enrollments/${id}`, { method: 'DELETE' })
}

export async function patchStepProgress(
  enrollmentId: string,
  payload: {
    stepId: string
    status?: StepProgressStatus
    note?: string | null
  }
): Promise<{ progress: StepProgress }> {
  return apiRequest(`/api/enrollments/${enrollmentId}/progress`, {
    method: 'PATCH',
    body: payload
  })
}

export { PAGE_SIZE }
