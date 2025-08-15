import configs from '~/logic/retailer-config'
import type { RetailerInfo } from '~/types/retailer/retailer.types'
import type { RetailerConfigResult } from '~/types/retailer/retailer-config.types'

/**
 * Gets retailer info from browser storage and retrieves the corresponding
 * configuration object based on the retailer's domain key.
 * @returns {Promise<RetailerConfigResult | null>} A promise resolving to the config result object or null if not found/error.
 */

export function getRetailerConfig(retailerInfo: RetailerInfo | null): RetailerConfigResult | null {
  if (!retailerInfo) {
    console.error('Scraper: Invalid retailerInfo object provided.')
    return null
  }

  const { domain_key: retailerName, active_domain: activeDomain } = retailerInfo

  if (!retailerName || !activeDomain) {
    console.error('Scraper: Retailer name or active domain not found in retailerInfo.')
    return null
  }

  const config = configs[retailerName]

  if (!config) {
    console.error(`Scraper: Static config not found for retailer: ${retailerName}`)
    return null
  }

  return {
    config,
    activeDomain,
    retailerName,
  }
}
