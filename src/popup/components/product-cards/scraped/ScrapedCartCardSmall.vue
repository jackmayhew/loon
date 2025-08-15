<script setup lang="ts">
import type { ScrapedProduct } from '~/types/products/scraped/scraped-product.types'
import type { CartAlternativesCache } from '~/types/cache/alternative-products/cart-alts.types'

const props = defineProps<{
  product: ScrapedProduct
  cartCache: CartAlternativesCache
  fetchStatus: string
  searchCompleted: boolean
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'findAlternatives', id: string): void
  (e: 'toggleAlternatives', id: string): void
}>()

const product = computed(() => props.product)

const isLoading = computed(() => props.fetchStatus === 'LOADING' || props.fetchStatus === 'FETCHING')
const alternativesOpen = computed(() => props.isOpen)
const isButtonDisabled = computed(() => (isLoading.value))
const errorStatus = computed(() => props.cartCache[product.value.uniqueIdName]?.error)
const showToggleButton = computed(() => props.searchCompleted && !errorStatus.value)
</script>

<template>
  <div class="card_base">
    <div class="card_sm_img flex-shrink-0">
      <img
        v-if="product.image"
        :src="product.image"
        :alt="product.name"
        class="w-full h-full object-cover rounded-md"
        @error="product.image = undefined"
      >
      <div v-else class="w-full h-full bg-gray-100 rounded-md flex items-center justify-center text-gray-500">
        {{ $t('errorMessages.noImage') }}
      </div>
    </div>

    <div class="flex flex-col gap-2 flex-grow min-w-0">
      <div class="card_heading w-full truncate" :title="product.name">
        {{ product.name }}
      </div>
      <!-- <div class="text-sm w-fit">
        <span>Canadian Product? {{ product.madeInCanada === true ? 'Yes' : 'Not Sure' }}</span>
        <span class="flex items-center gap-1 truncate text-xs">
          <div class="rounded-full"><Tag class="w-4 h-4" /></div>
          <div class="rounded-full"><Lightbulb class="w-4 h-4" /></div>
          <div class="rounded-full"><CircleAlert class="w-4 h-4" /></div>
          <div class="rounded-full"><MessageCircle class="w-4 h-4" /></div> made in canada
        </span>
      </div> -->
      <div class="w-fit">
        <div>
          <!-- Find Products -->
          <CartFetchAltsButton
            v-if="!showToggleButton"
            :text="$t('buttons.findAlternatives')"
            :disabled="isButtonDisabled"
            @click="emit('findAlternatives', product.uniqueIdName)"
          />
          <!-- Toggle Results -->
          <CartToggleAltsButton
            v-else
            :text="alternativesOpen ? $t('buttons.hideAlternatives') : $t('buttons.showAlternatives')"
            :show-text="$t('buttons.hideAlternatives')"
            :hide-text="$t('buttons.showAlternatives')"
            :alternatives-open="alternativesOpen"
            @click="emit('toggleAlternatives', product.uniqueIdName)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
