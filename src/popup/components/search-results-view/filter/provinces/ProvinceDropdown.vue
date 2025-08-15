<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { Check, ChevronDown, MapPinned } from 'lucide-vue-next'
import { CANADIAN_PROVINCES } from '~/constants/data/provinces'

const props = defineProps<{
  provinces: string[]
}>()

const emit = defineEmits(['update:provinces'])

const provincesList = ref(CANADIAN_PROVINCES)
const showProvinceSelect = ref<boolean>(false)
const provinceSelect = ref<HTMLElement | null>(null)
const provinceSelectButton = ref<HTMLElement | null>(null)
const focusedOptionIndex = ref(0)

function toggleOptionSelection(provinceValue: string) {
  const newProvinces = [...props.provinces]
  const index = newProvinces.indexOf(provinceValue)

  if (index > -1)
    newProvinces.splice(index, 1)
  else
    newProvinces.push(provinceValue)

  emit('update:provinces', newProvinces)
}

function closeProvinceSelect() {
  if (showProvinceSelect.value)
    showProvinceSelect.value = false
}

// Manages keyboard navigation for accessibility, following WAI-ARIA patterns
function handleKeydown(event: KeyboardEvent) {
  const options = Array.from(provinceSelect.value?.querySelectorAll('[role="option"]') || []) as HTMLElement[]
  if (!options.length)
    return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      focusedOptionIndex.value = (focusedOptionIndex.value + 1) % options.length
      break
    case 'ArrowUp':
      event.preventDefault()
      focusedOptionIndex.value = (focusedOptionIndex.value - 1 + options.length) % options.length
      break
    case 'Escape':
      event.preventDefault()
      showProvinceSelect.value = false
      provinceSelectButton.value?.focus()
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (focusedOptionIndex.value >= 0 && options[focusedOptionIndex.value]) {
        const option = options[focusedOptionIndex.value]
        const provinceValue = option.dataset?.value
        if (provinceValue) {
          toggleOptionSelection(provinceValue)
        }
      }
      break
  }

  if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
    nextTick(() => {
      options.forEach((option, index) => {
        option.tabIndex = index === focusedOptionIndex.value ? 0 : -1
      })
      options[focusedOptionIndex.value]?.focus()
    })
  }
}

function toggleDropdown() {
  showProvinceSelect.value = !showProvinceSelect.value
  if (showProvinceSelect.value) {
    nextTick(() => {
      const firstOption = provinceSelect.value?.querySelector('[role="option"]') as HTMLElement | null
      firstOption?.focus()
    })
  }
}

onClickOutside(
  provinceSelect,
  () => {
    closeProvinceSelect()
  },
  {
    ignore: [provinceSelectButton],
  },
)
</script>

<template>
  <div class="relative">
    <BaseButton
      ref="provinceSelectButton"
      :aria-label="showProvinceSelect ? $t('accessibility.closeProvincesSelect') : $t('accessibility.openProvincesSelect')"
      :class="{ 'bg-gray-100': showProvinceSelect }"
      class="flex gap-2 w-full rounded items-center py-2 px-1.5 hover:bg-neutral-100 duration-300"
      aria-haspopup="listbox"
      :aria-expanded="showProvinceSelect"
      @click="toggleDropdown"
      @keydown.down.prevent="toggleDropdown"
    >
      <div class="flex">
        <BaseIcon :icon="MapPinned" class="w-4 h-4" />
      </div>
      <div class="flex gap-2 items-center justify-between w-full">
        <span class="relative pr-3">
          {{ $t('buttons.provinces') }}
          <Transition name="scale-fade">
            <span
              v-if="provinces.length > 0"
              class="absolute -top-1 -right-1.5 bg-zinc-700 text-white text-[10px]
              leading-none w-4 h-4 rounded-full flex items-center justify-center font-semibold"
            >
              {{ provinces.length }}
            </span>
          </Transition>
        </span>
        <BaseIcon
          :icon="ChevronDown"
          class="w-4 h-4 transition-transform duration-300 ease-in-out"
          :class="{ 'rotate-180': showProvinceSelect }"
        />
      </div>
    </BaseButton>
    <Transition name="scale-fade-fast">
      <div
        v-if="showProvinceSelect"
        ref="provinceSelect"
        class="flex flex-col gap-1.5 absolute -left-1.5 -ml-[1px] top-full mt-1.5 z-50 w-[175px] h-42 overflow-y-auto rounded-md border bg-white p-1.5 shadow-lg origin-top"
        role="listbox"
        tabindex="-1"
        aria-multiselectable="true"
        @keydown="handleKeydown"
      >
        <template v-for="(province, index) in provincesList" :key="province.value">
          <div
            class="flex w-full justify-between rounded items-center
            py-1.5 px-1.5 hover:bg-neutral-100 cursor-pointer duration-300"
            :class="[
              provinces.includes(province.value) ? 'bg-gray-100' : '',
            ]"
            role="option"
            :aria-selected="provinces.includes(province.value)"
            :tabindex="index === focusedOptionIndex ? 0 : -1"
            :data-value="province.value"
            @click="toggleOptionSelection(province.value)"
          >
            <span class="flex-1 truncate min-w-0 pr-2">
              {{ $t(`provinces.${province.value}`) }}
            </span>
            <BaseIcon
              v-if="provinces.includes(province.value)"
              :icon="Check"
              class="w-4 h-4 flex-shrink-0"
            />
          </div>
          <div v-if="index < provincesList.length - 1" class="border-b w-full" />
        </template>
      </div>
    </Transition>
  </div>
</template>
