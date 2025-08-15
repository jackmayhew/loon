import type { ScrapedCartItem } from '~/types/products/scraped/scraped-cart-product.types'
import { hashString } from '~/utils/misc/hash-string'

interface ItemSelectorsConfig {
  nameSelector: string // CSS selector for the element containing the name
  idSourceSelector: string // CSS selector for the element containing the unique ID
  idSourceIsText: boolean // true if ID/Name comes from textContent, false if from 'alt' attribute
  imageSelector: string // CSS selector for the image element
}

/**
 * Main function to trigger scraping of additional item types (collapsed, unavailable) from the cart page.
 * Needs to be async to await the handlers.
 * @param {any} cartData - The main cart data object to potentially add items to (mutated).
 * @param {string} activeDomainName - Current domain name.
 */
export async function handleAdditionalCartLogic(cartData: any, activeDomainName: string): Promise<void> {
  // Await the results from the async handlers
  await handleCollapsedCartItems(cartData, activeDomainName)
  await handleUnavailableCartItems(cartData, activeDomainName)
}

/**
 * Generic helper to extract cart item data (name, id, image) based on provided selectors.
 * Hashes the unique ID asynchronously.
 * @param {string} listSelector - CSS selector for the list items (e.g., 'ul li').
 * @param {ItemSelectorsConfig} itemConfig - Object defining selectors within each item.
 * @param {string} activeDomainName - Current domain name for unique ID generation.
 * @returns {Promise<CartItem[]>} A promise resolving to an array of extracted cart items with hashed IDs.
 */
async function extractCartItemData(listSelector: string, itemConfig: ItemSelectorsConfig, activeDomainName: string): Promise<ScrapedCartItem[]> {
  const listItems = document.querySelectorAll(listSelector)
  if (listItems.length === 0)
    return []

  const itemPromises = Array.from(listItems).map(async (itemElement): Promise<ScrapedCartItem | null> => {
    const nameElement = itemElement.querySelector<HTMLElement | HTMLImageElement>(itemConfig.nameSelector)
    const idElement = itemElement.querySelector<HTMLElement | HTMLImageElement>(itemConfig.idSourceSelector)
    const imageElement = itemElement.querySelector<HTMLImageElement>(itemConfig.imageSelector)

    const name = itemConfig.idSourceIsText ? nameElement?.textContent?.trim() : nameElement?.getAttribute('alt')
    const originalUniqueId = itemConfig.idSourceIsText ? idElement?.textContent?.trim() : idElement?.getAttribute('alt')
    const imgSrc = imageElement?.getAttribute('src')

    // Use a locally defined or imported processCartItemImage
    const processedImage = processCartItemImage(imgSrc)

    if (name && processedImage && originalUniqueId) {
      const hashedUniqueId = await hashString(originalUniqueId)

      if (hashedUniqueId) {
        const itemData: ScrapedCartItem = {
          name: name.replace(/\s+with addon services$/i, ''),
          image: processedImage,
          uniqueId: hashedUniqueId,
          uniqueIdName: `${hashedUniqueId}-${activeDomainName}`,
        }
        return itemData
      }
      else {
        console.warn(`Failed to hash uniqueId: ${originalUniqueId} for item: ${name}`)
        return null
      }
    }
    return null
  })

  const processedItems = await Promise.all(itemPromises)
  return processedItems.filter((item): item is ScrapedCartItem => item !== null)
}

/**
 * Handles extraction of 'collapsed' cart items
 * Needs to be async to await extractCartItemData.
 * @param {any} cartData - The main cart data object to add items to (mutated).
 * @param {string} activeDomainName - Current domain name.
 */
async function handleCollapsedCartItems(cartData: any, activeDomainName: string): Promise<void> {
  const listSelector = '[data-testid="collapsedItemList"] ul li'
  const itemConfig: ItemSelectorsConfig = {
    nameSelector: 'div img',
    idSourceSelector: 'div img',
    idSourceIsText: false,
    imageSelector: 'div img',
  }

  const extractedItems = await extractCartItemData(listSelector, itemConfig, activeDomainName)

  if (extractedItems.length > 0) {
    cartData.items.push(...extractedItems)

    // Extract number of hidden items indicated by "+N" in the list
    const collapsedListItems = document.querySelectorAll(listSelector)
    let hiddenCount = null
    const regex = /\+(\d+)/
    const matchingItem = Array.from(collapsedListItems).find(item =>
      regex.test(item?.textContent?.trim() ?? ''),
    )
    if (matchingItem) {
      const match = matchingItem.textContent?.trim().match(regex)
      if (match)
        hiddenCount = Number.parseInt(match[1], 10)
    }
    if (hiddenCount !== null) {
      cartData.collapsedItems = true
    }
  }
}

/**
 * Handles extraction of 'unavailable' cart items.
 * Needs to be async to await extractCartItemData.
 * @param {any} cartData - The main cart data object to add items to (mutated).
 * @param {string} activeDomainName - Current domain name.
 */
async function handleUnavailableCartItems(cartData: any, activeDomainName: string): Promise<void> {
  const listSelector = '[data-testid="unavailable-list-item"] ul li'
  const itemConfig: ItemSelectorsConfig = {
    nameSelector: '[data-testid="nonClickableProductDetails"] span',
    idSourceSelector: '[data-testid="nonClickableProductDetails"] span',
    idSourceIsText: true,
    imageSelector: '[data-testid="nonClickableImageLink"] img',
  }

  // Await the result here
  const extractedItems = await extractCartItemData(listSelector, itemConfig, activeDomainName)

  if (extractedItems.length > 0) {
    cartData.items.push(...extractedItems)
  }
}

/**
 * Processes image URLs, replacing height/width parameters.
 * (Make sure this function exists and is correctly imported/defined)
 * @param {string | null | undefined} imgSrc - The original image source URL.
 * @returns {string | null} The processed image URL or null.
 */
function processCartItemImage(imgSrc: string | null | undefined): string | null {
  if (!imgSrc)
    return null // Return null instead of undefined for consistency
  // Upscales resolution in URL params for consistency
  return imgSrc
    .replace(/odnHeight=\d+/, 'odnHeight=500')
    .replace(/odnWidth=\d+/, 'odnWidth=500')
}
