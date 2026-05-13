export const queryKeys = {
  categories: ['categories'] as const,
  questions: ['questions'] as const,
  listings: ['listings'] as const,
  listing: (id: string) => ['listings', id] as const
}
