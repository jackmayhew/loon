<template>
  <div class="loader_screen">
    <h4 class="section_heading mb-2">
      {{ $t('common.processingPage') }}
    </h4>
    <div class="mt-4 space-y-3">
      <div class="relative h-6 w-3/4">
        <div class="skeleton rounded" />
      </div>
      <div class="relative h-6 w-5/6">
        <div class="skeleton rounded" />
      </div>
      <div class="relative h-16 w-full mt-6">
        <div class="skeleton rounded-md" />
      </div>
      <div class="relative h-6 w-3/4 mt-3">
        <div class="skeleton rounded" />
      </div>
    </div>
  </div>
</template>
