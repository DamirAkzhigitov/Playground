import { ChevronDown, ChevronUp, Minus, Plus } from 'lucide-react'
import { useId, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { parseMultiSelect, stringifyMultiSelect } from '@/lib/answerValue'
import { cn } from '@/lib/utils'
import type { Question } from '@/types'

type AnswerFieldProps = {
  question: Question
  value: string | null
  note: string | null
  onValueChange: (value: string | null) => void
  onNoteChange: (note: string | null) => void
  noteExpanded: boolean
  onToggleNote: () => void
  density?: 'comfortable' | 'compact'
  disabled?: boolean
}

export function AnswerField({
  question,
  value,
  note,
  onValueChange,
  onNoteChange,
  onToggleNote,
  noteExpanded,
  density = 'comfortable',
  disabled = false
}: AnswerFieldProps) {
  const id = useId()
  const btnClass =
    density === 'comfortable'
      ? 'min-h-11 w-full justify-center text-base'
      : 'min-h-9 w-full justify-center text-sm'

  const ratingMin = question.ratingMin ?? 1
  const ratingMax = question.ratingMax ?? 5
  const currentRating = value !== null && value !== '' ? Number(value) : null

  const multiSelected = parseMultiSelect(value)
  const sortedOptions = [...question.options].sort((a, b) => a.order - b.order)

  const noteControl = (
    <div className="space-y-2 border-t border-border pt-3">
      <Button
        type="button"
        variant="ghost"
        className="h-auto w-full justify-between px-0 py-2 font-normal text-muted-foreground hover:text-foreground"
        onClick={onToggleNote}
        aria-expanded={noteExpanded}
      >
        <span>Extra note</span>
        {noteExpanded ? (
          <ChevronUp aria-hidden className="size-4" />
        ) : (
          <ChevronDown aria-hidden className="size-4" />
        )}
      </Button>
      {noteExpanded ? (
        <Textarea
          id={`${id}-note`}
          value={note ?? ''}
          onChange={(e) =>
            onNoteChange(e.target.value.trim() === '' ? null : e.target.value)
          }
          placeholder="Optional context for this answer…"
          disabled={disabled}
          rows={density === 'comfortable' ? 3 : 2}
          className="resize-none"
        />
      ) : null}
    </div>
  )

  let body: ReactNode

  switch (question.type) {
    case 'text':
      body = (
        <Textarea
          id={`${id}-value`}
          value={value ?? ''}
          onChange={(e) =>
            onValueChange(e.target.value.trim() === '' ? null : e.target.value)
          }
          placeholder="Your answer"
          disabled={disabled}
          rows={density === 'comfortable' ? 5 : 3}
          className="min-h-[120px] resize-none"
        />
      )
      break
    case 'number': {
      const n = value !== null && value !== '' ? Number(value) : null
      const safe = Number.isFinite(n) ? n! : 0
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11 shrink-0"
              disabled={disabled}
              aria-label="Decrease value"
              onClick={() => {
                const next = safe - 1
                onValueChange(String(next))
              }}
            >
              <Minus className="size-4" aria-hidden />
            </Button>
            <input
              id={`${id}-value`}
              type="number"
              inputMode="decimal"
              className={cn(
                'border-input bg-background ring-offset-background flex-1 rounded-md border px-3 py-2 text-center text-base tabular-nums',
                'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                disabled && 'cursor-not-allowed opacity-50'
              )}
              disabled={disabled}
              value={value ?? ''}
              onChange={(e) => {
                const raw = e.target.value
                if (raw === '') {
                  onValueChange(null)
                  return
                }
                onValueChange(raw)
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-11 shrink-0"
              disabled={disabled}
              aria-label="Increase value"
              onClick={() => {
                const next = safe + 1
                onValueChange(String(next))
              }}
            >
              <Plus className="size-4" aria-hidden />
            </Button>
          </div>
          {noteControl}
        </div>
      )
    }
    case 'boolean':
      body = (
        <div
          className="grid grid-cols-1 gap-2 sm:grid-cols-3"
          role="group"
          aria-label="Yes or no"
        >
          <Button
            type="button"
            variant={value === 'true' ? 'default' : 'outline'}
            className={btnClass}
            disabled={disabled}
            onClick={() => onValueChange('true')}
          >
            Yes
          </Button>
          <Button
            type="button"
            variant={value === 'false' ? 'default' : 'outline'}
            className={btnClass}
            disabled={disabled}
            onClick={() => onValueChange('false')}
          >
            No
          </Button>
          <Button
            type="button"
            variant={value === null || value === '' ? 'secondary' : 'outline'}
            className={btnClass}
            disabled={disabled}
            onClick={() => onValueChange(null)}
          >
            Skip
          </Button>
        </div>
      )
      break
    case 'select':
      body = (
        <div
          className="space-y-2"
          role="radiogroup"
          aria-label={question.label}
        >
          {sortedOptions.map((opt) => (
            <Button
              key={opt.id}
              type="button"
              variant={value === opt.value ? 'default' : 'outline'}
              className={btnClass}
              disabled={disabled}
              onClick={() => onValueChange(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      )
      break
    case 'multi-select':
      body = (
        <div className="space-y-3">
          {sortedOptions.map((opt) => {
            const checked = multiSelected.includes(opt.value)
            return (
              <label
                key={opt.id}
                className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-card p-3 has-[[disabled]]:cursor-not-allowed has-[[disabled]]:opacity-50"
              >
                <Checkbox
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={(c) => {
                    const set = new Set(multiSelected)
                    if (c === true) {
                      set.add(opt.value)
                    } else {
                      set.delete(opt.value)
                    }
                    const next = [...set]
                    onValueChange(
                      next.length === 0 ? null : stringifyMultiSelect(next)
                    )
                  }}
                  className="mt-0.5"
                />
                <span className="text-sm leading-snug">{opt.label}</span>
              </label>
            )
          })}
        </div>
      )
      break
    case 'rating': {
      const dots: number[] = []
      for (let i = ratingMin; i <= ratingMax; i++) {
        dots.push(i)
      }
      body = (
        <div
          className="flex flex-wrap items-center justify-center gap-2"
          role="group"
          aria-label="Rating"
        >
          {dots.map((n) => (
            <Button
              key={n}
              type="button"
              variant={currentRating === n ? 'default' : 'outline'}
              size="icon"
              className={
                density === 'comfortable'
                  ? 'size-12 text-base'
                  : 'size-9 text-sm'
              }
              disabled={disabled}
              onClick={() => onValueChange(String(n))}
              aria-label={`Rate ${n}`}
            >
              {n}
            </Button>
          ))}
        </div>
      )
      break
    }
    default:
      body = null
  }

  return (
    <div className="space-y-4">
      {question.type === 'text' ? (
        <Label htmlFor={`${id}-value`} className="sr-only">
          {question.label}
        </Label>
      ) : null}
      {body}
      {noteControl}
    </div>
  )
}
