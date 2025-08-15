export default {
  dom: {
    container: '#sc-active-cart',
    criticalSelectors: [
      '...',
    ],
    selectors: {
      items: '[data-name="Active Items"] [data-asin]',
      name: (el: HTMLElement) => el.querySelector('.sc-grid-item-product-title')?.textContent?.trim(),
      manufacturer: (el: HTMLElement) => el.querySelector('.sc-seller a')?.textContent?.trim(),
      price: (el: HTMLElement) => el.querySelector('.a-price .a-offscreen')?.textContent?.trim(),
      url: (el: HTMLElement) => el.querySelector('.sc-product-link')?.getAttribute('href'),
      image: (el: HTMLElement) => el.querySelector('.sc-product-image')?.getAttribute('src'),
      category: (el: HTMLElement) => {
        const text = el.querySelector('.sc-best-seller-badge-redesign-container .a-truncate-cut')?.textContent?.trim()
        return text ? text.split('in')[1]?.trim() : undefined
      },
      asin: (el: HTMLElement) => el.getAttribute('data-asin'),
      uniqueId: (el: HTMLElement) => el.getAttribute('data-asin'),
    },
  },
}
