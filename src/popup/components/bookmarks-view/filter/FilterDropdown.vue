<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { SlidersHorizontal } from 'lucide-vue-next'
import { submittedBookmarkFilters } from '~/logic/storage/index'
import DateSort from '~/popup/components/bookmarks-view/filter/date/DateSort.vue'
import ApplyFiltersButton from '~/popup/components/bookmarks-view/filter/apply-filters/ApplyFiltersButton.vue'
import { usePopoverEscape } from '~/composables/popup/events/use-popover-escape'

const emit = defineEmits(['applySort', 'clearSort'])

// A temporary state for the filters
const activeFilters = ref({
  dateOrder: 'desc' as 'asc' | 'desc',
})

const showFilterDropDown = ref<boolean>(false)
const filterDropDown = ref<HTMLElement | null>(null)
const filterDropDownButton = ref<HTMLElement | null>(null)

// Used to show/hide the "Clear" button.
const areFiltersActive = computed(() => {
  return submittedBookmarkFilters.value.dateOrder === 'asc'
})

// Close the dropdown if the user presses the Escape key.
usePopoverEscape(showFilterDropDown)

// Sync local filter state to show to the active filters
watch(showFilterDropDown, (isOpen) => {
  if (isOpen) {
    activeFilters.value.dateOrder = submittedBookmarkFilters.value.dateOrder
  }
})

function handleApplyFilters() {
  submittedBookmarkFilters.value.dateOrder = activeFilters.value.dateOrder
  emit('applySort')
  closeFilterDropDown()
}

function clearFilters() {
  submittedBookmarkFilters.value.dateOrder = 'desc'
  // Future filters would be reset here as well

  activeFilters.value.dateOrder = 'desc' // Reset local state too
  emit('clearSort')
  closeFilterDropDown()
}

function toggleDropdown() {
  showFilterDropDown.value = !showFilterDropDown.value
}

function closeFilterDropDown() {
  if (!showFilterDropDown.value)
    return
  showFilterDropDown.value = false
}

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
                @click="clearFilters"
              >
                {{ $t('buttons.clearSearchFiltersTitle') }}
              </BaseButton>
            </Transition>
          </div>

          <div class="border-b w-full" />

          <!-- <PriceRangeSlider />
          <div class="border-b w-full" /> -->

          <DateSort v-model="activeFilters.dateOrder" />

          <div class="border-b w-full" />

          <ApplyFiltersButton @apply="handleApplyFilters" />
        </div>
      </div>
    </Transition>
  </div>
</template>
