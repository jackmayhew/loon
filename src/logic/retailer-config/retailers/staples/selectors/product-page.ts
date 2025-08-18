import { getJsonLdValue } from '../../../utils/get-json-ld-value'

export default {
  dom: {
    selectors: {
      name: (doc: Document) => doc.querySelector('.product-title')?.textContent?.trim(),
      price: (doc: Document) => doc.querySelector('.mini-commerce-summary__price')?.textContent?.trim(),
      image: (doc: Document) => doc.querySelector('.product-gallery__slide img')?.getAttribute('src'),
      category: (doc: Document) => {
        // const exclude = ['Home', 'Accueil]
        const categories = Array.from(doc.querySelectorAll('.breadcrumbs__item a span'))
          .map(el => el.textContent?.trim())
          .filter(Boolean)
          // .filter((category: any) => !exclude.includes(category))
        // categories.shift()
        const uniqueCategories = [...new Set(categories)]
        return uniqueCategories.join(' > ') || undefined
      },
      description: (doc: Document) => doc.querySelector('.product-details__content p')?.textContent?.trim()?.slice(0, 300),
      sku: (doc: Document) => {
        const el = doc.querySelector('[data-current-sku]')
        return el?.getAttribute('data-current-sku') || undefined
      },
      uniqueId: (doc: Document) => {
        const el = doc.querySelector('[data-current-sku]')
        return el?.getAttribute('data-current-sku') || undefined
      },
      // uniqueId: (doc: Document) => {
      //   const el = doc.querySelector('[data-product-id]')
      //   return el?.getAttribute('data-product-id') || undefined
      // },
    },
  },
  jsonLd: {
    schemaType: 'Product',
    selectors: {
      name: { path: 'name' },
      price: { path: 'offers[0].price' },
      image: { path: 'image[0]' },
      manufacturer: { path: 'mpn' },
      description: { path: 'description', slice: 300 },
      sku: { path: 'sku' },
      uniqueId: { path: 'sku' },
      gtin: { path: 'gtin' },
    },
    functions: {
      getJsonLdValue,
    },
  },
}
