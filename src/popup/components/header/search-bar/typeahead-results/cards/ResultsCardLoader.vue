<script setup lang="ts">
defineProps<{
  count: number
}>()
</script>

<template>
  <template v-for="i in count" :key="i">
    <li class="p-2 border-b last:border-none">
      <div class="flex gap-2 relative">
        <div class="w-12 h-12 flex-shrink-0 rounded overflow-hidden aspect-ratio-1/1 relative">
          <div class="skeleton rounded" />
        </div>
        <div class="flex flex-col justify-evenly w-full relative min-w-0">
          <span class="text-sm w-3/4 truncate relative">
            product name
            <div class="skeleton rounded-sm" />
          </span>
          <div class="flex gap-1.5 items-center">
            <span class="text-tertiary flex font-medium w-1/4 h-fit relative">
              price
              <div class="skeleton rounded-sm" />
            </span>
            <div class="flex relative w-3/8">
              flag
              <div class="skeleton rounded-sm" />
            </div>
          </div>
        </div>
      </div>
    </li>
  </template>
</template>
