import { EN, type MessageId } from '@/i18n/messages'
import type { CatalogueSort } from '@/types/catalogue'

export type CatalogueCopyKey = CatalogueSort | 'home'

export const CATALOGUE_TITLE: Record<CatalogueCopyKey, string> = {
  home: EN['catalogue.title'],
  new: EN['catalogue.titleNew'],
  hot: EN['catalogue.titleHot'],
  popular: EN['catalogue.titlePopular']
}

export const CATALOGUE_SUBTITLE: Record<CatalogueCopyKey, string> = {
  home: EN['catalogue.subtitle'],
  new: EN['catalogue.subtitleNew'],
  hot: EN['catalogue.subtitleHot'],
  popular: EN['catalogue.subtitlePopular']
}

export const CATALOGUE_TITLE_ID: Record<CatalogueCopyKey, MessageId> = {
  home: 'catalogue.title',
  new: 'catalogue.titleNew',
  hot: 'catalogue.titleHot',
  popular: 'catalogue.titlePopular'
}

export const CATALOGUE_SUBTITLE_ID: Record<CatalogueCopyKey, MessageId> = {
  home: 'catalogue.subtitle',
  new: 'catalogue.subtitleNew',
  hot: 'catalogue.subtitleHot',
  popular: 'catalogue.subtitlePopular'
}

export function catalogueCopyKey(
  sort: CatalogueSort,
  isHome = false
): CatalogueCopyKey {
  return isHome ? 'home' : sort
}
