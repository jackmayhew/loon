import { ref } from 'vue'
import { bookmarkedProductIndex } from '~/logic/storage/index'
import type { AlternativeProduct } from '~/types/products/alternative/alternative-product.types'
import type { BookmarkIndexEntry } from '~/types/bookmarks/bookmark-index-entry.types'

export const bookmarkIsProcessing = ref(false)

/**
 * Handles adding and removing bookmarks from anywhere in the app.
 *
 * This is the single source of truth for bookmark actions. It uses
 * a shared `bookmarkIsProcessing` lock to prevent spam-clicking.
 *
 *  @returns An object with `addBookmark` and `removeBookmark` methods.
 */
export function useGlobalBookmarkManager() {
  function addBookmark(product: AlternativeProduct) {
    if (bookmarkIsProcessing.value)
      return
    bookmarkIsProcessing.value = true
    try {
      if (!bookmarkedProductIndex.value.some(item => item.id === product.product_id)) {
        const newBookmark: BookmarkIndexEntry = {
          id: product.product_id,
          name: product.product_name,
          price: product.current_price,
          category: product.primary_category_name,
          manufacturer: product.manufacturer_name,
          activePromo: product.activePromo !== null,
          province: product.province_origin,
          timestamp: Date.now(),
        }
        bookmarkedProductIndex.value.push(newBookmark)
      }
    }
    finally {
      bookmarkIsProcessing.value = false
    }
  }

  function removeBookmark(productId: string) {
    if (bookmarkIsProcessing.value)
      return
    bookmarkIsProcessing.value = true
    try {
      bookmarkedProductIndex.value = bookmarkedProductIndex.value.filter(item => item.id !== productId)
    }
    finally {
      bookmarkIsProcessing.value = false
    }
  }

  return {
    addBookmark,
    removeBookmark,
  }
}
