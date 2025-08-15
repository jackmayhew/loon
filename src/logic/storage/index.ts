export * from './bookmarks'
export * from './product-cache'
export * from './retailers'
export * from './search'
export * from './system'
export * from './view-data'

/**
 * Pre-warms the cache for critical storage items.
 *
 * This ensures that when Vue components using these `useWebExtensionStorage`
 * refs are mounted, the data is already available synchronously. It prevents
 * a "flash" of default or empty state in the UI while waiting for the
 * initial async storage fetch to complete.
 */
export const criticalStorageKeys = [
  'submitted_search_query',
  'submitted_search_results',
  'viewDataCached',
  'bookmarked_product_index',
  'initial_bookmarked_products',
  'bookmark_filters',
]
