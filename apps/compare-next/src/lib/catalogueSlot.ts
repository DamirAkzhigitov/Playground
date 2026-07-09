import type { CatalogueCardSize } from '@/types/catalogue'

export function catalogueSlotClass(size: CatalogueCardSize): string {
  if (size === 'default') return 'catalogue__slot'
  return `catalogue__slot catalogue__slot--${size}`
}
