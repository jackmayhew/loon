import { useI18n } from 'vue-i18n'
import { useDebounceFn } from '@vueuse/core'
import { activeSearchQuery, typeaheadSearchResults } from '~/logic/storage/index'
import { useTypeaheadAPI } from '~/composables/popup/search/typeahead/use-typeahead-api'
import { useTypeaheadState } from '~/composables/popup/search/typeahead/use-typeahead-state'
import type { LanguageKey } from '~/types/language/language.types'

/**
 * Orchestrates the entire typeahead search feature.
 * It uses the API and State composables to manage fetching, caching,
 * debouncing, and all related business logic.
 */
export function useTypeaheadSearch() {
  const { fetchSuggestions } = useTypeaheadAPI()
  const MIN_SEARCH_QUERY_LENGTH = 3
  const canShowTypeahead = ref(true)

  const {
    // State
    suggestions,
    isResultsOpen,
    isResultsLoading,
    hasError,
    // Mutators
    openResults,
    closeResults,
    setLoading,
    setError,
    setSuggestions,
  } = useTypeaheadState()

  const { locale } = useI18n()

  function killTypeaheadDisplay() {
    canShowTypeahead.value = false
    closeResults()
  }

  /**
   * The main debounced search function. It orchestrates UI state changes
   * around the API call.
   */
  const debouncedFetchSuggestions = useDebounceFn(async (query: string) => {
    const trimmedQuery = query.trim()

    // Don't continue if the query that triggered this is no longer the active one.
    if (trimmedQuery !== activeSearchQuery.value.query?.trim())
      return

    try {
      setLoading(true)
      if (canShowTypeahead.value)
        openResults()
      setError(false)

      // Use Promise.all to ensure a minimum display time for the loader, preventing UI flashing.
      const [data] = await Promise.all([
        fetchSuggestions(trimmedQuery, locale.value),
        new Promise(resolve => setTimeout(resolve, 300)),
      ])

      // Final check: only update if the query is still the active one.
      if (trimmedQuery === activeSearchQuery.value.query?.trim()) {
        setSuggestions(data)
        // Cache the successful result
        typeaheadSearchResults.value = {
          results: data,
          query: trimmedQuery,
          language: locale.value as LanguageKey,
          fetchSuccess: true,
        }
      }
    }
    catch (err: any) {
      if (trimmedQuery === activeSearchQuery.value.query?.trim() && err.name !== 'AbortError') {
        // Ensure ui gets feedback. Pretty jank
        await new Promise(resolve => setTimeout(resolve, 300))

        // Re-check the query after the delay before setting the error
        if (trimmedQuery === activeSearchQuery.value.query?.trim()) {
          setError(true)
          setSuggestions([])
          typeaheadSearchResults.value = {
            results: [],
            query: trimmedQuery,
            language: locale.value as LanguageKey,
            fetchSuccess: false,
          }
        }
      }
    }
    finally {
      // Final check: only turn off loader for the active query.
      if (trimmedQuery === activeSearchQuery.value.query?.trim()) {
        setLoading(false)
      }
    }
  }, 300)

  /**
   * Entry point for a search triggered by user input.
   */
  function handleSearch(query: string) {
    canShowTypeahead.value = true
    if (query.length < 3) {
      closeResults()
      return
    }
    debouncedFetchSuggestions(query)
  }

  /**
   * Restores previous results from cache or re-fetches if necessary.
   */
  function restoreResults() {
    const currentQuery = activeSearchQuery.value.query

    if (!currentQuery || currentQuery.length < MIN_SEARCH_QUERY_LENGTH || isResultsLoading.value)
      return

    canShowTypeahead.value = true

    // If cache is valid for the current query and language, use it.
    if (
      typeaheadSearchResults.value.fetchSuccess
      && typeaheadSearchResults.value.query === currentQuery
      && typeaheadSearchResults.value.language === locale.value
    ) {
      setSuggestions(typeaheadSearchResults.value.results)
      openResults()
    }
    else {
      // Otherwise, trigger a new search.
      handleSearch(currentQuery)
    }
  }

  return {
    // State
    suggestions,
    isResultsOpen,
    isResultsLoading,
    hasError,
    canShowTypeahead,
    // Actions
    handleSearch,
    restoreResults,
    closeResults,
    killTypeaheadDisplay,
    debouncedFetchSuggestions,
  }
}
