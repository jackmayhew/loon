<template>
  <div class="card_base relative">
    <div class="w-1/3 h-42 flex-shrink-0">
      <div class="w-full h-full object-cover rounded-md relative">
        <div class="skeleton rounded-md" />
      </div>
    </div>
    <div class="flex flex-col gap-2" :style="{ width: 'calc(66.666667% - 1rem)' }">
      <div class="flex flex-col">
        <div class="-mt-1">
          <h2 class="text-base font-medium text-gray-800 truncate relative">
            product_name
            <div class="skeleton rounded-sm" />
          </h2>
          <div class="flex gap-2 mb-1">
            <div class="w-1/2 relative overflow-visible">
              manufacturer
              <div class="skeleton rounded-sm mt-1" />
            </div>
            <div class="flex w-1/2 gap-1">
              <div class="w-4.5 h-4.5 relative">
                <div class="skeleton rounded-full mt-1" />
              </div>
              <div class="w-4.5 h-4.5 relative">
                <div class="skeleton rounded-full mt-1" />
              </div>
              <div class="w-4.5 h-4.5 relative">
                <div class="skeleton rounded-full mt-1" />
              </div>
              <div class="w-4.5 h-4.5 relative">
                <div class="skeleton rounded-full mt-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="border-b border-gray-200 w-full" />
      <div class="flex flex-col gap-1.5 relative">
        <p class="w-full truncate text-xs">
          description
        </p>
        <div class="flex gap-1.5">
          promo
        </div>
        <div class="skeleton rounded-sm" />
      </div>
      <div class="border-b border-gray-200 w-full" />
      <div class="flex gap-2 relative">
        <button class="base-link-button-wrapper w-full py-2.5 px-5">
          button
        </button>
        <div class="skeleton rounded-sm" />
      </div>
    </div>
  </div>
</template>
