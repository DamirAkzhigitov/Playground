import type { AppLocale } from '@/i18n/locale'

export type AuthUser = {
  id: string
  email: string
  createdAt: string
  locale: AppLocale
}

export type LoginInput = {
  email: string
  password: string
}

export type RegisterInput = {
  email: string
  password: string
}

export type QuestionType =
  | 'text'
  | 'number'
  | 'date'
  | 'boolean'
  | 'select'
  | 'multi-select'
  | 'rating'

/** For compare: whether larger raw values score higher, or smaller (e.g. price). */
export type QuestionValuePreference = 'higher' | 'lower'

export type Category = {
  id: string
  name: string
  order: number
}

export type QuestionOption = {
  id: string
  questionId: string
  label: string
  value: string
  order: number
}

export type Question = {
  id: string
  label: string
  type: QuestionType
  categoryId: string
  required: boolean
  isArchived: boolean
  order: number
  ratingMin: number | null
  ratingMax: number | null
  valuePreference: QuestionValuePreference | null
  options: QuestionOption[]
}

export type QuestionGroup = Category & {
  questions: Question[]
}

export type Listing = {
  id: string
  title: string
  address: string | null
  price: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
  completion?: {
    answeredQuestions: number
    totalQuestions: number
    percent: number
    criticalMissingCount: number
  }
}

export type Answer = {
  id: string
  listingId: string
  questionId: string
  value: string | null
  note: string | null
  updatedAt: string
}

export type Photo = {
  id: string
  listingId: string
  questionId: string | null
  r2Key: string
  createdAt: string
}

export type ListingDetail = Listing & {
  answers: Answer[]
  photos: Photo[]
}

export type CreateCategoryInput = {
  name: string
  order?: number
}

export type UpdateCategoryInput = Partial<Pick<Category, 'name' | 'order'>>

export type CreateQuestionInput = {
  label: string
  type: QuestionType
  categoryId: string
  required: boolean
  order?: number
  ratingMin?: number | null
  ratingMax?: number | null
  valuePreference?: QuestionValuePreference
  options?: Array<Pick<QuestionOption, 'label' | 'value' | 'order'>>
}

export type UpdateQuestionInput = Partial<
  Pick<
    Question,
    | 'label'
    | 'type'
    | 'categoryId'
    | 'required'
    | 'isArchived'
    | 'order'
    | 'ratingMin'
    | 'ratingMax'
    | 'valuePreference'
  >
> & {
  options?: Array<Pick<QuestionOption, 'label' | 'value' | 'order'>>
}

export type ReorderQuestionInput = {
  id: string
  order: number
}

export type CreateListingInput = {
  title: string
  address?: string | null
  price?: number | null
  notes?: string | null
}

export type UpdateListingInput = Partial<CreateListingInput>

export type UpsertAnswerInput = {
  listingId: string
  questionId: string
  value: string | null
  note?: string | null
}

export type UpsertAnswerPayload =
  | {
      answer: UpsertAnswerInput
    }
  | {
      answers: UpsertAnswerInput[]
    }

export type UploadPhotoInput = {
  listingId: string
  questionId?: string
  file: File
}

export type DeletePhotoInput = {
  id: string
  listingId: string
}
