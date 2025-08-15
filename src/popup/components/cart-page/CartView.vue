<script setup lang="ts">
import { Info } from 'lucide-vue-next'
import { useCartScrape } from '~/composables/popup/cart-page/use-cart-scrape'
import { useCartItemAlternatives } from '~/composables/popup/cart-page/use-cart-item-alternatives'
import ScrapedCartCardSmall from '~/popup/components/product-cards/scraped/ScrapedCartCardSmall.vue'
import AlternativeProducts from '~/popup/components/cart-page/AlternativeProducts.vue'
import CartPageAltsLoader from '~/popup/components/loaders/fetching/CartPageAltsLoader.vue'
import CartPageLoader from '~/popup/components/loaders/pages/CartPageLoader.vue'
import type { CartPageViewData, ViewData } from '~/types/view-data/view-data.types'
import type { ScrapedCartItem } from '~/types/products/scraped/scraped-cart-product.types'
import loon from '~/assets/loon.webp'

const props = defineProps<{
  initialData: ViewData | null
}>()

const emit = defineEmits(['retryScrape'])

const activeTabId = inject('activeTabId') as Ref<number>
const languageKey = computed(() => props.initialData?.retailer?.active_domain?.language)
const cartDataForComposable = computed(() => {
  if (props.initialData?.pageType === 'CART_PAGE') {
    return props.initialData as CartPageViewData
  }
  return null
})

// --- Get Cart Scrape State ---
const {
  scrapeStatus,
  cartDataItems,
  hiddenCartItems,
} = useCartScrape(cartDataForComposable)

// --- Get Alternatives State & Actions ---
const {
  // --- State ---
  fetchStatus,
  fetchUniqueId,
  sseKey,
  itemErrors,
  itemResultsLength,
  itemDisplayCount,
  noResultsOpenState,
  cartPageAltsCache,
  // --- Methods ---
  fetchCartAlternatives,
  setIsOpen,
  handleDisplayCountUpdate,
} = useCartItemAlternatives(activeTabId, cartDataItems, languageKey)

function handleRetryScrape() {
  emit('retryScrape')
}

// --- Display Logic ---

/**
 * Determines if the alternatives for a specific cart item are currently being fetched
 */
function isFetchingForItem(item: ScrapedCartItem): boolean {
  return fetchUniqueId.value === item.uniqueIdName
    && (fetchStatus.value === 'LOADING' || fetchStatus.value === 'FETCHING')
    && !itemErrors.value[item.uniqueIdName]
}

/**
 * Checks if alternatives for a specific item have been successfully fetched and are ready to display
 */
function hasResultsForItem(item: ScrapedCartItem): boolean {
  return !!cartPageAltsCache.value[item.uniqueIdName]
}

/**
 * Checks if the alternative search for an item was completed but returned no results.
 */
function hasNoResultsForItem(item: ScrapedCartItem): boolean {
  // Use `itemResultsLength` to know a search was tried and came back empty.
  // This is different from `hasResultsForItem` which checks for a populated cache
  return itemResultsLength.value[item.uniqueIdName] === 0
}

/**
 * Checks if an error occurred while fetching alternatives for a specific item
 */
function hasErrorForItem(item: ScrapedCartItem): boolean {
  return !!itemErrors.value[item.uniqueIdName]
}

const showEmptyCartMessage = computed(() => {
  return scrapeStatus.value === 'SUCCESS' && cartDataItems.value?.length === 0
})
</script>

<template>
  <div class="">
    <!-- Heading + Tooltip -->
    <div v-if="scrapeStatus !== 'SCRAPING'" class="flex items-center mb-2">
      <h4 class="section_heading mr-1">
        {{ $t('cartPage.title') }}
      </h4>
      <Tooltip :text="$t('productCard.tooltips.cartTip')" position="right" offset="1">
        <div class="rounded-full flex items-center justify-center w-5 h-5 p-0.5">
          <BaseIcon
            :icon="Info"
            :aria-label="$t('productCard.tooltips.cartTip')"
            :is-focusable="true"
            class="w-4 h-4 text-primary"
          />
        </div>
      </Tooltip>
    </div>

    <!-- Cart Items -->
    <div v-if="cartDataItems?.length">
      <div v-for="(item, index) in cartDataItems" :key="index" class="item mb-4">
        <ScrapedCartCardSmall
          :product="item"
          :cart-cache="cartPageAltsCache"
          :search-completed="hasResultsForItem(item) || hasNoResultsForItem(item)"
          :is-open="cartPageAltsCache[item.uniqueIdName]?.isOpen || noResultsOpenState[item.uniqueIdName] || false"
          :fetch-status="fetchStatus"
          @find-alternatives="fetchCartAlternatives"
          @toggle-alternatives="setIsOpen"
        />

        <!-- Cart Item Loading Alternatives -->
        <div v-if="isFetchingForItem(item)" class="mt-2">
          <CartPageAltsLoader :ui-status="sseKey" />
        </div>

        <!-- Cart Item Alternatives Fetch Result -->
        <div v-if="hasResultsForItem(item)" :class="cartPageAltsCache[item.uniqueIdName].isOpen ? 'expanded' : 'collapsed'">
          <div class="mt-2">
            <div class="alternative-item">
              <div v-if="fetchUniqueId !== item.uniqueIdName">
                <span class="section_subheading inline-block w-full truncate">
                  {{ $t('cartPage.resultsMessage', { value: item.name }) }}
                </span>
              </div>
              <!-- Cart Item Alternative Products -->
              <AlternativeProducts
                :cart-cache="cartPageAltsCache[item.uniqueIdName]"
                :item-display-count="itemDisplayCount[item.uniqueIdName] ?? 5"
                :product-id="item.uniqueIdName"
                :scraped-product="item"
              />
              <LoadMoreProducts
                v-if="(itemDisplayCount[item.uniqueIdName] ?? 5) < cartPageAltsCache[item.uniqueIdName].results.length"
                :text="$t('buttons.loadMore')"
                @click="handleDisplayCountUpdate(
                  item.uniqueIdName,
                  cartPageAltsCache[item.uniqueIdName].results.length,
                )"
              />
            </div>
          </div>
        </div>
        <!-- No results - allow open/close -->
        <div v-else-if="hasNoResultsForItem(item)" :class="noResultsOpenState[item.uniqueIdName] ? 'expanded' : 'collapsed'">
          <span class="section_subheading inline-block w-full truncate mt-2">
            {{ $t('cartPage.resultsMessage', { value: item.name }) }}
          </span>
          <p class="body_text">
            {{ $t('common.noResults') }}
          </p>
        </div>
        <div v-else-if="hasErrorForItem(item)" class="mt-2">
          <span class="section_subheading inline-block w-full truncate">
            {{ $t('cartPage.resultsMessage', { value: item.name }) }}
          </span>
          <div class="alternative-item">
            <p class="text-base font-semibold error_text">
              {{ $t('errorMessages.serverError') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Cart Scrape Loader (Triggered by Retry) -->
    <CartPageLoader v-if="scrapeStatus === 'SCRAPING'" />

    <!-- Cart Scrape Error Message and Retry Button -->
    <div v-if="scrapeStatus === 'ERROR'">
      <div class="flex flex-col">
        <p class="error_text_lg">
          {{ $t('cartPage.scrapeErrorTitle') }}
        </p>
        <p class="text-lg font-semibold text-primary">
          {{ $t('cartPage.scrapeErrorMessage') }}
        </p>
        <div class="mt-2">
          <RetryButton
            :text="$t('buttons.retry')"
            @click="handleRetryScrape"
          />
        </div>
      </div>
      <img class="w-42 absolute bottom-4 right-12 transform scale-x-[-1]" :src="loon" alt="loon">
    </div>

    <!-- No Cart Items Found -->
    <div v-if="showEmptyCartMessage">
      <p class="section_subheading">
        {{ $t('cartPage.emptyCartMessage') }}
      </p>
      <img class="w-42 absolute bottom-4 right-12 transform scale-x-[-1]" :src="loon" alt="loon">
    </div>

    <!-- Collapsed/Secondary Cart containers. Ex: Walmart 'Unavailable/Delivery/Pickup' -->
    <div v-if="hiddenCartItems">
      <h5 class="section_subheading">
        {{ $t('cartPage.collapsedCartMessage') }}
      </h5>
    </div>
  </div>
</template>

<style scoped>
.collapsed {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out;
}

.expanded {
  transition: max-height 0.3s ease-in;
}
</style>
