import type { AlternativeProduct } from '~/types/products/alternative/alternative-product.types'
import type { LanguageKey } from '~/types/language/language.types'

export interface BookmarkProductEntry {
  results: AlternativeProduct[]
  language: LanguageKey
  timeStamp: number | null
}
