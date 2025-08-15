<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CircleX, Tag } from 'lucide-vue-next'
import { useClipboard } from '@vueuse/core'
import { formatPriceNumber } from '~/utils/formatters/price-formatter'
import type { PromoData } from '~/types/products/alternative/promo.types'
import type { usePopoverManager } from '~/composables/popup/ui/use-popover-manager'

const props = defineProps<{
  activePromo: PromoData
}>()

const manager = inject<ReturnType<typeof usePopoverManager>>('popoverManager')
const isAnyPopoverOpen = computed(() => manager?.activePopoverId.value !== null)

const { locale, t } = useI18n()

const activePromo = computed(() => props.activePromo)
const copyError = ref<boolean>(false)
const COPIED_STATE_DURATION = 1500

const { copy, copied, isSupported } = useClipboard({
  source: computed(() => activePromo.value?.code || ''),
  copiedDuring: COPIED_STATE_DURATION,
})

function handleCopyCode() {
  if (isSupported.value && activePromo.value?.code) {
    copy(activePromo.value.code)
  }
  else {
    copyError.value = true
    setTimeout(() => {
      copyError.value = false
    }, COPIED_STATE_DURATION)
  }
}

const promoOffer = computed(() => {
  if (!activePromo.value)
    return { key: 'productCard.promoOffers.defaultOffer', params: {} }

  const promo = activePromo.value
  let key = 'productCard.promoOffers.defaultOffer'
  let params: Record<string, string | number> = {}

  switch (promo.discount_type) {
    case 'bogo':
      key = 'productCard.promoOffers.bogo'
      break
    case 'percentage':
      key = 'productCard.promoOffers.percentageOff'
      params = { value: Number(promo.discount_value) }
      break
    case 'fixed_amount':
      key = 'productCard.promoOffers.fixedAmountOff'
      params = { value: formatPriceNumber(promo.discount_value, locale.value, '0.00') }
      break
    default:
      // Fallback - could use promo.name. Sticking with a generic default for now
      key = 'productCard.promoOffers.defaultOffer'
      break
  }
  return { key, params }
})
</script>

<template>
  <div class="flex items-center gap-1 text-xs mt-0.5">
    <Tooltip
      :disabled="isAnyPopoverOpen"
      :text="$t('productCard.promoOffers.promoMessage', { offerDetails: t(promoOffer.key, promoOffer.params) })"
      position="top"
      offset="1.5"
    >
      <div class="flex items-center gap-1.5">
        <BaseIcon
          :icon="Tag"
          :is-focusable="true"
          class="w-4 h-4 text-green-600"
        />
        <span class="bg-green-100 text-green-600 px-1.5 py-0.5 rounded font-medium truncate max-w-[175px]">
          {{ activePromo.code }}
        </span>
      </div>
    </Tooltip>
    <BaseButton
      v-if="isSupported"
      :aria-label="copyError ? $t('accessibility.copyPromoCodeError') : (copied ? $t('accessibility.copiedPromoCode') : $t('accessibility.copyPromoCode'))"
      class="flex p-0.5 rounded hover:bg-gray-100"
      @click="handleCopyCode"
    >
      <AnimatedClipboardCopy
        v-if="!copyError"
        :copied="copied"
        size="14px"
        stroke-width="2.5"
        :class="copied ? 'text-green-600' : 'text-primary'"
      />
      <BaseIcon
        v-else
        :icon="CircleX"
        class="w-3.5 h-3.5 text-error"
      />
    </BaseButton>
  </div>
</template>
