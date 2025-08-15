import type { ProductPageData } from '~/types/scraper/product-page-result.types'

/**
 * Scrapes product data from a '#__NEXT_DATA__' script, a common pattern in
 * websites built with the Next.js framework. It updates the fields of the
 * provided `productData.data` object.
 *
 * NOTE: This function always returns `true`. Its failure is considered
 * non-critical, allowing the main extraction process to fall back to
 * standard DOM scraping if __NEXT_DATA__ is unavailable or malformed.
 *
 * @param {Document} doc The DOM document to scrape.
 * @param {ProductPageData} productData The data object to be updated.
 * @returns {Promise<boolean>} Always returns true to ensure the scraping
 * process continues to the next step.
 */
export async function customScrapingLogic(doc: Document, productData: ProductPageData): Promise<boolean> {
  const scriptElement = doc.querySelector('#__NEXT_DATA__')
  let jsonData

  try {
    // Safely parse JSON
    jsonData = JSON.parse(scriptElement?.textContent || '{}')
  }
  catch (e) {
    console.error('Failed to parse __NEXT_DATA__:', e)
    jsonData = {} // Ensure jsonData is an object even on parse failure
  }

  const viewDefinition = jsonData?.props?.pageProps?.viewDefinition

  if (viewDefinition) {
    const data = productData.data

    const decodedDesc = viewDefinition.description ? decodeHtml(viewDefinition.description) : ''

    data.name = data.name ?? viewDefinition.name ?? null
    data.price = data.price ?? viewDefinition.price?.formattedValue ?? null
    data.image = data.image ?? viewDefinition.images?.[0]?.url ?? null
    data.manufacturer = data.manufacturer ?? viewDefinition.brandName ?? null
    data.description = data.description ?? (decodedDesc ? decodedDesc.slice(0, 150) : undefined)
    data.sku = data.sku ?? viewDefinition.code ?? null
    data.uniqueId = data.uniqueId ?? viewDefinition.code ?? null
  }

  return true
}

/**
 * Decodes HTML entities from a string.
 * Uses DOMParser, which is standard in browsers but may require a library/polyfill
 * (e.g., 'jsdom', 'domino') in Node.js environments.
 *
 * @param {string | null | undefined} html The HTML string to decode.
 * @returns {string} The decoded text content, or an empty string if input is null/empty or decoding fails.
 */
function decodeHtml(html: string): string {
  if (!html)
    return ''
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return doc.body.textContent || ''
  }
  catch (e) {
    console.error('HTML decoding failed', e)
    return html
  }
}
