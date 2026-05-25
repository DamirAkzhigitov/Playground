export type UserRole = 'user' | 'contributor' | 'admin'

export type AuthUser = {
  id: string
  email: string
  role: UserRole
  createdAt: string
}

export type LoginInput = {
  email: string
  password: string
}

export type RegisterInput = {
  email: string
  password: string
}

export type ActionSummary = {
  id: string
  slug: string
  title: string
  summary: string | null
  tags: string[]
  status: 'draft' | 'published'
  locale: string
  authorId: string | null
  createdAt: string
  updatedAt: string
}

export type PaginatedActions = {
  items: ActionSummary[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export type CatalogSort = 'popular' | 'newest' | 'title'

export type ActionStep = {
  id: string
  actionId: string
  order: number
  title: string
  bodyMd: string | null
  estimatedMinutes: number | null
  createdAt: string
  updatedAt: string
}

export type StepRequirement = {
  id: string
  stepId: string
  label: string
  kind: string
  details: string | null
  order: number
}

export type ActionDetail = {
  action: ActionSummary
  steps: ActionStep[]
  requirements: StepRequirement[]
}

export type StepProgressStatus = 'pending' | 'done' | 'skipped'

export type StepProgress = {
  enrollmentId: string
  stepId: string
  status: StepProgressStatus
  note: string | null
  completedAt: string | null
}

export type Enrollment = {
  id: string
  userId: string
  actionId: string
  startedAt: string
  lastStepId: string | null
  updatedAt: string
}

export type EnrollmentListItem = Enrollment & {
  actionTitle: string
  actionSlug: string
  progress: {
    done: number
    skipped: number
    stepCount: number
    percent: number
  }
  isCompleted: boolean
}

export type EnrollmentDetail = {
  enrollment: Enrollment & {
    actionTitle: string
    actionSlug: string
  }
  steps: Array<{
    id: string
    order: number
    title: string
    bodyMd: string | null
    estimatedMinutes: number | null
  }>
  progress: Record<string, StepProgress>
}
