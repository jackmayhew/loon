<script setup lang="ts">
import AlternativeCard from '~/popup/components/product-cards/AlternativeCard.vue'
import type { CartAltCacheEntry } from '~/types/cache/alternative-products/cart-alts.types'
import type { ScrapedProduct } from '~/types/products/scraped/scraped-product.types'

const props = defineProps<{
  cartCache?: CartAltCacheEntry | null
  itemDisplayCount: number
  productId?: string
  scrapedProduct: ScrapedProduct | null
}>()
</script>

<template>
  <AlternativeCard
    v-for="(alt, index) in props.cartCache?.results.slice(0, itemDisplayCount)"
    :key="alt?.id"
    :product="alt"
    :errors-occurred="props.cartCache?.errorsOccurred"
    :product-id="props.productId"
    :index="index"
    :scraped-product="props.scrapedProduct"
    page-type="cart"
    click-origin="cart-page"
    class="mb-4"
  />
</template>
