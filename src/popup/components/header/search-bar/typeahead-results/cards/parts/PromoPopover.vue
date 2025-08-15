<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CircleX, Tag, X } from 'lucide-vue-next'
import { useClipboard } from '@vueuse/core'
import { formatPriceNumber } from '~/utils/formatters/price-formatter'
import type { PromoData } from '~/types/products/alternative/promo.types'

const props = defineProps<{
  activePromo: PromoData
}>()

const emit = defineEmits(['close'])

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
  if (!activePromo.value) {
    return { key: 'header.promoOffers.defaultOffer', params: {} }
  }

  const promo = activePromo.value
  let key = 'header.promoOffers.defaultOffer'
  let params: Record<string, string | number> = {}

  switch (promo.discount_type) {
    case 'bogo':
      key = 'header.promoOffers.bogo'
      break
    case 'percentage':
      key = 'header.promoOffers.percentageOff'
      params = { value: Number(promo.discount_value) }
      break
    case 'fixed_amount':
      key = 'header.promoOffers.fixedAmountOff'
      params = { value: formatPriceNumber(promo.discount_value, locale.value, '0.00') }
      break
    default:
      key = 'header.promoOffers.defaultOffer'
      break
  }
  return { key, params }
})
</script>

<template>
  <div
    class="cursor-auto absolute z-10 w-40 rounded-md button_primary_bg button_primary_text shadow-lg ring-1
  ring-black ring-opacity-5 focus:outline-none p-2 text-sm bottom-full left-1/2 -translate-x-1/2 mb-1.5"
    role="dialog"
    aria-modal="true"
    :aria-label="$t('header.promoPopoverTitle')"
  >
    <div class="flex justify-between items-center mb-1">
      <h3 class="font-medium truncate">
        {{ $t('header.promoOffers.title') }}
      </h3>
      <BaseButton
        :aria-label="$t('accessibility.closeButton')"
        class="p-0.5 rounded-full hover:bg-zinc-700"
        @click="emit('close')"
      >
        <BaseIcon
          :icon="X"
          class="w-4 h-4"
        />
      </BaseButton>
    </div>
    <div class="flex flex-col">
      <span class="truncate">
        {{ $t('header.promoOffers.promoMessage', { offerDetails: t(promoOffer.key, promoOffer.params) }) }}
      </span>
      <div class="flex items-center mt-1 gap-1">
        <BaseIcon
          :icon="Tag"
          :is-focusable="true"
          class="w-4 h-4 text-green-700"
        />
        <span class="bg-green-700 text-white px-1.5 py-0.5 rounded text-xs font-medium w-fit truncate">
          {{ activePromo.code }}
        </span>
        <BaseButton
          v-if="isSupported"
          :aria-label="copyError ? $t('accessibility.copyPromoCodeError') : (copied ? $t('accessibility.copiedPromoCode') : $t('accessibility.copyPromoCode'))"
          class="flex p-0.5 rounded "
          @click="handleCopyCode"
        >
          <AnimatedClipboardCopy
            v-if="!copyError"
            :copied="copied"
            size="14px"
            stroke-width="2.5"
            :class="copied ? 'text-green-600' : 'text-white'"
          />
          <BaseIcon
            v-else
            :icon="CircleX"
            class="w-3.5 h-3.5 text-error"
          />
        </BaseButton>
      </div>
    </div>
  </div>
</template>
