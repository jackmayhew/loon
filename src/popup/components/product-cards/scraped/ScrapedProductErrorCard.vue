<template>
  <div class="flex flex-col">
    <div class="card_base">
      <div class="h-28 w-28 flex-shrink-0 flex items-center justify-center">
        <div class="w-full h-full bg-gray-100 rounded-md flex items-center justify-center text-gray-500">
          {{ $t('errorMessages.noImage') }}
        </div>
      </div>
      <div class="flex-1 overflow-hidden">
        <div class="card_heading w-full truncate">
          {{ $t('errorMessages.scrapeErrorCard') }}
        </div>
      </div>
    </div>
  </div>
</template>
