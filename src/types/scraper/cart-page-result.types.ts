import type { ScrapedCartItem } from '~/types/products/scraped/scraped-cart-product.types'
import type { PageType } from '~/types/view-data/page-type.types'

export interface CartData {
  retailer: string
  pageType: PageType
  items: ScrapedCartItem[]
  collapsedItems: boolean
}
