<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { Settings2 } from 'lucide-vue-next'
import { activeSearchQuery, enableTypeahead } from '~/logic/storage/index'
import { usePopoverEscape } from '~/composables/popup/events/use-popover-escape'
import { useTypeaheadSearch } from '~/composables/popup/search/typeahead/use-typeahead-search'

defineProps<{
  isDisabled: boolean
}>()

const emit = defineEmits(['closeResults'])

const {
  handleSearch,
  killTypeaheadDisplay,
} = useTypeaheadSearch()

const showSettingsDropDown = ref<boolean>(false)
const settingsDropDown = ref<HTMLElement | null>(null)
const settingsDropDownButton = ref<HTMLElement | null>(null)

usePopoverEscape(showSettingsDropDown)

function toggleSettingsDropDown() {
  emit('closeResults') // close typeahead result
  showSettingsDropDown.value = !showSettingsDropDown.value
}

function toggleDisabled() {
  enableTypeahead.value = !enableTypeahead.value
  // Trigger typeahead search without opening results display
  if (enableTypeahead.value && activeSearchQuery.value.query) {
    handleSearch(activeSearchQuery.value.query)
    killTypeaheadDisplay()
  }
}

function closeSettingsDropdown() {
  if (!showSettingsDropDown.value)
    return
  showSettingsDropDown.value = false
}

onClickOutside(
  settingsDropDown,
  () => {
    closeSettingsDropdown()
  },
  {
    ignore: [settingsDropDownButton],
  },
)
</script>

<template>
  <div class="absolute inset-y-0 end-0 flex items-center peer-disabled:opacity-50">
    <BaseButton
      ref="settingsDropDownButton"
      :aria-label="showSettingsDropDown ? $t('accessibility.closeSettingsMenu') : $t('accessibility.openSettingsMenu')"
      :disabled="isDisabled"
      class="flex items-center justify-center rounded me-3 duration-300"
      @click="toggleSettingsDropDown"
    >
      <BaseIcon :icon="Settings2" class="w-3.5 h-3.5" />
    </BaseButton>
    <Transition name="scale-fade">
      <div
        v-if="showSettingsDropDown"
        ref="settingsDropDown"
        class="absolute right-0 top-10 z-50  rounded-md border bg-white px-3 py-3 shadow-lg origin-top"
      >
        <div class="flex gap-2 text-sm font-medium text-primary items-center">
          {{ $t('buttons.suggestionsToggle') }}
          <BaseButton
            type="button"
            :aria-label="enableTypeahead ? $t('accessibility.enableTypeahead') : $t('accessibility.enableTypeahead')"
            class="relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out"
            :class="[
              enableTypeahead ? 'bg-zinc-700' : 'bg-gray-200',
            ]"
            role="switch"
            :aria-checked="enableTypeahead"
            @click="toggleDisabled"
          >
            <span
              aria-hidden="true"
              class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
              :class="[
                enableTypeahead ? 'translate-x-5' : 'translate-x-0',
              ]"
            />
          </BaseButton>
        </div>
      </div>
    </Transition>
  </div>
</template>
