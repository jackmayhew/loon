import { ref } from 'vue'
import type { TypeaheadProduct } from '~/types/search/typeahead-product.types'

const suggestions = ref<TypeaheadProduct[]>([])
const isResultsOpen = ref<boolean>(false)
const isResultsLoading = ref<boolean>(false)
const hasError = ref<boolean>(false)

/**
 * Manages all the reactive UI state for the typeahead search feature.
 * It provides the state variables and the functions to mutate them.
 */
export function useTypeaheadState() {
  function openResults() {
    isResultsOpen.value = true
  }

  function closeResults() {
    isResultsOpen.value = false
  }

  function setLoading(loading: boolean) {
    isResultsLoading.value = loading
  }

  function setError(error: boolean) {
    hasError.value = error
  }

  function setSuggestions(newSuggestions: TypeaheadProduct[]) {
    suggestions.value = newSuggestions
  }

  return {
    // Reactive State
    suggestions,
    isResultsOpen,
    isResultsLoading,
    hasError,

    // State Mutators
    openResults,
    closeResults,
    setLoading,
    setError,
    setSuggestions,
  }
}
