import type { AlternativeProduct } from '~/types/products/alternative/alternative-product.types'
import type { MatchingTerms, PossibleTerms } from '~/types/api/common/terms.types'
import type { ProcessedScrapedProduct } from '~/types/api/common/processed-scraped.types'

export interface CartAltCacheEntry {
  results: AlternativeProduct[]
  timestamp: number
  isOpen: boolean | undefined
  error?: string
  errorsOccurred?: boolean
  matchingTerms?: MatchingTerms | null
  possibleTerms?: PossibleTerms | null
  processedInput: ProcessedScrapedProduct | null
}

export interface CartItemAltsPayload {
  uniqueId: string
  results: AlternativeProduct[]
  errorsOccurred: boolean
  matchingTerms: MatchingTerms | null
  possibleTerms: PossibleTerms | null
  processedInput: ProcessedScrapedProduct | null
}

export interface CartAlternativesCache {
  [key: string]: CartAltCacheEntry
}
