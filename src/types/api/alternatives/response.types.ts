import type { AlternativeProduct } from '~/types/products/alternative/alternative-product.types'
import type { ProcessedScrapedProduct } from '~/types/api/common/processed-scraped.types'

// Vector embedding match in api
interface RankedTerm {
  term_id: string
  name: string
  similarity: number
}

export interface FindAlternativesResult {
  errorsOccurred: boolean
  alternativeProducts: AlternativeProduct[]
  possibleTerms: RankedTerm[]
  matchingTerms: RankedTerm[]
  processedInput: ProcessedScrapedProduct | null
}
