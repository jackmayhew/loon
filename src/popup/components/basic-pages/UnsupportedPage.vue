<script setup lang="ts">
import loon from '~/assets/loon.webp'
</script>

<template>
  <div class="">
    <h3 class="section_heading mb-2">
      {{ $t('unsupportedPage.title') }}
    </h3>
    <div>
      <p class="section_subheading">
        {{ $t('unsupportedPage.message') }}
      </p>
    </div>
    <img class="w-42 absolute bottom-4 right-12 transform scale-x-[-1]" :src="loon" alt="loon">
  </div>
</template>
