export type CompareGroupAccessRow = {
  id: string
  user_id: string
  is_public: number
}

export async function fetchCompareGroupRow(
  db: D1Database,
  id: string
): Promise<CompareGroupAccessRow | null> {
  return db
    .prepare('SELECT id, user_id, is_public FROM compare_groups WHERE id = ?')
    .bind(id)
    .first<CompareGroupAccessRow>()
}

export function canReadCompareGroup(
  row: CompareGroupAccessRow,
  userId?: string
): boolean {
  if (row.is_public === 1) {
    return true
  }
  return Boolean(userId && row.user_id === userId)
}

export function canWriteCompareGroup(
  row: CompareGroupAccessRow,
  userId: string
): boolean {
  return row.user_id === userId
}
