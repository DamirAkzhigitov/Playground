import { useQuery } from '@tanstack/react-query'

import { apiRequest } from '../lib/api'
import type { InspectionTemplateSummary } from '../types'
import { queryKeys } from './queryKeys'

export const useInspectionTemplates = () =>
  useQuery({
    queryKey: queryKeys.inspectionTemplates,
    queryFn: () =>
      apiRequest<InspectionTemplateSummary[]>('/api/inspection-templates'),
    select: (data): InspectionTemplateSummary[] =>
      Array.isArray(data) ? data : [],
    staleTime: 60 * 60 * 1000
  })
