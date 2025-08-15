import type { AlternativeProduct } from '~/types/products/alternative/alternative-product.types'

export interface ProductSearchResponse {
  products: AlternativeProduct[]
  totalCountIndicator: number
}
