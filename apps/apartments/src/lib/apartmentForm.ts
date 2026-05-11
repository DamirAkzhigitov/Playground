import { z } from 'zod'

export const apartmentFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(200),
  address: z.string().max(500).optional(),
  notes: z.string().max(5000).optional(),
  price: z.string().optional()
})

export type ApartmentFormValues = z.infer<typeof apartmentFormSchema>

export function parsePriceField(raw: string | undefined): number | null {
  const t = raw?.trim() ?? ''
  if (t === '') {
    return null
  }
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

export function apartmentFormDefaults(input: {
  title: string
  address: string | null
  price: number | null
  notes: string | null
}): ApartmentFormValues {
  return {
    title: input.title,
    address: input.address ?? '',
    notes: input.notes ?? '',
    price:
      input.price !== null && input.price !== undefined
        ? String(input.price)
        : ''
  }
}
