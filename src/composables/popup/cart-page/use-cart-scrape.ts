import { computed } from 'vue'
import type { Ref } from 'vue'
import type { ScrapedCartItem } from '~/types/products/scraped/scraped-cart-product.types'
import type { CartPageViewData } from '~/types/view-data/view-data.types'

/**
 * Manages the reactive state derived from the cart page's initial data.
 *
 * @param initialData - A reactive ref to the cached view data from the parent.
 * @returns Reactive state related to the cart scrape.
 */
export function useCartScrape(
  initialData: Ref<CartPageViewData | null>,
) {
  const scrapeStatus = computed(() => initialData.value?.scrapeStatus ?? 'WAITING')
  const cartDataItems = computed<ScrapedCartItem[]>(() => initialData.value?.items ?? [])
  const hiddenCartItems = computed(() => initialData.value?.collapsedItems ?? false)
  const isLoading = computed(() => scrapeStatus.value === 'WAITING' || scrapeStatus.value === 'SCRAPING')

  return {
    scrapeStatus,
    cartDataItems,
    hiddenCartItems,
    isLoading,
  }
}
