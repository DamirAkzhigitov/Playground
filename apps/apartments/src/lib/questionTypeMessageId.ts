import type { MessageId } from '@/i18n/messages'
import type { QuestionType } from '@/types'

export function questionTypeMessageId(type: QuestionType): MessageId {
  switch (type) {
    case 'text':
      return 'questionType.text'
    case 'number':
      return 'questionType.number'
    case 'date':
      return 'questionType.date'
    case 'boolean':
      return 'questionType.boolean'
    case 'select':
      return 'questionType.select'
    case 'multi-select':
      return 'questionType.multiSelect'
    case 'rating':
      return 'questionType.rating'
    default:
      return 'questionType.text'
  }
}
