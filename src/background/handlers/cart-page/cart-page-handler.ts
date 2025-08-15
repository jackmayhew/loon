import { onMessage } from 'webext-bridge/background'
import { handleApiRequest } from '~/background/handlers/api-client/api-client'
import { START_CART_ITEM_ANALYSIS } from '~/constants/system/message-types'
import { API_ENDPOINTS } from '~/constants/api/api'
import type { ScrapedCartItem } from '~/types/products/scraped/scraped-cart-product.types'
import type { ApiClientResponse } from '~/types/api/common/client-response.types'
import type { LanguageKey } from '~/types/language/language.types'
import type { StartAnalysisResponse } from '~/types/api/analysis/response.types'

/**
 * Initiates the backend analysis for the provided scraped cart item.
 * Sends a POST request with the cart item data and expects a jobId and sseToken in response.
 * @param {ScrapedCartItem} cartItem - The scraped cart item object.
 * @returns {Promise<StartAnalysisResponse>} - Response indicating success ('started' with a jobId and sseToken) or an 'error'.
 */
async function cartPageApiHandler(cartItem: ScrapedCartItem, languageKey: LanguageKey): Promise<StartAnalysisResponse> {
  if (!cartItem) {
    console.error('initiateCartAnalysisHandler: Invalid cartItem input.')
    return { status: 'error', message: 'Invalid cart item received.' }
  }

  try {
    // 1. Call the handler and cast the response to the correct structured type.
    // We expect the `data` property on a successful response to contain a `jobId`.
    const response = await handleApiRequest({
      key: 'analyze-cart',
      endpoint: API_ENDPOINTS.ANALYZE_CART,
      method: 'POST',
      body: {
        product: cartItem,
        language: languageKey,
      },
    }) as ApiClientResponse<{ jobId: string, sseToken: string }>

    // 2. Handle all non-successful responses (4xx, 5xx, aborts, etc.).
    if (!response.ok) {
      // For failed responses, `response.data` is { message: string }.
      throw new Error(response.data.message || `API error! Status: ${response.status}`)
    }

    // 3. If we're here, the request was successful (`response.ok` is true).
    // TypeScript now knows `response.data` is `{ jobId: string }`.
    const jobInfo = response.data

    if (!jobInfo?.jobId || !jobInfo.sseToken) {
      throw new Error('Invalid response from API: Missing or invalid jobId or sseToken.')
    }

    return { status: 'started', jobId: jobInfo.jobId, sseToken: jobInfo.sseToken }
  }
  catch (error: any) {
    // This single catch block handles network errors and the errors we throw above.
    console.error('Cart API initiation error:', error)
    return { status: 'error', message: error.message }
  }
}

/**
 * Initializes the message listener for starting cart item analysis.
 */
export function initCartPageHandler() {
  // TODO: Type this response properly
  onMessage<any>(START_CART_ITEM_ANALYSIS, async ({ data }) => {
    const { cartItemData, languageKey } = data
    const result = await cartPageApiHandler(cartItemData, languageKey)
    return result
  })
}
