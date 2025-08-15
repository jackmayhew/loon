<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import { useBookmarkProducts } from '~/composables/popup/bookmark/use-bookmarked-products'
import BookmarkCard from '~/popup/components/product-cards/BookmarkCard.vue'
import BookmarkPageLoader from '~/popup/components/loaders/pages/BookmarkPageLoader.vue'
import FilterDropdown from '~/popup/components/bookmarks-view/filter/FilterDropdown.vue'
import loon from '~/assets/loon.webp'

const emit = defineEmits(['goBack'])

function goBack() {
  emit('goBack')
}

const {
  // --- State ---
  products,
  bookmarksCount,
  triggerLoadMoreLoader,
  isLoading,
  fetchError,
  loadedCount,
  loadMoreError,
  // --- Methods ---
  handleOnMounted,
  retryFetch,
  loadMore,
  fetchOnSortOrder,
} = useBookmarkProducts()

onMounted(() => {
  handleOnMounted()
})

// --- Display Logic ---

/**
 * Checks if there are products to display.
 * This is used to conditionally show UI elements like the sort dropdown.
 */
const hasProducts = computed(() => products.value.length > 0 && !fetchError.value)

/**
 * Determines whether to show the "No Bookmarks" message.
 * This appears when the user has no bookmarks and there are no active errors.
 */
const showNoBookmarksMessage = computed(() => {
  return !bookmarksCount.value && !fetchError.value && !loadMoreError.value
})

/**
 * Determines if the specific error message for a failed "Load More" action should be shown.
 * This prevents the error from showing while the load more loader is active.
 */
const showLoadMoreError = computed(() => {
  return loadMoreError.value && !triggerLoadMoreLoader.value
})

/**
 * Determines if the "Load More" button should be displayed.
 * This requires that there are more bookmarks available to load and that no other
 * loading or error state is currently active.
 */
const canLoadMore = computed(() => {
  return loadedCount.value < bookmarksCount.value
    && !triggerLoadMoreLoader.value
    && !fetchError.value
    && !isLoading.value
})
</script>

<template>
  <BookmarkPageLoader
    v-if="isLoading"
    :show-title="true"
    :count="2"
    @go-back="goBack"
  />
  <div v-else>
    <div class="">
      <h4 class="section_heading mb-2">
        <span v-if="products.length && !fetchError">
          {{ $t('bookmarkPage.title', bookmarksCount) }}
        </span>
        <span v-else>
          {{ $t('bookmarkPage.basicTitle', bookmarksCount) }}
        </span>
      </h4>

      <!-- Back button and sort toggle -->
      <div class="flex w-full justify-between items-center mb-2 relative">
        <BaseButton
          :aria-label="$t('buttons.goBack')"
          class="group flex gap-1 items-center"
          @click="goBack"
        >
          <BaseIcon
            :icon="ArrowLeft"
            class="w-4.5 h-4.5 group-hover:-translate-x-0.25 transition-transform duration-150"
          />
          <span class="text-sm">{{ $t('buttons.goBack') }}</span>
        </BaseButton>

        <!-- Sort bookmarks toggle -->
        <div v-if="hasProducts" class="flex items-center text-sm gap-1">
          <FilterDropdown
            @apply-sort="fetchOnSortOrder"
            @clear-sort="fetchOnSortOrder"
          />
        </div>
      </div>
    </div>

    <!-- Errors -->
    <div v-if="fetchError">
      <p class="error_text_lg mt-4">
        {{ $t('bookmarkPage.errorTitle') }}
      </p>
      <p class="text-lg font-semibold text-primary">
        {{ $t('bookmarkPage.errorMessage') }}
      </p>
      <RetryButton
        :text="$t('buttons.retry')"
        class="mt-2"
        @click="retryFetch"
      />
      <img class="w-36 absolute bottom-4 right-4 transform scale-x-[-1]" :src="loon" alt="loon">
    </div>

    <!-- Bookmarks -->
    <div v-else-if="products.length > 0">
      <BookmarkCard
        v-for="product in products"
        :key="product.id"
        :product="product"
        class="mb-4"
      />
    </div>

    <!-- No bookmarks -->
    <div v-if="showNoBookmarksMessage" class="mt-4">
      <p class="section_subheading">
        {{ $t('bookmarkPage.noBookmarksTitle') }}
      </p>
      <p class="text-sm mt-1">
        {{ $t('bookmarkPage.noBookmarksMessage') }}
      </p>
      <img class="w-36 absolute bottom-4 right-4 transform scale-x-[-1]" :src="loon" alt="loon">
    </div>

    <!-- 'Load More' error -->
    <div v-if="showLoadMoreError">
      <p class="error_text_lg my-2">
        {{ $t('bookmarkPage.error') }}
      </p>
    </div>

    <!-- 'Load More' button -->
    <LoadMoreProducts
      v-if="canLoadMore"
      :text="$t('buttons.loadMore')"
      @click="loadMore"
    />

    <!-- 'Load More' loader -->
    <BookmarkPageLoader
      v-if="triggerLoadMoreLoader"
      :show-title="false"
      :count="2"
    />
  </div>
</template>
