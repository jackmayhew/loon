<script setup lang="ts">
import UnsupportedPage from '~/popup/components/basic-pages/UnsupportedPage.vue'
import UnsupportedInfoPage from '~/popup/components/basic-pages/UnsupportedInfoPage.vue'
import Error from '~/popup/components/basic-pages/Error.vue'
import type { PageType } from '~/types/view-data/page-type.types'

const props = defineProps<{
  pageType?: PageType
}>()
</script>

<template>
  <div>
    <UnsupportedInfoPage v-if="props.pageType === 'UNSUPPORTED_DOMAIN'" type="unsupportedDomain" />
    <UnsupportedInfoPage v-else-if="props.pageType === 'UNKNOWN_RETAILER_PAGE' || props.pageType === 'NON_HTTP_PAGE'" type="unsupportedRetailer" />
    <UnsupportedPage v-else-if="props.pageType === 'UNSUPPORTED_PAGE' || props.pageType === 'CART_IGNORE_PAGE' || props.pageType === 'PRODUCT_IGNORE_PAGE'" />
    <Error v-else />
  </div>
</template>
