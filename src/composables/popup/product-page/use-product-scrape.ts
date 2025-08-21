import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Ref } from 'vue'
import type { ScrapedProduct } from '~/types/products/scraped/scraped-product.types'
import type { ProductPageViewData } from '~/types/view-data/view-data.types'

/**
 * Manages the reactive state derived from the product page's initial data
 *
 * @param initialData - A reactive ref to the cached view data from the parent.
 * @returns Reactive state related to the product scrape.
 */
export function useProductScrape(
  initialData: Ref<ProductPageViewData | null>,
) {
  const { t } = useI18n()

  const scrapeStatus = computed(() => initialData.value?.scrapeStatus ?? 'WAITING')
  const isLoading = computed(() => scrapeStatus.value === 'WAITING' || scrapeStatus.value === 'SCRAPING')

  const scrapedProduct = computed<ScrapedProduct | null>(() => initialData.value?.productData?.data ?? null)

  const errorCode = computed(() => initialData.value?.errorCode ?? null)

  const scrapeErrorMsg = computed(() => {
    const code = errorCode.value
    if (!code)
      return ''
    if (code === 'MISSING_SCRAPE_DATA')
      return t('errorMessages.scrapeMissingData', 'poo loading product data. Please try again.')
    return t('errorMessages.scrapeError', 'Error loading product data. Please try again.')
  })

  return {
    scrapeStatus,
    isLoading,
    scrapedProduct,
    scrapeErrorMsg,
  }
}
