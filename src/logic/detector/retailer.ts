import { getDomainWithoutSuffix } from 'tldts'
import { getPageLanguage } from '~/utils/misc/lang'
import { allRetailerConfigs } from '~/logic/storage/index'
import type { ActiveDomain, RetailerInfo } from '~/types/retailer/retailer.types'
import type { RetailerConfigFromDB } from '~/types/retailer/retailer-data.types'

/**
 * Finds the specific domain configuration that matches the detected page language.
 * @param {ActiveDomain[] | undefined} availableDomains - The list of domain configurations for a retailer.
 * @param {string | null | undefined} pageLang - The language key (e.g., 'en', 'fr') of the current page.
 * @returns {ActiveDomain | undefined} The matching domain configuration or undefined if not found.
 */
function findDomainForLanguage(
  availableDomains: ActiveDomain[] | undefined,
  pageLang: string | null | undefined,
): ActiveDomain | undefined {
  if (!pageLang || !availableDomains || availableDomains.length === 0)
    return undefined

  return availableDomains.find(domainEntry =>
    domainEntry.lang_keys.includes(pageLang),
  )
}

/**
 * Synchronously detects the active retailer by looking up the current tab's hostname
 * in the cached `allRetailerConfigs`. If a match is found, it further refines the
 * result by selecting the domain-specific configuration that matches the page's language.
 * This is a fast, local-only operation with no network requests.
 * @param {string} hostname - The hostname of the current website.
 * @param {number} tabId - The ID of the current tab, used for language detection.
 * @returns {Promise<RetailerInfo | null>} A `RetailerInfo` object if a matching config is found, otherwise null.
 */
export async function detectRetailer(hostname: string, tabId: number, freshlyFetchedConfigs?: RetailerConfigFromDB[]): Promise<RetailerInfo | null> {
  if (!hostname)
    return null

  let domainKey: string | null
  try {
    domainKey = getDomainWithoutSuffix(hostname)
    if (!domainKey)
      return null
  }
  catch (error) {
    console.error('Error extracting domainKey from hostname:', hostname, error)
    return null
  }

  const configs = freshlyFetchedConfigs || allRetailerConfigs.value

  if (!configs || configs.length === 0) {
    console.error('detectRetailer: `allRetailerConfigs` cache is empty.')
    return null
  }

  const foundRetailer = configs.find((config: RetailerConfigFromDB) =>
    config.domain_keys.includes(domainKey!),
  )

  if (!foundRetailer)
    return null

  const currentPageLang = await getPageLanguage(tabId, undefined)

  // We now use findDomainForLanguage on the domains object from the DB config
  const correctActiveDomain = findDomainForLanguage(
    foundRetailer.domains?.domains,
    currentPageLang,
  )

  // If we couldn't find a language-specific domain, we can't create a valid RetailerInfo
  if (!correctActiveDomain) {
    return null
  }

  // TODO: Align `RetailerInfo` and `RetailerConfigFromDB` types.
  // This would allow for cleaner object creation using object spreading
  // {...foundRetailer, ...} and remove the need for these default values.
  const result: RetailerInfo = {
    domain_key: foundRetailer.domain_key,
    name: foundRetailer.name,
    domain_keys: foundRetailer.domain_keys,
    domains: foundRetailer.domains,
    url_patterns: foundRetailer.url_patterns,
    active_domain: correctActiveDomain,
    id: '',
    country: '',
    is_canadian: false,
    website: '',
    unknown_retailer: false,
  }

  return result
}
