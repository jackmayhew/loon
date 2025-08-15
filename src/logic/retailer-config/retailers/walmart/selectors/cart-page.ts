import { handleAdditionalCartLogic } from '../utils/handle-additional-cart-logic'

export default {
  dom: {
    criticalSelectors: [
      '[data-testid="full-page-cart"]',
      '[data-automation-id="checkout"]',
      '[data-testid="grand-total-value"]',
    ],
    selectors: {
      items: '[data-testid="product-tile-container"] li',
      name: (el: HTMLElement) => el.querySelector('[data-testid="productName"]')?.textContent?.trim(),
      price: (el: HTMLElement) => el.querySelector('[data-testid="line-price"]')?.textContent?.trim(),
      image: (el: HTMLElement) => {
        const imgSrc = el.querySelector('[data-testid="productTileImage"]')?.getAttribute('src')
        if (imgSrc) {
          const updatedImgSrc = imgSrc.replace(/odnHeight=\d+/, 'odnHeight=500').replace(/odnWidth=\d+/, 'odnWidth=500')
          return updatedImgSrc
        }
        return null
      },
      url: (el: HTMLElement) => el.querySelector('[link-identifier="itemClick"]')?.getAttribute('href'),
      madeInCanada: (el: Document) => {
        const element = el.querySelector('.tag-leading-badge')
        return element?.textContent?.trim() === 'Made In Canada' || element?.textContent?.trim() === 'Fabriqué au Canada' ? true : 'Unknown'
      },
      uniqueId: (el: HTMLElement) => el.querySelector('[data-usitemid]')?.getAttribute('data-usitemid'),
    },
    functions: {
      handleAdditionalCartLogic,
    },
  },
}
