<script setup lang="ts">
import { ThumbsDown, ThumbsUp } from 'lucide-vue-next'
import { sendMessage } from 'webext-bridge/popup'
import { API_CALL } from '~/constants/system/message-types'
import { API_ENDPOINTS } from '~/constants/api/api'
import { cartPageAltsCache, productPageAltsCache } from '~/logic/storage/index'

import type { ScrapedProduct } from '~/types/products/scraped/scraped-product.types'
import type { AlternativeProduct } from '~/types/products/alternative/alternative-product.types'
import type { CartAlternativesCache } from '~/types/cache/alternative-products/cart-alts.types'
import type { ProductCache } from '~/types/cache/alternative-products/product-page-alts.types'
import type { VotePayload } from '~/types/api/product-vote/payload.types'
import type { ApiClientResponse } from '~/types/api/common/client-response.types'

const props = defineProps<{
  productId?: string
  index?: number
  scrapedProduct: ScrapedProduct | null
  alternativeProduct: AlternativeProduct
  pageType: 'product' | 'cart'
}>()

const activeCache = computed(() => {
  return props.pageType === 'cart'
    ? cartPageAltsCache.value as CartAlternativesCache
    : productPageAltsCache.value as ProductCache
})

async function onVoteChanged(newVote: 'up' | 'down') {
  if (!props.productId || props.index === undefined)
    return

  const cacheEntry = activeCache.value[props.productId]

  if (!cacheEntry || !cacheEntry.results) {
    return
  }

  const voteResult: VotePayload = {
    scrapedProduct: props.scrapedProduct,
    alternativeProduct: props.alternativeProduct,
    processedInput: cacheEntry.processedInput,
    vote: newVote,
    pageType: props.pageType,
  }

  sendMessage<ApiClientResponse<void>>(API_CALL, {
    key: 'submit-vote',
    endpoint: API_ENDPOINTS.MATCH_VOTE,
    method: 'POST',
    body: JSON.parse(JSON.stringify(voteResult)), // Deep clone for firefox
  }, 'background')

  // TODO: Refactor to decouple from global state.
  // This function directly mutates the global cache (productPageAltsCache/cartPageAltsCache).
  // It should instead emit an event with the new vote information. The parent component
  // would then be responsible for listening to the event and updating the cache itself
  cacheEntry.results[props.index].userVote = newVote
}

const isVoteSubmitted = computed(() => {
  if (!props.productId || props.index === undefined)
    return false

  return activeCache.value[props.productId]?.results[props.index]?.userVote
})
</script>

<template>
  <Transition
    leave-active-class="vote-exit"
    leave-to-class=""
  >
    <div
      v-if="!isVoteSubmitted"
      class="absolute right-1 top-1"
    >
      <div class="flex bg-card-bg rounded-md border border-gray-200 shadow-sm opacity-0 hover:opacity-100 transition-opacity">
        <Tooltip :text="$t('productCard.tooltips.matchVote')" position="bottom" offset="1">
          <div class="flex gap-2 justify-center h-8 w-14">
            <BaseButton
              class="feedback-button"
              @click="onVoteChanged('up')"
            >
              <BaseIcon
                :icon="ThumbsUp"
                :aria-label="$t('accessibility.voteUp')"
                :is-focusable="true"
                class="w-4 h-4 text-tertiary"
              />
            </BaseButton>
            <BaseButton
              class="feedback-button"
              @click="onVoteChanged('down')"
            >
              <BaseIcon
                :icon="ThumbsDown"
                :aria-label="$t('accessibility.voteDown')"
                :is-focusable="true"
                class="w-4 h-4 text-tertiary"
              />
            </BaseButton>
          </div>
        </Tooltip>
      </div>
    </div>
  </Transition>
</template>

<style>
.feedback-button {
 transition: transform 0.15s ease;
}

.feedback-button:hover {
 transform: scale(1.1);
 filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

.feedback-button:active {
 transform: scale(0.9);
 transition: transform 0.05s ease;
}

.vote-exit {
 transition: all 0.2s ease-out;
 transform: translateY(-2px);
 opacity: 0;
}
</style>
