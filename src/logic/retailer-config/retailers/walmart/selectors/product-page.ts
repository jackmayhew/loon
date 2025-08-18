import { getJsonLdValue } from '../../../utils/get-json-ld-value'

export default {
  dom: {
    criticalSelectors: [
      '#main-title',
      '[data-seo-id="hero-price"]',
      '[data-testid="hero-image-container"]',
      '[data-testid="product-description-content"]',
      'nav[aria-label="breadcrumb"] a.black',
      '[data-testid="atc-buynow-container"] [data-id]',
    ],
    selectors: {
      name: (doc: Document) => doc.querySelector('#main-title')?.textContent?.trim(),
      price: (doc: Document) => doc.querySelector('[data-seo-id="hero-price"]')?.textContent?.trim(),
      image: (doc: Document) => {
        const imgSrc = doc.querySelector('[data-testid="hero-image-container"] [data-testid="media-thumbnail"] img')?.getAttribute('src')
        if (imgSrc) {
          const updatedImgSrc = imgSrc.replace(/odnHeight=\d+/, 'odnHeight=500').replace(/odnWidth=\d+/, 'odnWidth=500')
          return updatedImgSrc
        }
        return null
      },
      category: (doc: Document) => {
        const categories = Array.from(doc.querySelectorAll('[itemprop="item"]'))
          .map(el => el.textContent?.trim())
          .filter(Boolean)
        const uniqueCategories = [...new Set(categories)]
        return uniqueCategories.join(' > ') || undefined
      },
      manufacturer: (doc: Document) => doc.querySelector('[data-seo-id="brand-name"]')?.textContent?.trim(),
      description: (doc: Document) => doc.querySelector('[data-testid="product-description-content"]')?.textContent?.trim().slice(0, 300),
      upc: (doc: Document) => {
        const match = doc.body.textContent?.match(/Universal Product Code.*?(\d{10,15})/)
        return match ? match[1] : null
      },
      uniqueId: (doc: Document) => {
        const el = doc.querySelector('[data-testid="atc-buynow-container"] [data-id]')
        const id = el?.getAttribute('data-id')?.replace(/^PRD/, '')
        const domSku = doc.body.textContent?.match(/SKU.*?([\w-]+)/)
        return id || (domSku ? domSku[1] : null)
      },
      sku: (doc: Document) => {
        const el = doc.querySelector('[data-testid="atc-buynow-container"] [data-id]')
        const id = el?.getAttribute('data-id')?.replace(/^PRD/, '')
        return id || null
      },
      madeInCanada: (doc: Document) => {
        const element = doc.querySelector('.tag-leading-badge')
        return element?.textContent?.trim() === 'Made In Canada' || element?.textContent?.trim() === 'Fabriqué au Canada' ? true : 'Unknown'
      },
    },
  },
  jsonLd: {
    schemaType: 'Product',
    selectors: {
      name: { path: 'name' },
      price: { path: 'offers[0].price' },
      image: { path: 'image' },
      manufacturer: { path: 'brand.name' },
      description: { path: 'description', slice: 300 },
      sku: { path: 'sku' },
      uniqueId: { path: 'sku' },
    },
    functions: {
      getJsonLdValue,
    },
  },
}
