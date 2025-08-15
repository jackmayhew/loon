import type { ScrapedProduct } from '~/types/products/scraped/scraped-product.types'
import type { AlternativeProduct } from '~/types/products/alternative/alternative-product.types'
import type { ProcessedScrapedProduct } from '~/types/api/common/processed-scraped.types'

export interface VotePayload {
  scrapedProduct: ScrapedProduct | null
  alternativeProduct: AlternativeProduct
  processedInput: ProcessedScrapedProduct | null
  vote: 'up' | 'down'
  pageType: 'product' | 'cart'
}
