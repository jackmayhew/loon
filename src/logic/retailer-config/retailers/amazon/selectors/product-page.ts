import { customScrapingLogic } from '../utils/custom-scraping-logic'

export default {
  dom: {
    container: '...',
    primaryWaitSelector: 'input#ASIN',
    criticalSelectors: [
      '...',
    ],
    selectors: {
      name: (doc: Document) => doc.querySelector('#productTitle')?.textContent?.trim(),
      locale_name: (doc: Document) => doc.querySelector('#productTitle')?.textContent?.trim(),
      price: (doc: Document) => doc.querySelector('#corePriceDisplay_desktop_feature_div .aok-offscreen')?.textContent?.trim(),
      image: (doc: Document) => doc.querySelector('#imgTagWrapperId img')?.getAttribute('src'),
      category: (doc: Document) => {
        const categories = Array.from(doc.querySelectorAll('[data-feature-name="wayfinding-breadcrumbs"] ul li a'))
          .map(el => el.textContent?.trim())
          .filter(Boolean)
        const uniqueCategories = [...new Set(categories)]
        return uniqueCategories.join(' > ') || undefined
      },
      manufacturer: (doc: Document) => {
        const listItems = Array.from(doc.querySelectorAll('[data-feature-name="detailBullets"] #detailBullets_feature_div ul li'))
        const manufacturerItem = listItems.find(item => item.querySelector('.a-text-bold')?.textContent?.includes('Manufacturer'))
        return manufacturerItem?.querySelector('span:nth-of-type(2)')?.textContent?.trim() || null
      },
      description: (doc: Document) => doc.querySelector('#productDescription')?.textContent?.trim()?.slice(0, 300),
      asin: (doc: Document) => (doc.querySelector('input#ASIN') as HTMLInputElement)?.value,
      uniqueId: (doc: Document) => (doc.querySelector('input#ASIN') as HTMLInputElement)?.value,
      madeInCanada: (doc: Document) => {
        const listItems = Array.from(doc.querySelectorAll('[data-feature-name="detailBullets"] #detailBullets_feature_div ul li'))
        const countryItem = listItems.find((item) => {
          const label = item.querySelector('.a-text-bold')?.textContent
          return label?.includes('Country of origin') || label?.includes('Pays d’origine')
        })
        const value = countryItem?.querySelector('span:nth-of-type(2)')?.textContent?.trim()
        return value === 'Canada' ? true : 'Unknown'
      },
      origin_country: (doc: Document) => {
        const listItems = Array.from(doc.querySelectorAll('[data-feature-name="detailBullets"] #detailBullets_feature_div ul li'))
        const countryItem = listItems.find((item) => {
          const label = item.querySelector('.a-text-bold')?.textContent
          return label?.includes('Country of origin') || label?.includes('Pays d’origine')
        })
        return countryItem?.querySelector('span:nth-of-type(2)')?.textContent?.trim()
      },
    },
  },
  customScraping: {
    type: 'ASIN',
    functions: {
      customScrapingLogic,
    },
  },
}
