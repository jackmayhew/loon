import { sendMessage } from 'webext-bridge/content-script'
import { API_CALL, TRACK_AMAZON_DOM_SCRAPE } from '~/constants/system/message-types'
import { API_ENDPOINTS } from '~/constants/api/api'
import type { ProductPageData } from '~/types/scraper/product-page-result.types'
import type { RainforestResponse } from '~/types/api/rainforest/response.types'
import type { ApiClientResponse } from '~/types/api/common/client-response.types'
import type { ActiveDomain } from '~/types/retailer/retailer.types'

/**
 * Enriches productData with ASIN-based info via backend proxy to Rainforest API.
 * Used for Amazon pages where DOM scraping isn't reliable.
 * Modifies productData in place. Returns true on success.
 *
 * @param doc Document to extract ASIN from.
 * @param productData Scraped product data to be updated.
 */
export async function customScrapingLogic(
  doc: Document,
  productData: ProductPageData,
  activeDomain: ActiveDomain,
): Promise<boolean> {
  // Skip api call if we have minimum required data
  if (productData.data.name && productData.data.description && productData.data.image) {
    // Track cost savings and scraper effectiveness
    sendMessage(TRACK_AMAZON_DOM_SCRAPE, {}, 'background')
    return true
  }

  // 1. Get ASIN
  const asinElement = doc.querySelector<HTMLInputElement>('input#ASIN')
  const asin = asinElement?.value

  // 1b. Get website language
  const activeLanguage = activeDomain.language

  if (!asin) {
    console.warn('customScrapingLogic: Could not find ASIN on page.')
    return false
  }

  // 2. Call API
  try {
    const response = await sendMessage<ApiClientResponse<RainforestResponse>>(API_CALL, {
      key: 'asin-lookup',
      endpoint: API_ENDPOINTS.ASIN_LOOKUP,
      method: 'POST',
      body: { asin },
    }, 'background')

    if (!response.ok) {
      console.error(`ASIN lookup failed: ${response.data.message}`)
      return false
    }

    const asinProduct = response.data

    /**
     * Merges product data fetched from the Rainforest API into `productData.data`.
     * Assumes the API handles translation and provides data for the active locale.
     * If the language is French, the `locale_name` field from the API data
     * is excluded during the merge to preserve locale name to display in UI
     */
    // Step 3. Merge data
    if (activeLanguage === 'french') {
      const { locale_name, ...rest } = asinProduct
      Object.assign(productData.data, rest)
    }
    else {
      Object.assign(productData.data, asinProduct)
    }

    return true
  }
  catch (error) {
    console.error('customScrapingLogic: Error during fetch or processing:', error)
    return false
  }
}
