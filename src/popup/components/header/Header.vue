<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RotateCw } from 'lucide-vue-next'
import UserDropdown from '~/popup/components/header/drop-downs/UserDropdown.vue'
import SearchBar from '~/popup/components/header/search-bar/SearchBar.vue'
import { LOON_WEBSITE_BASE_EN, LOON_WEBSITE_BASE_FR } from '~/constants/links/links'
import { openLinkAndClosePopup } from '~/utils/dom/link-handler'
import loon from '~/assets/loon.webp'
import type { PageType } from '~/types/view-data/page-type.types'
import type { LoadingStatus } from '~/types/view-data/loading-status.types'

const props = defineProps<{
  loadingStatus: LoadingStatus
  pageType: PageType
  popupIsRefreshing: boolean
}>()

const emit = defineEmits(['refresh'])

const { locale } = useI18n()

function triggerRefresh() {
  emit('refresh')
}

const isViewLoading = computed(() =>
  props.loadingStatus === 'CHILD_LOADING'
  || props.loadingStatus === 'INITIAL_CHECK')

// Leaving this here for when options page is built
// function openOptionsPage() {
//   browser.runtime.openOptionsPage()
// }

const isDisabled = computed(() =>
  props.pageType === 'RATE_LIMITED_PAGE'
  || props.pageType === 'SERVICE_UNAVAILABLE_PAGE'
  || props.popupIsRefreshing,
)

const homeUrl = computed(() => {
  return locale.value === 'fr' ? LOON_WEBSITE_BASE_FR : LOON_WEBSITE_BASE_EN
})

function handleLogoClick(homeUrl: string) {
  openLinkAndClosePopup(homeUrl)
}
</script>

<template>
  <div class="mb-4 mt-2">
    <div class="flex justify-between items-center gap-4 relative">
      <a :href="homeUrl" class="min-w-11 max-w-11" @click.prevent="handleLogoClick(homeUrl)">
        <img class="w-full h-full select-none" :src="loon" alt="loon logo">
      </a>
      <div
        class="w-full"
        :class="{ 'cursor-not-allowed': isDisabled }"
      >
        <SearchBar
          :is-view-loading="isViewLoading"
          :is-disabled="isDisabled"
          :page-type="pageType"
          :class="{ 'pointer-events-none': isDisabled }"
        />
      </div>
      <div class="flex items-center gap-2 rounded-md h-10">
        <BaseButton
          :aria-label="$t('accessibility.refreshExtension')"
          class="group flex items-center justify-center rounded w-7 h-7 duration-300 hover:bg-gray-100"
          :disabled="isDisabled"
          @click="triggerRefresh"
        >
          <BaseIcon
            :icon="RotateCw"
            class="w-4 h-4 transition-transform duration-600 group-hover:rotate-[360deg] text-primary"
          />
        </BaseButton>
        <UserDropdown
          :is-view-loading="isViewLoading"
          :page-type="pageType"
          :popup-is-refreshing="popupIsRefreshing"
        />
      </div>
    </div>
  </div>
</template>
