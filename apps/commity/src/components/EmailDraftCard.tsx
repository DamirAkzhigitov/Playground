import { useState } from 'react'
import { Loader2, Mail } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { connectGmailUrl, sendEmail } from '@/lib/gmail'
import type { EmailDraft } from '@/types'

type EmailDraftCardProps = {
  draft: EmailDraft
  gmailConnected: boolean
  sent: boolean
  onDraftChange: (draft: EmailDraft) => void
  onDiscard: () => void
  onSent: () => void
}

export function EmailDraftCard({
  draft,
  gmailConnected,
  sent,
  onDraftChange,
  onDiscard,
  onSent
}: EmailDraftCardProps) {
  const [local, setLocal] = useState(draft)
  const [isSending, setIsSending] = useState(false)

  const update = (patch: Partial<EmailDraft>) => {
    const next = { ...local, ...patch }
    setLocal(next)
    onDraftChange(next)
  }

  const handleSend = async () => {
    if (!gmailConnected || sent || isSending) return
    setIsSending(true)
    try {
      await sendEmail(local)
      toast.success('Email sent')
      onSent()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to send email'
      toast.error(message)
    } finally {
      setIsSending(false)
    }
  }

  if (sent) {
    return (
      <div className="mt-2 max-w-2xl rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-800 dark:text-green-200">
        <p className="font-medium">Email sent</p>
        <p className="mt-1 text-muted-foreground">
          To {local.to} — {local.subject}
        </p>
      </div>
    )
  }

  return (
    <div className="mt-2 max-w-2xl rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <Mail className="size-4" />
        Email draft — review before sending
      </div>

      {!gmailConnected ? (
        <p className="mb-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
          Connect Gmail to send. You can still edit the draft below.
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="draft-to">To</Label>
          <Input
            id="draft-to"
            value={local.to}
            onChange={(e) => update({ to: e.target.value })}
            placeholder="recipient@example.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="draft-cc">Cc (optional)</Label>
          <Input
            id="draft-cc"
            value={local.cc ?? ''}
            onChange={(e) => update({ cc: e.target.value || undefined })}
            placeholder="cc@example.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="draft-subject">Subject</Label>
          <Input
            id="draft-subject"
            value={local.subject}
            onChange={(e) => update({ subject: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="draft-body">Body</Label>
          <Textarea
            id="draft-body"
            value={local.body}
            onChange={(e) => update({ body: e.target.value })}
            rows={8}
            className="resize-y"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {gmailConnected ? (
          <Button
            type="button"
            onClick={() => void handleSend()}
            disabled={isSending || !local.to.trim() || !local.subject.trim()}
          >
            {isSending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending…
              </>
            ) : (
              'Send email'
            )}
          </Button>
        ) : (
          <Button type="button" asChild>
            <a href={connectGmailUrl()}>Connect Gmail</a>
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onDiscard}>
          Discard
        </Button>
      </div>
    </div>
  )
}
