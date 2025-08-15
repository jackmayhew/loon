<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { activeSearchQuery, submittedSearchQuery } from '~/logic/storage/index'
import { useTypeaheadSearch } from '~/composables/popup/search/typeahead/use-typeahead-search'
import { useSearchResults } from '~/composables/popup/search/use-search-results'
import Results from '~/popup/components/header/search-bar/typeahead-results/Results.vue'
import SearchBarInput from '~/popup/components/header/search-bar/input/SearchBarInput.vue'
import type { PageType } from '~/types/view-data/page-type.types'
import type { TypeaheadProduct } from '~/types/search/typeahead-product.types'

const props = defineProps<{
  isViewLoading: boolean
  isDisabled: boolean
  pageType: PageType
}>()

const { fetchAndStoreResults, submitNewSearch } = useSearchResults()
const {
  // State
  suggestions,
  isResultsOpen,
  isResultsLoading,
  hasError,
  // Actions
  handleSearch,
  restoreResults,
  closeResults,
  killTypeaheadDisplay,
} = useTypeaheadSearch()

// --- Injectables and Refs ---
const changeView = inject<(newPageType: PageType) => void>('changeView', () => {})
const resultsRef = ref<HTMLElement | null>(null)
const searchBarRef = ref<HTMLElement | null>(null)

// --- Search Handlers ---
function handleSubmit(query: string) {
  submitNewSearch(query)
  if (props.pageType !== 'SEARCH_RESULTS_PAGE')
    changeView('SEARCH_RESULTS_PAGE')
  closeResults()
  killTypeaheadDisplay()
}

function handleResultSelection(result: TypeaheadProduct) {
  // 1. Update the global query state
  submittedSearchQuery.value = {
    ...submittedSearchQuery.value,
    query: result.product_name,
    productId: result.product_id,
    signature: '',
    priceMin: undefined,
    priceMax: undefined,
    provinces: [],
    promotion: undefined,
  }
  activeSearchQuery.value.query = result.product_name

  // 2. Fetch the full results for the selected product
  fetchAndStoreResults()

  // 3. Change the view if necessary
  if (props.pageType !== 'SEARCH_RESULTS_PAGE')
    changeView('SEARCH_RESULTS_PAGE')

  // 4. Close the typeahead dropdown completely
  closeResults()
  killTypeaheadDisplay()
}

// --- UI Logic ---
onClickOutside(
  resultsRef,
  () => closeResults(),
  { ignore: [searchBarRef] },
)
</script>

<template>
  <div class="flex flex-col w-full">
    <SearchBarInput
      ref="searchBarRef"
      :is-disabled="isDisabled"
      @search="handleSearch"
      @restore-results="restoreResults"
      @close-results="closeResults"
      @prevent-results="closeResults"
      @submit="handleSubmit"
    />
    <Results
      ref="resultsRef"
      :results="suggestions"
      :is-results-open="isResultsOpen"
      :is-results-loading="isResultsLoading"
      :search-attempt-errors="hasError"
      :is-view-loading="props.isViewLoading"
      @select-result="handleResultSelection"
    />
  </div>
</template>
