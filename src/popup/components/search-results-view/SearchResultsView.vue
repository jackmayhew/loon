<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import { useSearchResults } from '~/composables/popup/search/use-search-results'
import SearchCard from '~/popup/components/product-cards/SearchCard.vue'
import SearchPageLoader from '~/popup/components/loaders/pages/SearchPageLoader.vue'
import FilterDropdown from '~/popup/components/search-results-view/filter/FilterDropdown.vue'
import loon from '~/assets/loon.webp'

const emit = defineEmits(['goBack'])

function goBack() {
  emit('goBack')
}

const {
  // --- State ---
  results,
  resultsCount,
  searchQuery,
  isLoadingMore,
  loadMoreError,
  initialError,
  hasMoreResults,
  isLoading,
  // --- Methods ---
  loadMoreResults,
  retryInitialFetch,
  handleOnMounted,
} = useSearchResults()

onMounted(() => {
  handleOnMounted()
})

const displayCount = computed(() => {
  if (!results.value.length)
    return '0'
  return resultsCount.value > 100 ? '100+' : resultsCount.value.toString()
})

// --- Display Logic ---

/**
 * Determines whether to show the "No Results" message.
 * This should only appear after an initial search completes successfully but finds nothing.
 */
const showNoResultsMessage = computed(() => {
  return results.value.length === 0 && !initialError.value
})

/**
 * Determines if the "Load More" button should be displayed.
 * This requires that the API indicates more results are available, that we have
 * some results already, and that a "load more" action isn't already in progress.
 */
const canLoadMore = computed(() => {
  return hasMoreResults.value && results.value.length > 0 && !isLoadingMore.value
})
</script>

<template>
  <!-- Only 1 loader if user clicked on typeahead result -->
  <SearchPageLoader
    v-if="isLoading"
    :show-title="true"
    :count="searchQuery.productId ? 1 : 2"
    @go-back="goBack"
  />
  <div v-else>
    <h4 class="section_heading mb-2 truncate">
      {{
        $t('searchPage.title',
           { count: initialError ? 0 : resultsCount,
             display: initialError ? 0 : displayCount,
             value: searchQuery.query,
           })
      }}
    </h4>
    <!-- Back button and filters -->
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
      <FilterDropdown :current-filters="searchQuery" />
    </div>

    <!-- Results -->
    <div v-if="results.length">
      <SearchCard
        v-for="product in results"
        :key="product.id"
        :product="product"
        class="mb-4"
      />
    </div>

    <!-- No results -->
    <div v-if="showNoResultsMessage">
      <p class="section_subheading mt-4">
        {{ $t('searchPage.noResults') }}
      </p>
      <img class="w-42 absolute bottom-4 right-4 transform scale-x-[-1]" :src="loon" alt="loon logo">
    </div>

    <!-- Initial error -->
    <div v-if="initialError">
      <p class="error_text_lg mt-4">
        {{ $t('searchPage.errorTitle') }}
      </p>
      <p class="text-lg font-semibold text-primary">
        {{ $t('errorPage.message') }}
      </p>
      <RetryButton
        :text="$t('buttons.retry')"
        class="mt-2"
        @click="retryInitialFetch"
      />
      <img class="w-42 absolute bottom-4 right-4 transform scale-x-[-1]" :src="loon" alt="loon">
    </div>

    <!-- 'Load More' error -->
    <div v-if="loadMoreError" class="">
      <p class="error_text_lg my-2">
        {{ $t('searchPage.error') }}
      </p>
    </div>

    <!-- 'Load More' button -->
    <LoadMoreProducts
      v-if="canLoadMore"
      :text="$t('buttons.loadMore')"
      @click="loadMoreResults"
    />

    <!-- 'Load More' loader -->
    <SearchPageLoader
      v-if="isLoadingMore"
      :show-title="false"
      :count="2"
    />
  </div>
</template>
