export default {
  dom: {
    selectors: {
      name: (doc: Document) => doc.querySelector('[automation-id="productName"]')?.textContent?.trim(),
      price: (doc: Document) => doc.querySelector('[automation-id="productPriceOutput"]')?.textContent?.trim(),
      image: (doc: Document) => doc.querySelector('#heroImage_zoom')?.getAttribute('src'),
      category: (doc: Document) => {
        const exclude = ['Go to', 'Home', 'Aller au', 'Accueil']
        const categories = Array.from(doc.querySelectorAll('[itemprop="itemListElement"] a span'))
          // .map(el => el.childNodes[el.childNodes.length - 1]?.textContent?.trim())
          .map(el => el.textContent?.trim())
          .filter(Boolean)
          .filter((category: any) => !exclude.includes(category))
        const uniqueCategories = [...new Set(categories)]
        return uniqueCategories.join(' > ') || undefined
      },
      manufacturer: (doc: Document) => doc.querySelector('[itemprop="brand"]')?.textContent?.trim(),
      description: (doc: Document) => doc.querySelector('#productDescriptions1')?.textContent?.trim().slice(0, 150),
      sku: (doc: Document) => doc.querySelector('[automation-id="itemNumberOutput"]')?.textContent?.replace(/\D/g, '')?.trim(),
      uniqueId: (doc: Document) => doc.querySelector('[automation-id="itemNumberOutput"]')?.textContent?.replace(/\D/g, '')?.trim(),
    },
  },
}
