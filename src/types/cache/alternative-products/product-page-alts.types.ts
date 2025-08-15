import type { AlternativeProduct } from '~/types/products/alternative/alternative-product.types'
import type { MatchingTerms, PossibleTerms } from '~/types/api/common/terms.types'
import type { ProcessedScrapedProduct } from '~/types/api/common/processed-scraped.types'

export interface ProductCacheEntry {
  results: AlternativeProduct[]
  timestamp: number
  // success: boolean
  errorsOccurred: boolean | null
  matchingTerms: MatchingTerms | null
  possibleTerms: PossibleTerms | null
  processedInput: ProcessedScrapedProduct | null
}

export interface ProductPageAltsPayload {
  uniqueId: string
  results: AlternativeProduct[]
  errorsOccurred: boolean
  matchingTerms: MatchingTerms | null
  possibleTerms: PossibleTerms | null
  processedInput: ProcessedScrapedProduct | null
}

export interface ProductCache {
  [key: string]: ProductCacheEntry
}
