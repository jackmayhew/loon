<script setup lang="ts">
import AlternativeCard from '~/popup/components/product-cards/AlternativeCard.vue'
import type { ProductCacheEntry } from '~/types/cache/alternative-products/product-page-alts.types'
import type { ScrapedProduct } from '~/types/products/scraped/scraped-product.types'

const props = defineProps<{
  productCache?: ProductCacheEntry | null
  displayCount: number
  productId?: string
  scrapedProduct: ScrapedProduct | null
}>()
</script>

<template>
  <div>
    <h4 class="section_subheading mb-2">
      {{ $t('productPage.resultsMessage') }}
    </h4>
    <AlternativeCard
      v-for="(alt, index) in props.productCache?.results.slice(0, displayCount)"
      :key="alt.id"
      :product="alt"
      :errors-occurred="props.productCache?.errorsOccurred"
      :product-id="props.productId"
      :index="index"
      :scraped-product="props.scrapedProduct"
      page-type="product"
      click-origin="product-page"
      class="mb-4"
    />
  </div>
</template>
