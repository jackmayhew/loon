import type { LanguageKey } from '~/types/language/language.types'

export interface SearchQueryState {
  query: string | null
  language: LanguageKey
  productId: string | null
  signature: string
  // All filters live here
  priceMin?: number
  priceMax?: number
  provinces?: string[]
  promotion?: boolean | null
  trigger?: number
}
