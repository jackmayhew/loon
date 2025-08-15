<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import ProductCardLoader from '~/popup/components/product-cards/loaders/ProductCardLoader.vue'

interface Props {
  showTitle?: boolean
  count: number
}

const props = withDefaults(defineProps<Props>(), {
  showTitle: false,
  count: 2,
})

const emit = defineEmits(['goBack'])

function goBack() {
  emit('goBack')
}
</script>

<template>
  <div :class="{ loader_screen: showTitle }">
    <h4 v-if="props.showTitle" class="section_heading mb-2">
      {{ $t('searchPage.loadingMessage') }}
    </h4>
    <div v-if="props.showTitle" class="flex w-full justify-between items-center mb-2">
      <BaseButton
        :aria-label="$t('buttons.goBack')"
        class="group flex gap-1 items-center"
        @click="goBack"
      >
        <BaseIcon
          :icon="ArrowLeft"
          class="w-4.5 h-4.5 group-hover:-translate-x-0.25 transition-transform duration-150"
        />
        <span class="text-sm">{{ $t('buttons.goBack') }}</span>
      </BaseButton>
    </div>
    <template v-for="n in props.count" :key="n">
      <ProductCardLoader class="mb-4" />
    </template>
  </div>
</template>
