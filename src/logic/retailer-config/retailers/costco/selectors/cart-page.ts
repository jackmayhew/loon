export default {
  dom: {
    selectors: {
      items: '[data-orderitemid]',
      name: (el: HTMLElement) => el.querySelector('.product-title a')?.textContent?.trim(),
      price: (el: HTMLElement) => el.querySelector('.product-price .price')?.textContent?.trim(),
      url: (el: HTMLElement) => el.querySelector('.product-title a')?.getAttribute('href'),
      image: (el: HTMLElement) => el.querySelector('.item-thumbnail a img')?.getAttribute('src'),
      sku: (el: HTMLElement) => el.querySelector('.number-status span')?.textContent?.trim(),
      uniqueId: (el: HTMLElement) => el.querySelector('.number-status span')?.textContent?.trim(),
    },
  },
}
