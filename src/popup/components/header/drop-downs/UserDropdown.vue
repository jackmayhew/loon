<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { Bookmark, Globe, User } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { activeCustomView, submittedSearchQuery, userLanguage } from '~/logic/storage/index'
import { useSearchResults } from '~/composables/popup/search/use-search-results'
import { useBookmarkProducts } from '~/composables/popup/bookmark/use-bookmarked-products'
import { usePopoverEscape } from '~/composables/popup/events/use-popover-escape'
import type { PageType } from '~/types/view-data/page-type.types'
import type { LanguageKey } from '~/types/language/language.types'

const props = defineProps<{
  isViewLoading: boolean
  pageType: PageType
  popupIsRefreshing: boolean
}>()

const changeView = inject<(newPageType: PageType) => void>('changeView', () => {
  console.warn('changeView not provided')
})

const { locale } = useI18n()
const { fetchAndStoreResults } = useSearchResults()
const { fetchOnLocaleToggle } = useBookmarkProducts()

const showUserDropDown = ref<boolean>(false)
const userDropDown = ref<HTMLElement | null>(null)
const userDropDownButton = ref<HTMLElement | null>(null)

usePopoverEscape(showUserDropDown)

async function toggleLanguage() {
  const newLang = userLanguage.value === 'en' ? 'fr' : 'en'
  locale.value = newLang
  userLanguage.value = newLang

  if (props.pageType === 'BOOKMARKS_PAGE')
    fetchOnLocaleToggle()

  // Search results view logic
  submittedSearchQuery.value.language = locale.value as LanguageKey
  if (props.pageType === 'SEARCH_RESULTS_PAGE')
    fetchAndStoreResults()
}

function toggleDropdown() {
  showUserDropDown.value = !showUserDropDown.value
}

function handleBookmarksClick() {
  changeView('BOOKMARKS_PAGE')
  showUserDropDown.value = false
}

function closeUserDropDown() {
  if (!showUserDropDown.value)
    return
  showUserDropDown.value = false
}

onClickOutside(
  userDropDown,
  () => {
    closeUserDropDown()
  },
  {
    ignore: [userDropDownButton],
  },
)

onMounted(() => {
  locale.value = userLanguage.value
})

const isDisabled = computed(() =>
  props.pageType === 'RATE_LIMITED_PAGE'
  || props.pageType === 'SERVICE_UNAVAILABLE_PAGE'
  || props.popupIsRefreshing,
)
</script>

<template>
  <div class="relative">
    <BaseButton
      ref="userDropDownButton"
      :aria-label="showUserDropDown ? $t('accessibility.closeUserMenu') : $t('accessibility.openUserMenu')"
      :class="{ 'bg-gray-100': showUserDropDown }"
      class="flex items-center justify-center rounded w-7 h-7 duration-300 hover:bg-gray-100"
      @click="toggleDropdown"
    >
      <BaseIcon :icon="User" class="w-4.5 h-4.5" />
    </BaseButton>
    <Transition name="scale-fade">
      <div
        v-if="showUserDropDown"
        ref="userDropDown"
        class="absolute right-0 top-full z-50 mt-2 w-[165px] rounded-md border bg-white p-1.5 shadow-lg origin-top"
      >
        <div class="flex flex-col gap-1.5 text-sm font-medium text-primary">
          <BaseButton
            :aria-label="$t('accessibility.viewBookmarks')"
            :class="[
              { 'bg-neutral-100 pointer-events-none': activeCustomView === 'BOOKMARKS_PAGE' },
              { 'pointer-events-none': isDisabled },
            ]"
            :disabled="props.isViewLoading || isDisabled"
            class="flex w-full rounded items-center py-2 px-1.5 hover:bg-neutral-100"
            @click="handleBookmarksClick"
          >
            <div class="flex mr-2">
              <BaseIcon :icon="Bookmark" class="w-4.5 h-4.5" />
            </div>
            {{ $t('buttons.bookmarks') }}
          </BaseButton>
          <div class="border-b w-full" />
          <BaseButton
            :aria-label="$t('accessibility.languageToggle')"
            class="flex w-full rounded items-center py-2 px-1.5 hover:bg-neutral-100"
            @click="toggleLanguage"
          >
            <div class="flex mr-2">
              <BaseIcon :icon="Globe" class="w-4 h-4 " />
            </div>
            {{ $t('buttons.language') }}
          </BaseButton>
        </div>
      </div>
    </Transition>
  </div>
</template>
