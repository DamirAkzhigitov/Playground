import { useMemo } from 'react'

import { cn } from '@/lib/utils'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderMarkdown(md: string): string {
  const escaped = escapeHtml(md.trim())
  const withBlocks = escaped
    .split(/\n\n+/)
    .map((block) => {
      const lines = block.split('\n')
      if (lines.every((l) => /^[-*]\s+/.test(l))) {
        const items = lines
          .map((l) => l.replace(/^[-*]\s+/, ''))
          .map((l) => `<li>${inlineFormat(l)}</li>`)
          .join('')
        return `<ul class="list-disc pl-5 space-y-1">${items}</ul>`
      }
      if (lines.length === 1 && /^#{1,3}\s+/.test(lines[0]!)) {
        const level = lines[0]!.match(/^#+/)![0]!.length
        const text = lines[0]!.replace(/^#{1,3}\s+/, '')
        const tag = level === 1 ? 'h3' : level === 2 ? 'h4' : 'h5'
        return `<${tag} class="font-semibold mt-4 mb-2">${inlineFormat(text)}</${tag}>`
      }
      return `<p class="leading-relaxed">${lines.map(inlineFormat).join('<br />')}</p>`
    })
    .join('')

  return withBlocks
}

function inlineFormat(text: string): string {
  return text
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline">$1</a>'
    )
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
}

type MarkdownBodyProps = {
  content: string
  className?: string
}

export function MarkdownBody({ content, className }: MarkdownBodyProps) {
  const html = useMemo(() => renderMarkdown(content || ''), [content])

  return (
    <div
      className={cn(
        'prose-steps text-sm text-foreground [&_a]:break-words [&_p+p]:mt-3',
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
