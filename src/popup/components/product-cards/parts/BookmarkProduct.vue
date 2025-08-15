<script setup lang="ts">
import { computed } from 'vue'
import { bookmarkIsProcessing, useGlobalBookmarkManager } from '~/composables/popup/bookmark/use-global-bookmark-manager'
import { bookmarkedProductIndex } from '~/logic/storage/index'
import type { AlternativeProduct } from '~/types/products/alternative/alternative-product.types'

const props = defineProps<{
  product: AlternativeProduct
}>()

const { addBookmark, removeBookmark } = useGlobalBookmarkManager()

const productId = computed(() => props.product.product_id)
const isBookmarked = computed(() =>
  bookmarkedProductIndex.value.some(item => item.id === productId.value),
)

function toggleBookmark() {
  if (isBookmarked.value) {
    removeBookmark(productId.value)
  }
  else {
    addBookmark(props.product)
  }
}
</script>

<template>
  <BaseButton
    :aria-label="isBookmarked ? $t('accessibility.bookmarkButtonRemove') : $t('accessibility.bookmarkButtonSave')"
    class="flex items-center justify-center w-10 h-full rounded transition-colors duration-300 ease-in-out"
    :class="[
      isBookmarked
        ? 'button_primary_bg hover:button_primary_bg_hover'
        : 'bg-gray-100 hover:bg-gray-200',
    ]"
    :disabled="bookmarkIsProcessing"
    @click="toggleBookmark"
  >
    <AnimatedBookmark
      :is-bookmarked="isBookmarked"
      class="w-4.5 h-4.5"
      :class="isBookmarked ? 'text-neutral-200' : 'text-primary'"
    />
  </BaseButton>
</template>
