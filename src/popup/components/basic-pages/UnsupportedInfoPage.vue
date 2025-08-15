<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ExternalLink } from 'lucide-vue-next'
import { LOCALIZED_APP_LINKS } from '~/constants/links/links'
import loon from '~/assets/loon.webp'
import type { LanguageKey } from '~/types/language/language.types'

const props = defineProps<{
  type: 'unsupportedRetailer' | 'unsupportedDomain'
}>()

const { t, locale } = useI18n()

const content = computed(() => {
  if (props.type === 'unsupportedDomain') {
    return {
      title: t('unsupportedDomain.title'),
      message: t('unsupportedDomain.message'),
    }
  }
  return {
    title: t('unknownRetailer.message'),
    message: null,
  }
})

const retailerListUrl = computed(() => {
  return LOCALIZED_APP_LINKS[locale.value as LanguageKey].SUPPORTED_RETAILERS
})

const contactUrl = computed(() => {
  return LOCALIZED_APP_LINKS[locale.value as LanguageKey].CONTACT
})
</script>

<template>
  <div>
    <h3 class="section_heading mb-2">
      {{ content.title }}
    </h3>
    <div>
      <p v-if="content.message" class="section_subheading mt-2 mb-1">
        {{ content.message }}
      </p>
      <BaseLinkButton
        :href="retailerListUrl"
        target="_blank"
        :aria-label="$t('unsupportedDomain.retailerList')"
        wrapper-class="w-full"
        class="flex items-center gap-1.5 section_subheading mt-2 mb-1"
      >
        {{ $t('unsupportedDomain.retailerList') }}
        <BaseIcon
          :icon="ExternalLink"
          is-interactive
          class="w-4 h-4"
        />
      </BaseLinkButton>
      <p class="text-base mt-2">
        {{ $t('unknownRetailer.checkBackSoon') }}
      </p>
      <BaseLinkButton
        :href="contactUrl"
        target="_blank"
        :aria-label="$t('unknownRetailer.letUsKnow')"
        wrapper-class="w-full"
        class="text-base underline"
      >
        {{ $t('unknownRetailer.letUsKnow') }}
      </BaseLinkButton>
      <img class="w-42 absolute bottom-4 right-8 transform scale-x-[-1]" :src="loon" alt="loon">
    </div>
  </div>
</template>
