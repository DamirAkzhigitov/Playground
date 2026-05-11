export const queryKeys = {
  categories: ['categories'] as const,
  questions: ['questions'] as const,
  apartments: ['apartments'] as const,
  apartment: (id: string) => ['apartments', id] as const
}
