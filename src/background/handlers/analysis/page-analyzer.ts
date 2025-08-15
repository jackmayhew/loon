import { getDomainWithoutSuffix, getPublicSuffix } from 'tldts'
import { detectRetailer } from '~/logic/detector/retailer'
import { detectPageType } from '~/logic/detector/page-type'
import { SUPPORTED_RETAILERS } from '~/constants/data/supported-retailers'
import type { PageType } from '~/types/view-data/page-type.types'
import type { RetailerInfo } from '~/types/retailer/retailer.types'
import type { RetailerConfigFromDB } from '~/types/retailer/retailer-data.types'
/**
 * Checks if a hostname is directly supported by looking up exact domain matches in retailer configs.
 */
function isHostnameSupported(hostname: string, configs: RetailerConfigFromDB[]): boolean {
  return configs.some(config =>
    config.domains?.domains?.some((d: any) => new URL(d.domain).hostname === hostname),
  )
}

/**
 * Fallback hostname check using static retailer list when configs aren't available.
 */
function isHostnameSupportedFallback(hostname: string): boolean {
  return SUPPORTED_RETAILERS.some(r => r.domain.includes(hostname))
}

/**
 * Checks if a hostname's base domain is supported (e.g., "amazon" from "amazon.com").
 */
function isBaseNameSupported(hostname: string, configs: RetailerConfigFromDB[]): boolean {
  const baseName = getDomainWithoutSuffix(hostname)
  return baseName ? configs.some(config => config.domain_keys.includes(baseName)) : false
}

/**
 * Fallback base name check using static retailer list when configs aren't available.
 */
function isBaseNameSupportedFallback(hostname: string): boolean {
  const baseName = getDomainWithoutSuffix(hostname)
  return baseName ? SUPPORTED_RETAILERS.some(r => r.baseName.includes(baseName)) : false
}

/**
 * Determines the support status of a hostname - directly supported, non-.ca supported, or unsupported.
 */
export function getPermissionStatus(hostname: string, configs: RetailerConfigFromDB[] | null): 'unsupported' | 'supported_hostname' | 'supported_non_ca' {
  if (!hostname)
    return 'unsupported'

  if (configs?.length) {
    if (isHostnameSupported(hostname, configs))
      return 'supported_hostname'
    if (isBaseNameSupported(hostname, configs))
      return 'supported_non_ca'
    return 'unsupported'
  }
  else {
    if (isHostnameSupportedFallback(hostname))
      return 'supported_hostname'
    if (isBaseNameSupportedFallback(hostname))
      return 'supported_non_ca'
    return 'unsupported'
  }
}

/**
 * Analyzes a URL to determine page type, retailer info, and Canadian domain status.
 * Only processes URLs that pass the initial permission check.
 */
export async function analyzePageDetails(
  url: string,
  tabId: number,
  configs: RetailerConfigFromDB[] | null,
): Promise<{ pageType: PageType, retailer: RetailerInfo | null, isCaDomain: boolean }> {
  const urlObject = new URL(url)
  const hostname = urlObject.hostname
  const permission = getPermissionStatus(hostname, configs)

  if (permission !== 'supported_hostname') {
    const pageType = permission === 'unsupported' ? 'UNKNOWN_RETAILER_PAGE' : 'UNSUPPORTED_DOMAIN'
    return { pageType, retailer: null, isCaDomain: false }
  }

  const retailerResult = await detectRetailer(hostname, tabId, configs ?? undefined)
  const baseName = getDomainWithoutSuffix(hostname)
  const isCaDomain = getPublicSuffix(url) === 'ca'
  const pageType = await detectPageType(url, retailerResult, isCaDomain, baseName)

  return { pageType, retailer: retailerResult, isCaDomain }
}
