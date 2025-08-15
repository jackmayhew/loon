import { useWebExtensionStorage } from '~/composables/use-web-extension-storage'
import type { CartAlternativesCache } from '~/types/cache/alternative-products/cart-alts.types'
import type { ProductCache } from '~/types/cache/alternative-products/product-page-alts.types'
import type { ScrapedProductCache } from '~/types/cache/scraped-products/scraped-product.types'

export const cartPageAltsCache = useWebExtensionStorage<CartAlternativesCache>('cart_page_alts', {})
export const productPageAltsCache = useWebExtensionStorage<ProductCache>('product_page_alts', {}, { deep: true })
export const scrapedProductCache = useWebExtensionStorage<ScrapedProductCache>('scraped_products', {})
