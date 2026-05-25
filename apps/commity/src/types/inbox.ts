export type InboxEmail = {
  messageId: string
  threadId: string
  from: string
  to: string
  subject: string
  date: string
  snippet: string
  isStarred: boolean
  labelIds?: string[]
}
