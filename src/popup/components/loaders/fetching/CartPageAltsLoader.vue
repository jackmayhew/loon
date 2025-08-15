<script setup lang="ts">
import ProductCardLoader from '~/popup/components/product-cards/loaders/ProductCardLoader.vue'

const props = defineProps<{
  uiStatus?: string
}>()
</script>

<template>
  <span class="section_subheading inline-block w-full truncate">
    {{ props.uiStatus ? $t(`statusMessages.${props.uiStatus}`, $t('common.loading')) : $t('common.loading') }}
  </span>
  <ProductCardLoader />
</template>
