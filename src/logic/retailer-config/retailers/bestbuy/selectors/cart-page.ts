export default {
  dom: {
    container: 'form#cart',
    criticalSelectors: [
      '...',
    ],
    selectors: {
      items: '[data-automation="vendor-items"]',
      name: (el: HTMLElement) => el.querySelector('[data-automation="product-name"]')?.textContent?.trim(),
      price: (el: HTMLElement) => el.querySelector('[data-automation="lineitem-subtotal"] [class*="rightCol"]')?.textContent?.trim(),
      url: (el: HTMLElement) => el.querySelector('[data-automation="product-name"]')?.getAttribute('href'),
      image: (el: HTMLElement) => el.querySelector('.x-placeholder-image img')?.getAttribute('src'),
      manufacturer: (el: HTMLElement) => {
        const text = el.querySelector('[data-testid="vendor-item-header-content"]')?.textContent?.trim()
        return text ? text.split('Sold and shipped by ')[1] : null
      },
      // manufacturer: (el: HTMLElement) => {
      //   const text = el.querySelector('[data-testid="vendor-item-header-content"]')?.textContent?.trim()
      //   return text?.includes('Sold and shipped by')
      //     ? text.split('Sold and shipped by ')[1]
      //     : text?.includes('Vendu et expédié par')
      //       ? text.split('Vendu et expédié par ')[1]
      //       : null
      // },
      sku: (el: HTMLElement) => el.querySelector('[data-sku]')?.getAttribute('data-sku'),
      uniqueId: (el: HTMLElement) => el.querySelector('[data-sku]')?.getAttribute('data-sku'),
    },
  },
}
