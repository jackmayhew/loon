<script setup lang="ts">
import { useProductScrape } from '~/composables/popup/product-page/use-product-scrape'
import { useProductAlternatives } from '~/composables/popup/product-page/use-product-alternatives'
import ScrapedProductErrorCard from '~/popup/components/product-cards/scraped/ScrapedProductErrorCard.vue'
import AlternativeProducts from '~/popup/components/product-page/AlternativeProducts.vue'
import ScrapedProductCardSmall from '~/popup/components/product-cards/scraped/ScrapedProductCardSmall.vue'
import ProductPageAltsLoader from '~/popup/components/loaders/fetching/ProductPageAltsLoader.vue'
import ProductPageLoader from '~/popup/components/loaders/pages/ProductPageLoader.vue'
import type { ProductPageViewData, ViewData } from '~/types/view-data/view-data.types'

const props = defineProps<{
  initialData: ViewData | null
}>()

const emit = defineEmits<{
  (e: 'retryScrape'): void
}>()

const activeTabId = inject('activeTabId') as Ref<number>
const languageKey = computed(() => props.initialData?.retailer?.active_domain?.language)
const productDataForComposable = computed(() => {
  if (props.initialData?.pageType === 'PRODUCT_PAGE') {
    return props.initialData as ProductPageViewData
  }
  return null
})

// --- Get Scrape State ---
const {
  scrapeStatus,
  scrapedProduct,
  scrapeErrorMsg,
} = useProductScrape(productDataForComposable)

// --- Get Alternatives State & Actions ---
const {
  // --- State ---
  fetchStatus,
  sseKey,
  displayCount,
  uniqueIdName,
  currentProductCacheEntry,
  currentProductCacheEntryAlts,
  // --- Methods ---
  fetchProductAlternatives,
  handleDisplayCountUpdate,
} = useProductAlternatives(activeTabId, scrapedProduct, languageKey)

function retryScrape() {
  emit('retryScrape')
}

// --- Display Logic ---

/**
 * Determines whether to show the main page loader while the initial scrape is happening
 */
const showScrapeLoader = computed(() => {
  return !scrapedProduct.value && scrapeStatus.value === 'SCRAPING'
})

/**
 * Determines whether to show the loader for alternative products.
 * This is active when we are fetching but don't have any results to show yet
 */
const showAlternativesLoader = computed(() => {
  const isLoading = fetchStatus.value === 'LOADING' || fetchStatus.value === 'UPDATING' || fetchStatus.value === 'FETCHING'
  return !currentProductCacheEntryAlts.value?.length && isLoading
})

/**
 * Determines whether to show the "No Results" message.
 * This appears only after a search successfully completes and finds nothing
 */
const showNoResultsMessage = computed(() => {
  return !currentProductCacheEntryAlts.value?.length && fetchStatus.value === 'SUCCESS'
})

/**
 * Determines whether to show the initial "Find Alternatives" button.
 * This is shown after a product is successfully scraped but before the user has searched for alternatives.
 */
const showFindAlternativesButton = computed(() => {
  return scrapedProduct.value && !currentProductCacheEntryAlts.value
    && scrapeStatus.value === 'SUCCESS' && fetchStatus.value === 'IDLE'
})

/**
 * Determines if the "Load More" button should be displayed for alternatives.
 * This requires more than a full page of results and more results available than currently displayed
 */
const canLoadMore = computed(() => {
  if (!currentProductCacheEntryAlts.value)
    return false
  const totalAlts = currentProductCacheEntryAlts.value.length
  // Ensure we have more than the initial display count and more available than currently shown.
  return totalAlts > 5 && totalAlts > displayCount.value
})
</script>

<template>
  <div class="">
    <h4 v-if="scrapeStatus !== 'SCRAPING'" class="section_heading mb-2">
      {{ $t('productPage.title') }}
    </h4>

    <!-- Scraped Product -->
    <div v-if="scrapedProduct" class="flex flex-col">
      <ScrapedProductCardSmall :product="scrapedProduct" />
    </div>

    <!-- Product Scrape Retry Loader -->
    <div v-if="showScrapeLoader" class="">
      <ProductPageLoader :loading-status="scrapeStatus" />
    </div>

    <!-- Scraped Product Error Card -->
    <div v-if="scrapeStatus === 'ERROR'">
      <ScrapedProductErrorCard />
    </div>

    <!-- Alternative Products -->
    <div v-if="currentProductCacheEntryAlts?.length" class="mt-6">
      <AlternativeProducts
        :product-cache="currentProductCacheEntry"
        :display-count="displayCount"
        :product-id="uniqueIdName"
        :scraped-product="scrapedProduct"
      />
      <LoadMoreProducts
        v-if="canLoadMore"
        :text="$t('buttons.loadMore')"
        @click="handleDisplayCountUpdate(currentProductCacheEntryAlts?.length)"
      />
    </div>

    <!-- Alternative Products Loader (Triggered by Retry) -->
    <div v-if="showAlternativesLoader" class="mt-6">
      <ProductPageAltsLoader :sse-message="sseKey" />
    </div>

    <!-- No Alternatives Found -->
    <div v-if="showNoResultsMessage" class="mt-4">
      <p class="text-lg leading-6 text-primary font-semibold text-center">
        {{ $t('common.noResults') }}
      </p>
    </div>

    <!-- Product Scrape Error -->
    <div v-if="scrapeStatus === 'ERROR'">
      <div class="mt-3">
        <p class="text-base font-semibold error_text text-center">
          {{ scrapeErrorMsg || $t('errorMessages.scrapeError') }}
        </p>
        <div class="flex justify-center mt-2">
          <RetryButton
            :text="$t('buttons.retry')"
            @click="retryScrape"
          />
        </div>
      </div>
    </div>

    <!-- Server Error -->
    <div v-if="fetchStatus === 'ERROR'" class="mt-3">
      <p class="text-base font-semibold error_text text-center">
        {{ $t('errorMessages.serverError') }}
      </p>
      <div class="flex justify-center mt-3">
        <RetryButton
          :text="$t('buttons.retry')"
          @click="fetchProductAlternatives"
        />
      </div>
    </div>

    <!-- Alternative Products Fetch Button productPageData -->
    <div v-if="showFindAlternativesButton" class="mt-4">
      <ProductFetchAltsButton
        :text="$t('buttons.findAlternatives')"
        @click="fetchProductAlternatives"
      />
    </div>
  </div>
</template>
