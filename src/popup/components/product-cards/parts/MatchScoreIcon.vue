<script setup lang="ts">
import { BadgePercent } from 'lucide-vue-next'

const props = defineProps<{
  rankScore: number
}>()

const displayPercentage = computed(() => Math.min(99, Math.floor(props.rankScore * 100)))

const MATCH_SCORE_THRESHOLDS = {
  EXCELLENT: 70,
  GOOD: 50,
  FAIR: 30,
} as const

function getMatchScoreIconClass(): string {
  const baseClasses = 'w-5 h-5'

  if (displayPercentage.value >= MATCH_SCORE_THRESHOLDS.EXCELLENT) {
    return `${baseClasses} text-green-500`
  }
  if (displayPercentage.value >= MATCH_SCORE_THRESHOLDS.GOOD) {
    return `${baseClasses} text-yellow-400`
  }
  if (displayPercentage.value >= MATCH_SCORE_THRESHOLDS.FAIR) {
    return `${baseClasses} text-orange-400`
  }
  return `${baseClasses} text-red-700`
}
</script>

<template>
  <Tooltip
    :text="$t('productCard.tooltips.matchScoreDisplay', { value: displayPercentage })"
    position="top"
    offset="0.5"
  >
    <BaseIcon
      :icon="BadgePercent"
      :class="getMatchScoreIconClass()"
      :aria-label="$t('productCard.tooltips.matchScore')"
      :is-focusable="true"
    />
  </Tooltip>
</template>
