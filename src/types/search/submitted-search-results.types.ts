import type { AlternativeProduct } from '~/types/products/alternative/alternative-product.types'

export interface SubmittedSearchResults {
  results: AlternativeProduct[]
  resultsCount: number
  hasMoreResults: boolean
  // The signature of the query that generated these results
  signature: string
  fetchError: boolean | null
}
