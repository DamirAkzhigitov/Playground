import type { AppLocale } from '@/i18n/locale'

export type AuthUser = {
  id: string
  email: string
  createdAt: string
  locale: AppLocale
}

export type SpecType =
  | 'text'
  | 'number'
  | 'date'
  | 'boolean'
  | 'select'
  | 'multi-select'
  | 'rating'

export type SpecValuePreference = 'higher' | 'lower'

export type SpecOption = {
  id: string
  specId: string
  label: string
  value: string
  order: number
}

export type Spec = {
  id: string
  label: string
  type: SpecType
  sectionId: string
  required: boolean
  isArchived: boolean
  order: number
  ratingMin: number | null
  ratingMax: number | null
  valuePreference: SpecValuePreference | null
  options: SpecOption[]
}

export type SpecSection = {
  id: string
  name: string
  order: number
  specs: Spec[]
}

/** @deprecated Use SpecType */
export type QuestionType = SpecType
/** @deprecated Use SpecValuePreference */
export type QuestionValuePreference = SpecValuePreference
/** @deprecated Use Spec */
export type Question = Spec
/** @deprecated Use SpecSection */
export type QuestionGroup = SpecSection

export type ItemType = {
  id: string
  slug: string
  name: string
  icon: string | null
  isSystem: boolean
  userId: string | null
  order: number
  createdAt: string
}

export type Item = {
  id: string
  itemTypeId: string
  title: string
  notes: string | null
  isPublic: boolean
  isOwner?: boolean
  createdAt: string
  updatedAt: string
  completion?: {
    answeredSpecs: number
    totalSpecs: number
    percent: number
    criticalMissingCount: number
  }
}

export type Answer = {
  id: string
  itemId: string
  specId: string
  value: string | null
  note: string | null
  updatedAt: string
}

export type Photo = {
  id: string
  itemId: string
  specId: string | null
  r2Key: string
  createdAt: string
}

export type ItemDetail = Item & {
  answers: Answer[]
  photos: Photo[]
  sections: SpecSection[]
}

export type CompareGroup = {
  id: string
  title: string
  itemTypeId: string
  isPublic: boolean
  selectionMode: 'all' | 'curated'
  createdAt: string
  updatedAt: string
  itemTypeName?: string
  itemTypeSlug?: string
  itemCount?: number
  isOwner?: boolean
}

export type CompareGroupView = {
  group: CompareGroup & { isOwner?: boolean }
  itemType: ItemType
  sections: SpecSection[]
  items: Array<
    Item & {
      answers: Answer[]
      isOwner?: boolean
    }
  >
}

export type CreateItemTypeInput = {
  name: string
  slug?: string
  icon?: string | null
}

export type CreateItemInput = {
  title: string
  itemTypeId: string
  notes?: string | null
  isPublic?: boolean
}

export type UpdateItemInput = Partial<CreateItemInput>

export type CreateCompareGroupInput = {
  title: string
  itemTypeId: string
  isPublic?: boolean
  selectionMode?: 'all' | 'curated'
}

export type UpdateCompareGroupInput = Partial<CreateCompareGroupInput>

export type UpsertAnswerInput = {
  itemId: string
  specId: string
  value: string | null
  note?: string | null
}

export type UpsertAnswerPayload =
  | { answer: UpsertAnswerInput }
  | { answers: UpsertAnswerInput[] }

export type CreateSpecInput = {
  label: string
  type: SpecType
  sectionId: string
  required: boolean
  order?: number
  ratingMin?: number | null
  ratingMax?: number | null
  valuePreference?: SpecValuePreference
  options?: Array<Pick<SpecOption, 'label' | 'value' | 'order'>>
}

export type UpdateSpecInput = Partial<
  Pick<
    Spec,
    | 'label'
    | 'type'
    | 'sectionId'
    | 'required'
    | 'isArchived'
    | 'order'
    | 'ratingMin'
    | 'ratingMax'
    | 'valuePreference'
  >
> & {
  options?: Array<Pick<SpecOption, 'label' | 'value' | 'order'>>
}

export type UploadPhotoInput = {
  itemId: string
  specId?: string
  file: File
}

export type DeletePhotoInput = {
  id: string
  itemId: string
}
