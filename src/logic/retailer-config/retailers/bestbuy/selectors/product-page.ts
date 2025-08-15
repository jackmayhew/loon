import { getJsonLdValue } from '../../../utils/get-json-ld-value'
import { processJsonLdImg } from '../utils/process-json-ld-img'

export default {
  dom: {
    container: '.x-page-content',
    criticalSelectors: [
      '...',
    ],
    selectors: {
      name: (doc: Document) => doc.querySelector('.font-best-buy')?.textContent?.trim(),
      price: (doc: Document) => doc.querySelector('[data-automation="product-price"] span')?.textContent?.trim(),
      image: (doc: Document) => doc.querySelector('[class*="productImageContainer"] [class*="displayingImage"] img')?.getAttribute('src'),
      category: (doc: Document) => {
        const exclude = ['Product Details', 'Accueil', 'Détails sur le produit']
        const categories = Array.from(doc.querySelectorAll('[data-automation="breadcrumb-container"] li'))
          .map(el => el.textContent?.trim())
          .filter(Boolean)
          .filter((category: any) => !exclude.includes(category))
        categories.pop()
        const uniqueCategories = [...new Set(categories)]
        return uniqueCategories.join(' > ') || undefined
      },
      manufacturer: (doc: Document) => doc.querySelector('[class*="marketplaceInfo"] a span')?.textContent?.trim(),
      description: (doc: Document) => doc.querySelector('[class*="productOverviewGridArea"] [class*="description"]')?.textContent?.trim().slice(0, 150),
      sku: (doc: Document) => {
        const skuElement = doc.querySelector('[data-automation="SKU_ID"]')
        const sku = skuElement?.childNodes?.[1]?.textContent?.trim()
        return sku || undefined
      },
      uniqueId: (doc: Document) => {
        const skuElement = doc.querySelector('[data-automation="SKU_ID"]')
        const sku = skuElement?.childNodes?.[1]?.textContent?.trim()
        return sku || undefined
      },
    },
  },
  jsonLd: {
    schemaType: 'Product',
    selectors: {
      name: { path: 'name' },
      price: { path: 'offers.price' },
      image: { path: 'image[0]' },
      manufacturer: { path: 'brand.name' },
      description: { path: 'description', slice: 150 },
      sku: { path: 'sku' },
      uniqueId: { path: 'sku' },
      gtin: { path: 'gtin12[0]' },
    },
    functions: {
      getJsonLdValue,
      processJsonLdImg,
    },
  },
}
