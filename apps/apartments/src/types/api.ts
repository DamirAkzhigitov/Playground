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
  options: QuestionOption[]
}

export type QuestionGroup = Category & {
  questions: Question[]
}

export type Apartment = {
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
  apartmentId: string
  questionId: string
  value: string | null
  note: string | null
  updatedAt: string
}

export type Photo = {
  id: string
  apartmentId: string
  questionId: string | null
  r2Key: string
  createdAt: string
}

export type ApartmentDetail = Apartment & {
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
  >
> & {
  options?: Array<Pick<QuestionOption, 'label' | 'value' | 'order'>>
}

export type ReorderQuestionInput = {
  id: string
  order: number
}

export type CreateApartmentInput = {
  title: string
  address?: string | null
  price?: number | null
  notes?: string | null
}

export type UpdateApartmentInput = Partial<CreateApartmentInput>

export type UpsertAnswerInput = {
  apartmentId: string
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
  apartmentId: string
  questionId?: string
  file: File
}

export type DeletePhotoInput = {
  id: string
  apartmentId: string
}
