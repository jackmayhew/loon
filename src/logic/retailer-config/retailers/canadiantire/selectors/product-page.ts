import { getJsonLdValue } from '../../../utils/get-json-ld-value'

export default {
  dom: {
    container: '...',
    criticalSelectors: [
      '...',
    ],
    selectors: {
      name: (doc: Document) => doc.querySelector('.nl-product__title')?.textContent?.trim(),
      price: (doc: Document) => doc.querySelector('.nl-price--total')?.textContent?.trim(),
      image: (doc: Document) => doc.querySelector('.enlarge_contain img')?.getAttribute('src'),
      category: (doc: Document) => {
        // const exclude = ['Back', 'Home', 'Accueil']
        const categories = Array.from(doc.querySelectorAll('.nl-breadcrumbs__list-item .nl-breadcrumbs__link'))
          .map(el => el.textContent?.trim())
          .filter(Boolean)
          // .filter((category: any) => !exclude.includes(category))
        categories.pop()
        categories.shift()
        const uniqueCategories = [...new Set(categories)]
        return uniqueCategories.join(' > ') || undefined
      },
      manufacturer: (doc: Document) => doc.querySelector('.nl-product__brand')?.textContent?.trim(),
      description: (doc: Document) => doc.querySelector('.nl-features__information')?.textContent?.trim()?.slice(0, 300),
      sku: (doc: Document) => doc.querySelector('.nl-product__sku')?.textContent?.trim(),
      uniqueId: (doc: Document) => doc.querySelector('.nl-product__sku')?.textContent?.trim(),
    },
  },
  jsonLd: {
    schemaType: 'Product',
    selectors: {
      name: { path: 'name' },
      price: { path: 'offers.price' },
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
