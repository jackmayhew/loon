export default {
  dom: {
    container: '.nl-shopping-cart',
    criticalSelectors: [
      '...',
    ],
    selectors: {
      items: '.nl-common-card',
      name: (el: HTMLElement) => el.querySelector('[data-testid="product-title"]')?.textContent?.trim(),
      price: (el: HTMLElement) => el.querySelector('[data-testid="priceTotal"]')?.textContent?.trim(),
      url: (el: HTMLElement) => el.querySelector('[data-testid="render-service-btn"]')?.getAttribute('href'),
      image: (el: HTMLElement) => el.querySelector('.nl-product-img')?.getAttribute('src'),
      sku: (el: HTMLElement) => {
        const ariaValue = el.querySelector('[aria-describedby^="wishlist__"]')?.getAttribute('aria-describedby')
        return ariaValue ? ariaValue.split('__')[1] : null
      },
      uniqueId: (el: HTMLElement) => {
        const ariaValue = el.querySelector('[aria-describedby^="wishlist__"]')?.getAttribute('aria-describedby')
        return ariaValue ? ariaValue.split('__')[1] : null
      },
    },
  },
}
