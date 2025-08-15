import { StorageSerializers } from '@vueuse/core'
import { useWebExtensionStorage } from '~/composables/use-web-extension-storage'
import type { BookmarkProductEntry } from '~/types/bookmarks/bookmark-product-entry.types'
import type { BookmarkIndexEntry } from '~/types/bookmarks/bookmark-index-entry.types'
import type { BookmarkFilters } from '~/types/bookmarks/bookmark-filters.types'

export const bookmarkedProductIndex = useWebExtensionStorage<BookmarkIndexEntry[]>('bookmarked_product_index', [], { serializer: StorageSerializers.object })
export const initialBookmarkedProductsCache = useWebExtensionStorage<BookmarkProductEntry>('initial_bookmarked_products', { results: [], language: 'en', timeStamp: null }, { serializer: StorageSerializers.object })
export const submittedBookmarkFilters = useWebExtensionStorage<BookmarkFilters>('bookmark_filters', { query: null, priceMin: null, priceMax: null, dateOrder: 'desc', alphabeticalOrder: 'desc', categories: [], manufacturers: [], provinces: [], activePromo: null, trigger: null }, { serializer: StorageSerializers.object })
