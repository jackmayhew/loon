export default {
  dom: {
    selectors: {
      items: '[class*="bagItemsPageWrapper"]',
      name: (el: HTMLElement) => el.querySelector('[data-testid="bagItem-url"] [class*="productName"]')?.textContent?.trim(),
      manufacturer: (el: HTMLElement) => el.querySelector('[data-testid="bagItem-url"] [class*="brandName"]')?.textContent?.trim(),
      price: (el: HTMLElement) => el.querySelector('[data-testid="price-container"] span')?.textContent?.trim(),
      url: (el: HTMLElement) => el.querySelector('[data-testid="bagItem-url-image"]')?.getAttribute('href'),
      image: (el: HTMLElement) => el.querySelector('[data-testid="bagItem-url-image"] img')?.getAttribute('src'),
      sku: (el: HTMLElement) => el.querySelector('[data-testid="bagItem-url"] [class*="sku"]')?.textContent?.match(/\d+/)?.[0],
      uniqueId: (el: HTMLElement) => el.querySelector('[data-testid="bagItem-url"] [class*="sku"]')?.textContent?.match(/\d+/)?.[0],
    },
  },
}
