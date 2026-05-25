export const queryKeys = {
  actions: {
    all: ['actions'] as const,
    list: (params: Record<string, string | number | undefined>) =>
      ['actions', 'list', params] as const,
    detail: (slug: string) => ['actions', 'detail', slug] as const
  },
  enrollments: {
    all: ['enrollments'] as const,
    list: () => ['enrollments', 'list'] as const,
    detail: (id: string) => ['enrollments', 'detail', id] as const
  }
}
