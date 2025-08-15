import { sendMessage } from 'webext-bridge/popup'
import { API_ENDPOINTS } from '~/constants/api/api'
import { API_CALL } from '~/constants/system/message-types'
import { enableTypeahead } from '~/logic/storage'
import type { TypeaheadProduct } from '~/types/search/typeahead-product.types'
import type { ApiClientResponse } from '~/types/api/common/client-response.types'

/**
 * A pure API handler for the typeahead search.
 * Its only job is to fetch data or throw an error if the request fails.
 */
export function useTypeaheadAPI() {
  async function fetchSuggestions(query: string, lang: string): Promise<TypeaheadProduct[]> {
    // Don't fetch is user disabled typeahead
    // TODO: Consider passing enableTypeahead from SearchBar
    if (!enableTypeahead.value)
      return []

    const params = new URLSearchParams({ query, lang })
    const endpoint = `${API_ENDPOINTS.TYPEAHEAD_SEARCH}?${params.toString()}`

    const response = await sendMessage<ApiClientResponse<TypeaheadProduct[]>>(API_CALL, {
      key: `typeahead-${query}`,
      endpoint,
      method: 'GET',
    }, 'background')

    if (response.status === 0) {
      const abortError = new Error('Request was aborted.')
      abortError.name = 'AbortError'
      throw abortError
    }

    if (!response.ok) {
      throw new Error(response.data?.message || 'API request failed')
    }

    return response.data
  }

  return {
    fetchSuggestions,
  }
}
