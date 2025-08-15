<script setup lang="ts">
import ProductCardLoader from '~/popup/components/product-cards/loaders/ProductCardLoader.vue'

const props = defineProps<{
  sseMessage: string | null
}>()
</script>

<template>
  <div class="loader_screen rounded-lg h-full">
    <h4 class="section_subheading mb-2">
      {{ props.sseMessage ? $t(`statusMessages.${props.sseMessage}`, $t('common.loading')) : $t('common.loading') }}
    </h4>
    <template v-for="n in 2" :key="n">
      <ProductCardLoader class="mb-4" />
    </template>
  </div>
</template>
