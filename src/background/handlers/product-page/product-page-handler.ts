import { onMessage } from 'webext-bridge/background'
import { handleApiRequest } from '~/background/handlers/api-client/api-client'
import { START_PRODUCT_ANALYSIS } from '~/constants/system/message-types'
import { API_ENDPOINTS } from '~/constants/api/api'
import type { ProductPageData } from '~/types/scraper/product-page-result.types'
import type { ApiClientResponse } from '~/types/api/common/client-response.types'
import type { LanguageKey } from '~/types/language/language.types'
import type { StartAnalysisResponse } from '~/types/api/analysis/response.types'

/**
 * Initiates the backend analysis for the provided scraped product.
 * Sends a POST request with the product data and expects a jobId and sseToken in response..
 * @param {ProductPageData} productData - The scraped product data, including product details and the active language.
 * @returns {Promise<StartAnalysisResponse>} - Response indicating success ('started' with a jobId and sseToken) or an 'error'.
 */
async function productPageApiHandler(productData: ProductPageData, languageKey: LanguageKey): Promise<StartAnalysisResponse> {
  if (!productData) {
    console.error('productPageApiHandler: Invalid product data.')
    return { status: 'error', message: 'Invalid product data received.' }
  }

  try {
    const response = await handleApiRequest({
      key: 'analyze-product',
      endpoint: API_ENDPOINTS.ANALYZE_PRODUCT,
      method: 'POST',
      body: {
        product: productData,
        language: languageKey,
      },
    }) as ApiClientResponse<{ jobId: string, sseToken: string }>

    if (!response.ok) {
      throw new Error(response.data.message || `API error! Status: ${response.status}`)
    }

    const jobInfo = response.data
    if (!jobInfo?.jobId || !jobInfo.sseToken) {
      throw new Error('Invalid response from API: Missing or invalid jobId or sseToken.')
    }

    return { status: 'started', jobId: jobInfo.jobId, sseToken: jobInfo.sseToken }
  }
  catch (error: any) {
    console.error('Product Page API initiation error:', error)
    return { status: 'error', message: error.message }
  }
}

/**
 * Initializes the message listener for starting product page analysis.
 */
export function initProductPageHandler() {
  // TODO: Type this response properly
  onMessage<any>(START_PRODUCT_ANALYSIS, async ({ data }) => {
    const { productData, languageKey } = data
    const result = await productPageApiHandler(productData, languageKey)
    return result
  })
}
