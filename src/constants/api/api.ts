const isDev = import.meta.env.DEV

export const API_BASE_URL = isDev
  ? 'http://localhost:3000/api/v1'
  : 'https://api.getloon.ca/api/v1'

export const API_ENDPOINTS = {
  // Product analysis SSE
  ANALYZE_PRODUCT: '/analysis/analyze-product',
  ANALYZE_CART: '/analysis/analyze-cart',
  ANALYSIS_STATUS: (jobId: string) => `/analysis/analyze-status/${jobId}`,

  // Analytics
  ANALYTICS_USER: '/analytics/user',
  ANALYTICS_CLICK: '/analytics/product-click',

  // Bookmark
  FETCH_BOOKMARKED_PRODUCTS: '/bookmarks/fetch-bookmarked-products',

  // Full search
  FULL_SEARCH_PRODUCTS: '/search/full-search-products',

  // Typeahead search
  TYPEAHEAD_SEARCH: '/search/typeahead-search',

  // Fetch retailers
  GET_ALL_RETAILERS: '/retailers/all',

  // ASIN
  ASIN_LOOKUP: '/asin/asin-lookup',

  // Match vote
  MATCH_VOTE: '/match-vote/submit-vote',

}
