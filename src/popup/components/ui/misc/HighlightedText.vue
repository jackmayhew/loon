<script setup lang="ts">
const props = defineProps<{
  text: string
}>()

const segments = computed(() => {
  if (!props.text)
    return []

  // Highlight tags are provided by the API
  const startTag = '__BEAVER_HL_START__'
  const endTag = '__BEAVER_HL_END__'

  return props.text.split(startTag).flatMap((part) => {
    if (part.includes(endTag)) {
      const [highlighted, normal] = part.split(endTag)
      return [
        { text: highlighted, highlight: true },
        { text: normal, highlight: false },
      ]
    }
    return { text: part, highlight: false }
  }).filter(s => s.text)
})
</script>

<template>
  <span>
    <template v-for="(segment, index) in segments" :key="index">
      <mark v-if="segment.highlight" class="bg-green-100">
        {{ segment.text }}
      </mark>
      <template v-else>
        {{ segment.text }}
      </template>
    </template>
  </span>
</template>
