import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Mail, Trash2, Unplug } from 'lucide-react'
import { toast } from 'sonner'

import { ChatMessageItem } from '@/components/ChatMessageItem'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { downloadThreadBackup } from '@/lib/chatBackup'
import {
  clearThread,
  createMessage,
  loadThread,
  saveThread,
  sliceForApi
} from '@/lib/chatHistory'
import {
  connectGmailUrl,
  disconnectGmail,
  fetchGmailStatus,
  type ChatResponse
} from '@/lib/gmail'
import { apiRequest, ApiError } from '@/lib/api'
import type { ChatMessage } from '@/types'

type ChatPageProps = {
  userId: string
  userEmail: string
}

export function ChatPage({ userId, userEmail }: ChatPageProps) {
  const { logout } = useAuth()
  const queryClient = useQueryClient()
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    loadThread(userId)
  )
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const gmailQuery = useQuery({
    queryKey: ['gmail', 'status'],
    queryFn: fetchGmailStatus
  })

  const gmailConnected = gmailQuery.data?.connected ?? false
  const gmailEmail = gmailQuery.data?.email
  const gmailNeedsReconnect = gmailQuery.data?.needsReconnect ?? false

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const gmailParam = params.get('gmail')
    if (!gmailParam) return

    if (gmailParam === 'connected') {
      toast.success('Gmail connected')
      void queryClient.invalidateQueries({ queryKey: ['gmail', 'status'] })
    } else if (gmailParam === 'error') {
      toast.error('Gmail connection failed')
    }

    params.delete('gmail')
    const next = params.toString()
    const path = next
      ? `${window.location.pathname}?${next}`
      : window.location.pathname
    window.history.replaceState({}, '', path)
  }, [queryClient])

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, isSending])

  const persistMessages = useCallback(
    (next: ChatMessage[]) => {
      setMessages(next)
      saveThread(userId, next)
    },
    [userId]
  )

  const updateMessage = useCallback(
    (messageId: string, patch: Partial<ChatMessage>) => {
      persistMessages(
        messages.map((m) => (m.id === messageId ? { ...m, ...patch } : m))
      )
    },
    [messages, persistMessages]
  )

  const removeMessage = useCallback(
    (messageId: string) => {
      persistMessages(messages.filter((m) => m.id !== messageId))
    },
    [messages, persistMessages]
  )

  const handleSend = useCallback(async () => {
    const text = draft.trim()
    if (!text || isSending) return

    const prevMessages = messages
    const userMessage = createMessage('user', text)
    const nextMessages = [...prevMessages, userMessage]
    persistMessages(nextMessages)
    setDraft('')
    setIsSending(true)

    try {
      const data = await apiRequest<ChatResponse>('/api/chat', {
        method: 'POST',
        body: { messages: sliceForApi(nextMessages) }
      })
      const assistantMessage = createMessage(
        'assistant',
        data.message.content,
        {
          emailDraft: data.emailDraft,
          inboxEmails: data.inboxEmails
        }
      )
      const withReply = [...nextMessages, assistantMessage]
      persistMessages(withReply)

      if (data.needsReconnect) {
        toast.message('Reconnect Gmail to search and manage your inbox', {
          action: {
            label: 'Reconnect',
            onClick: () => {
              window.location.href = connectGmailUrl()
            }
          }
        })
      } else if (data.gmailRequired) {
        toast.message('Connect Gmail to send this draft', {
          action: {
            label: 'Connect',
            onClick: () => {
              window.location.href = connectGmailUrl()
            }
          }
        })
      }
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Failed to get a response'
      toast.error(msg)
      persistMessages(prevMessages)
      setDraft(text)
    } finally {
      setIsSending(false)
    }
  }, [draft, isSending, messages, persistMessages])

  const handleClear = () => {
    clearThread(userId)
    setMessages([])
    toast.success('Conversation cleared')
  }

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  const handleDisconnectGmail = async () => {
    try {
      await disconnectGmail()
      await queryClient.invalidateQueries({ queryKey: ['gmail', 'status'] })
      toast.success('Gmail disconnected')
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Failed to disconnect Gmail'
      toast.error(msg)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-4 py-3 sm:px-6">
        <div>
          <p className="text-sm font-semibold">Commity</p>
          <p className="text-xs text-muted-foreground">{userEmail}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {gmailConnected && gmailEmail ? (
            <div className="flex items-center gap-2">
              {gmailNeedsReconnect ? (
                <Button type="button" variant="outline" size="sm" asChild>
                  <a href={connectGmailUrl()}>Reconnect Gmail</a>
                </Button>
              ) : null}
              <div className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
                <Mail className="size-3.5" />
                <span className="max-w-[12rem] truncate">{gmailEmail}</span>
                <button
                  type="button"
                  className="ml-1 rounded p-0.5 hover:bg-muted"
                  title="Disconnect Gmail"
                  onClick={() => void handleDisconnectGmail()}
                >
                  <Unplug className="size-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <Button type="button" variant="outline" size="sm" asChild>
              <a href={connectGmailUrl()}>
                <Mail className="size-3.5" />
                Connect Gmail
              </a>
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLogout}
          >
            Sign out
          </Button>
        </div>
      </header>
      <div className="flex shrink-0 items-center justify-end gap-2 border-b px-4 py-2 sm:px-6">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => downloadThreadBackup(messages)}
          disabled={messages.length === 0}
        >
          Export backup
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={messages.length === 0}
        >
          <Trash2 className="size-4" />
          Clear
        </Button>
      </div>

      <div
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6"
      >
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            Start a conversation. With Gmail connected, ask me to search your
            inbox, star or trash messages, or draft an email — you confirm
            before anything is sent.
          </p>
        ) : (
          <ul className="mx-auto flex max-w-2xl flex-col gap-3">
            {messages.map((msg) => (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                gmailConnected={gmailConnected}
                onUpdate={(patch) => updateMessage(msg.id, patch)}
                onRemove={() => removeMessage(msg.id)}
              />
            ))}
            {isSending ? (
              <li className="mr-auto flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Thinking…
              </li>
            ) : null}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t bg-background px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-2xl gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message…"
            rows={2}
            disabled={isSending}
            className="min-h-[2.75rem] resize-none"
          />
          <Button
            type="button"
            onClick={() => void handleSend()}
            disabled={isSending || !draft.trim()}
            className="shrink-0 self-end"
          >
            Send
          </Button>
        </div>
        <p className="mx-auto mt-2 max-w-2xl text-center text-xs text-muted-foreground">
          Sends up to 20 recent messages to the assistant. Inbox actions run
          when Gmail is connected; email sends still require your confirmation.
        </p>
      </div>
    </div>
  )
}
