import type { ScrapedProduct } from '~/types/products/scraped/scraped-product.types'
import type { PageType } from '~/types/view-data/page-type.types'

export interface ProductPageData {
  retailer: string
  pageType: PageType
  data: ScrapedProduct
}
