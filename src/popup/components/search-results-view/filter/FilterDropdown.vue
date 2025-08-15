<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { SlidersHorizontal } from 'lucide-vue-next'
import { useSearchResults } from '~/composables/popup/search/use-search-results'
import { usePopoverEscape } from '~/composables/popup/events/use-popover-escape'
import ProvinceDropdown from '~/popup/components/search-results-view/filter/provinces/ProvinceDropdown.vue'
import PromotionToggle from '~/popup/components/search-results-view/filter/promotion/PromotionToggle.vue'
import ApplyFiltersButton from '~/popup/components/search-results-view/filter/apply-filters/ApplyFiltersButton.vue'

const props = defineProps<{
  currentFilters: {
    provinces?: string[] | null
    promotion?: boolean | null
  }
}>()

const { applyFilters, clearFilters } = useSearchResults()

const showFilterDropDown = ref(false)
const filterDropDown = ref<HTMLElement | null>(null)
const filterDropDownButton = ref<HTMLElement | null>(null)

// A temporary state for the filters
const activeFilters = ref({
  provinces: [] as string[],
  promotion: null as boolean | null,
})

// Used to show/hide the "Clear" button
const areFiltersActive = computed(() => {
  return (
    (props.currentFilters.provinces && props.currentFilters.provinces.length > 0)
    || !!props.currentFilters.promotion
  )
})

function handleApplyFilters() {
  applyFilters(activeFilters.value)
  closeFilterDropDown()
}

function handleClearFilters() {
  clearFilters()
  closeFilterDropDown()
}

function toggleDropdown() {
  showFilterDropDown.value = !showFilterDropDown.value
}

function closeFilterDropDown() {
  if (showFilterDropDown.value) {
    showFilterDropDown.value = false
  }
}

// Sync local filter state to show the active filters
watch(showFilterDropDown, (isShown) => {
  if (isShown) {
    activeFilters.value.provinces = [...props.currentFilters.provinces || []]
    activeFilters.value.promotion = props.currentFilters.promotion || null
  }
})

// Close the dropdown if the user presses the Escape key
usePopoverEscape(showFilterDropDown)

onClickOutside(
  filterDropDown,
  () => closeFilterDropDown(),
  { ignore: [filterDropDownButton] },
)
</script>

<template>
  <div class="absolute right-0">
    <BaseButton
      ref="filterDropDownButton"
      :aria-label="showFilterDropDown ? $t('accessibility.closeSearchFiltersMenu') : $t('accessibility.openSearchFiltersMenu')"
      :class="{ 'bg-gray-100': showFilterDropDown }"
      class="flex items-center justify-center rounded w-7 h-7 duration-300 hover:bg-gray-100"
      @click="toggleDropdown"
    >
      <BaseIcon :icon="SlidersHorizontal" class="w-4 h-4" />
    </BaseButton>
    <Transition name="scale-fade">
      <div
        v-if="showFilterDropDown"
        ref="filterDropDown"
        class="absolute right-0 top-full z-50 mt-1 w-[175px] rounded-md border bg-white p-1.5 shadow-lg origin-top"
      >
        <div class="flex flex-col gap-1.5 text-sm font-medium text-primary select-none">
          <div class="flex justify-between items-center">
            <span>
              {{ $t('accessibility.searchFiltersTitle') }}
            </span>
            <Transition name="scale-fade">
              <BaseButton
                v-if="areFiltersActive"
                :aria-label="$t('accessibility.clearSearchFilters')"
                class="text-[10px] px-1.5 font-600"
                @click="handleClearFilters"
              >
                {{ $t('buttons.clearSearchFiltersTitle') }}
              </BaseButton>
            </Transition>
          </div>

          <!-- <div class="border-b w-full" />

          <PriceRangeSlider /> -->

          <div class="border-b w-full" />

          <ProvinceDropdown v-model:provinces="activeFilters.provinces" />

          <div class="border-b w-full" />

          <PromotionToggle v-model:promotion="activeFilters.promotion" />

          <div class="border-b w-full" />

          <ApplyFiltersButton @apply="handleApplyFilters" />
        </div>
      </div>
    </Transition>
  </div>
</template>
