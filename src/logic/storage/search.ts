import { useWebExtensionStorage } from '~/composables/use-web-extension-storage'
import type { SearchQueryState } from '~/types/search/submitted-search-query.types'
import type { ActiveSearchDataQuery } from '~/types/search/active-search.types'
import type { SubmittedSearchResults } from '~/types/search/submitted-search-results.types'
import type { TypeaheadSearchResults } from '~/types/search/typeahead-search-results.types'

export const typeaheadSearchResults = useWebExtensionStorage<TypeaheadSearchResults>('typeahead_search_results', { query: null, results: [], language: 'en', fetchSuccess: null, termSubmitted: false })
export const enableTypeahead = useWebExtensionStorage<boolean>('enable_typeahead', false)

export const activeSearchQuery = useWebExtensionStorage<ActiveSearchDataQuery>('active_search_query', { query: null })
export const submittedSearchQuery = useWebExtensionStorage<SearchQueryState>('submitted_search_query', {
  query: null,
  language: 'en',
  productId: null,
  signature: '',
  priceMin: undefined,
  priceMax: undefined,
  provinces: [],
  promotion: null,
  trigger: 0,
})
export const submittedSearchResults = useWebExtensionStorage<SubmittedSearchResults>('submitted_search_results', {
  results: [],
  resultsCount: 0,
  hasMoreResults: false,
  signature: '',
  fetchError: null,
})
// export const submittedSearchResultsPriceRangeBounds = useWebExtensionStorage<PriceRangeBounds>('price_range_bounds', { priceMin: 2, priceMax: 101 }) // future feature
