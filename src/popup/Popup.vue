<script setup lang="ts">
import { useTabInfo } from '~/composables/popup/main/use-tab-info'
import { usePageStatus } from '~/composables/popup/main/use-page-status'

// --- Component Imports ---
import Header from '~/popup/components/header/Header.vue'
import ProductView from '~/popup/components/product-page/ProductView.vue'
import CartView from '~/popup/components/cart-page/CartView.vue'
import BookmarksView from '~/popup/components/bookmarks-view/BookmarksView.vue'
import SearchResultsView from '~/popup/components/search-results-view/SearchResultsView.vue'
import BasicPage from '~/popup/components/basic-pages/BasicPage.vue'
import Error from '~/popup/components/basic-pages/Error.vue'
import PopupLoader from '~/popup/components/loaders/PopupLoader.vue'
import RateLimit from '~/popup/components/basic-pages/RateLimit.vue'
import ServiceUnavailable from '~/popup/components/basic-pages/ServiceUnavailable.vue'

const scrollableContainerRef = ref<HTMLElement | null>(null)

// --- Get Tab Info ---
const {
  currentUrl,
  currentTabId,
  currentHostname,
} = useTabInfo()

// --- Get Page State ---
const {
  domStatus,
  pageType,
  loadingStatus,
  isErrorState,
  popupIsRefreshing,
  activeUrl,
  viewData,
  // --- Methods ---
  handleRefresh,
  retryScrape,
  goBackToPreviousView,
  changeView,
} = usePageStatus(
  currentTabId,
  currentHostname,
  currentUrl,
)

provide('changeView', changeView)
provide('activeTabId', currentTabId)
provide('activeTabUrl', activeUrl)
</script>

<template>
  <div ref="scrollableContainerRef" class="w-100 h-120 overflow-scroll px-4 pb-4 bg-white">
    <Header
      :loading-status="loadingStatus"
      :page-type="pageType"
      :popup-is-refreshing="popupIsRefreshing"
      @refresh="handleRefresh"
    />
    <div v-if="pageType === 'RATE_LIMITED_PAGE'">
      <RateLimit @refresh="handleRefresh" />
    </div>
    <div v-else-if="pageType === 'SERVICE_UNAVAILABLE_PAGE'">
      <ServiceUnavailable @refresh="handleRefresh" />
    </div>
    <div v-else-if="loadingStatus === 'CHILD_LOADING' || !pageType">
      <PopupLoader
        :page-type="pageType"
        :loading-status="loadingStatus"
        :go-back="goBackToPreviousView"
      />
    </div>
    <div v-else-if="isErrorState">
      <Error @refresh="handleRefresh" />
    </div>
    <!--
      NOTE: This v-if chain is a deliberate choice.
      While a dynamic component could be used, this approach makes the
      unique props and events for each view more explicit and easier to
      debug. It will be refactored for better scalability as more
      views are added
    -->
    <div v-else-if="domStatus === 'DOM_LOADED'">
      <ProductView
        v-if="pageType === 'PRODUCT_PAGE'"
        :initial-data="viewData"
        @retry-scrape="retryScrape"
      />
      <CartView
        v-else-if="pageType === 'CART_PAGE'"
        :initial-data="viewData"
        @retry-scrape="retryScrape"
      />
      <BookmarksView
        v-else-if="pageType === 'BOOKMARKS_PAGE'"
        @go-back="goBackToPreviousView"
      />
      <SearchResultsView
        v-else-if="pageType === 'SEARCH_RESULTS_PAGE'"
        @go-back="goBackToPreviousView"
      />
      <BasicPage v-else :page-type="pageType" />
    </div>
    <ScrollToTopButton
      :scroll-container-element="scrollableContainerRef"
    />
  </div>
</template>
