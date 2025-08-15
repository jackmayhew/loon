<script setup lang="ts">
import CartPageLoader from '~/popup/components/loaders/pages/CartPageLoader.vue'
import BasicLoader from '~/popup/components/loaders/pages/BasicLoader.vue'
import ProductPageLoader from '~/popup/components/loaders/pages/ProductPageLoader.vue'
import type { PageType } from '~/types/view-data/page-type.types'
import type { LoadingStatus } from '~/types/view-data/loading-status.types'

const props = defineProps<{
  pageType?: PageType
  loadingStatus: LoadingStatus
  goBack: () => void
}>()
</script>

<template>
  <ProductPageLoader v-if="props.pageType === 'PRODUCT_PAGE'" :loading-status="loadingStatus" />
  <CartPageLoader v-else-if="props.pageType === 'CART_PAGE'" />
  <BasicLoader v-else />
</template>
