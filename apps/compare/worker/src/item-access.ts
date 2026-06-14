export type ItemAccessRow = {
  id: string
  user_id: string
  is_public: number
}

export async function fetchItemRow(
  db: D1Database,
  id: string
): Promise<ItemAccessRow | null> {
  return db
    .prepare('SELECT id, user_id, is_public FROM items WHERE id = ?')
    .bind(id)
    .first<ItemAccessRow>()
}

export function canReadItem(row: ItemAccessRow, userId?: string): boolean {
  if (userId && row.user_id === userId) {
    return true
  }
  return row.is_public === 1
}

export function canWriteItem(row: ItemAccessRow, userId: string): boolean {
  return row.user_id === userId
}
