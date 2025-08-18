import { customScrapingLogic } from '../utils/custom-scraping-logic'

export default {
  dom: {
    selectors: {
      name: (doc: Document) => doc.querySelector('[class*="productInfo"] [class*="productName"]')?.textContent?.trim(),
      locale_name: (doc: Document) => doc.querySelector('[class*="productInfo"] [class*="productName"]')?.textContent?.trim(),
      price: (doc: Document) => {
        const priceText = doc.querySelector('[data-testid="price-container"] span')?.textContent?.trim()
        return priceText ? priceText.slice(1) : null
      },
      image: (doc: Document) => doc.querySelector('[class*="productCarouselButton"] [class*="imageButtonContainer"] img')?.getAttribute('src'),
      category: (doc: Document) => {
        const categories = Array.from(doc.querySelectorAll('[class*="breadcrumbLink"]'))
          .map(el => el.textContent?.trim())
          .filter(Boolean)
        const uniqueCategories = [...new Set(categories)]
        return uniqueCategories.join(' > ') || undefined
      },
      manufacturer: (doc: Document) => doc.querySelector('[class*="productInfo"] [class*="brandName"] a')?.textContent?.trim(),
      description: (doc: Document) => doc.querySelector('[class*="descriptionContainer"] [class*="description"]')?.textContent?.trim()?.slice(0, 300),
      sku: (doc: Document) => doc.querySelector('[class*="descriptionContainer"] [class*="body"]')?.textContent?.trim().split('#')[1]?.trim(),
      uniqueId: (doc: Document) => doc.querySelector('[class*="descriptionContainer"] [class*="body"]')?.textContent?.trim().split('#')[1]?.trim(),
      madeInCanada: (doc: Document) => {
        const element = doc.querySelector('[class*="PreparedInCanada"]')
        return !!element || 'Unknown'
      },
    },
  },
  customScraping: {
    type: '__NEXT_DATA__',
    functions: {
      customScrapingLogic,
    },
  },
}
