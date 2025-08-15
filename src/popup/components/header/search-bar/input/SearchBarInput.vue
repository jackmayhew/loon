<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import { activeSearchQuery } from '~/logic/storage/index'
import SettingsDropdown from '~/popup/components/header/drop-downs/SearchSettingsDropdown.vue'

defineProps<{
  isDisabled: boolean
}>()

const emit = defineEmits([
  'search', // For typeahead
  'restoreResults', // For typeahead
  'closeResults', // For typeahdead
  'submit', // For a full search
])

function handleInput() {
  emit('search', activeSearchQuery.value.query)
}

function handleFocus() {
  emit('restoreResults')
}

function handleSubmit() {
  emit('submit', activeSearchQuery.value.query)
}
</script>

<template>
  <div class="relative">
    <input
      v-model="activeSearchQuery.query"
      type="text"
      class="peer py-2.5 sm:py-3 px-4 pr-9 ps-9 block w-full text-xs bg-gray-100 outline-transparent rounded"
      :placeholder="$t('header.searchDB')"
      :aria-label="$t('header.searchDB')"
      :disabled="isDisabled"
      @input="handleInput"
      @focus="handleFocus"
      @click="handleFocus"
      @keydown.enter="handleSubmit"
    >
    <div
      class="absolute inset-y-0 start-0 flex items-center pointer-events-none
      ps-3 peer-disabled:opacity-50 peer-disabled:pointer-events-none"
    >
      <BaseIcon
        :icon="Search"
        class="w-4 h-4 text-primary"
      />
    </div>
    <SettingsDropdown :is-disabled="isDisabled" @close-results="emit('closeResults')" />
  </div>
</template>
