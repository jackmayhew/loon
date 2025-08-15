export interface RetailerInfo {
  active_domain: ActiveDomain
  alternative_websites?: AlternativeWebsites
  categories?: string
  country: string
  domain_key: string
  domain_keys: string[]
  domains?: { domains: ActiveDomain[] }
  id: string
  is_canadian: boolean
  name: string
  url_patterns?: Record<string, any>
  website: string
  unknown_retailer: boolean
}

export interface ActiveDomain {
  domain: string
  lang_keys: string[]
  language: 'english' | 'french'
  name?: string
}

interface AlternativeWebsites {
  [key: string]: string
}
