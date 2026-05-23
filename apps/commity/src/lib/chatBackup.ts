import type { ChatMessage } from '@/types'

/**
 * Cloud backup/sync is not implemented yet. This module defines the extension
 * point for exporting, importing, or syncing the local thread to a remote store.
 */
export type ChatBackupPayload = {
  version: 1
  exportedAt: string
  messages: ChatMessage[]
}

export function exportThread(messages: ChatMessage[]): ChatBackupPayload {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    messages
  }
}

export function downloadThreadBackup(messages: ChatMessage[]): void {
  const payload = exportThread(messages)
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `commity-backup-${payload.exportedAt.slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function syncToCloud(_messages: ChatMessage[]): Promise<void> {
  throw new Error('Cloud backup is not available yet')
}
