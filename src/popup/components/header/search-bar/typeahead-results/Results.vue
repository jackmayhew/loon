<script setup lang="ts">
import { enableTypeahead } from '~/logic/storage/index'
import ResultsCardLoader from '~/popup/components/header/search-bar/typeahead-results/cards/ResultsCardLoader.vue'
import ResultsCard from '~/popup/components/header/search-bar/typeahead-results/cards/ResultsCard.vue'
import ResultsCardEmpty from '~/popup/components/header/search-bar/typeahead-results/cards/ResultsCardEmpty.vue'
import type { TypeaheadProduct } from '~/types/search/typeahead-product.types'

defineProps<{
  results: TypeaheadProduct[]
  isResultsOpen: boolean
  isResultsLoading: boolean
  searchAttemptErrors: boolean
  isViewLoading: boolean
}>()

const emit = defineEmits(['select-result'])
</script>

<template>
  <Transition name="scale-fade">
    <ul
      v-if="isResultsOpen && enableTypeahead"
      class="w-full absolute top-17 left-0 right-0 z-10 bg-white rounded-md shadow-lg border"
    >
      <!-- Loading State -->
      <template v-if="isResultsLoading">
        <ResultsCardLoader :count="5" />
      </template>

      <!-- Error State -->
      <template v-else-if="searchAttemptErrors">
        <ResultsCardEmpty
          :message="$t('header.errorMessage')"
          is-error
        />
      </template>

      <!-- Success State: Has Results -->
      <template v-else-if="results.length > 0">
        <ResultsCard
          v-for="result in results"
          :key="result.product_id"
          :result="result"
          @select-result="product => emit('select-result', product)"
        />
      </template>

      <!-- Success State: No Results Found -->
      <template v-else>
        <ResultsCardEmpty :message="$t('header.noResults')" />
      </template>
    </ul>
  </Transition>
</template>
