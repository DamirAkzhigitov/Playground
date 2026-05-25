export const typedRows = <T = Record<string, unknown>>(result: D1Result<T>) =>
  (result.results ?? []) as T[]

export const nowIso = () => new Date().toISOString()

export interface ActionRow {
  id: string
  slug: string
  title: string
  summary: string | null
  tags_json: string | null
  status: 'draft' | 'published'
  locale: string
  author_id: string | null
  created_at: string
  updated_at: string
}

export interface StepRow {
  id: string
  action_id: string
  order: number
  title: string
  body_md: string | null
  estimated_minutes: number | null
  created_at: string
  updated_at: string
}

export interface RequirementRow {
  id: string
  step_id: string
  label: string
  kind: string
  details: string | null
  order: number
}

export interface EnrollmentRow {
  id: string
  user_id: string
  action_id: string
  started_at: string
  last_step_id: string | null
  updated_at: string
}

export interface ProgressRow {
  enrollment_id: string
  step_id: string
  status: 'pending' | 'done' | 'skipped'
  note: string | null
  completed_at: string | null
}

export const formatAction = (row: ActionRow) => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  summary: row.summary,
  tags: row.tags_json ? (JSON.parse(row.tags_json) as string[]) : [],
  status: row.status,
  locale: row.locale,
  authorId: row.author_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

export const formatStep = (row: StepRow) => ({
  id: row.id,
  actionId: row.action_id,
  order: row.order,
  title: row.title,
  bodyMd: row.body_md,
  estimatedMinutes: row.estimated_minutes,
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

export const formatRequirement = (row: RequirementRow) => ({
  id: row.id,
  stepId: row.step_id,
  label: row.label,
  kind: row.kind,
  details: row.details,
  order: row.order
})

export const formatEnrollment = (row: EnrollmentRow) => ({
  id: row.id,
  userId: row.user_id,
  actionId: row.action_id,
  startedAt: row.started_at,
  lastStepId: row.last_step_id,
  updatedAt: row.updated_at
})

export const formatProgress = (row: ProgressRow) => ({
  enrollmentId: row.enrollment_id,
  stepId: row.step_id,
  status: row.status,
  note: row.note,
  completedAt: row.completed_at
})
