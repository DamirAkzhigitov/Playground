export const queryKeys = {
  itemTypes: ['itemTypes'] as const,
  itemTypeTemplate: (id: string) => ['itemTypes', id, 'template'] as const,
  items: (itemTypeId?: string) =>
    itemTypeId ? (['items', itemTypeId] as const) : (['items'] as const),
  item: (id: string) => ['items', id] as const,
  compareGroups: ['compareGroups'] as const,
  publicCompareGroups: ['compareGroups', 'public'] as const,
  compareGroupView: (id: string) => ['compareGroups', id, 'view'] as const
}
