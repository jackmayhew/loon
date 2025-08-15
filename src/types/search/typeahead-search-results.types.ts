import type { TypeaheadProduct } from '~/types/search/typeahead-product.types'
import type { LanguageKey } from '~/types/language/language.types'

export interface TypeaheadSearchResults {
  query: string | null
  results: TypeaheadProduct[]
  language: LanguageKey
  fetchSuccess: boolean | null
  termSubmitted?: boolean
}
