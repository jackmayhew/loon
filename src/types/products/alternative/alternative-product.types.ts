import type { PromoData } from '~/types/products/alternative/promo.types'
import type { RetailerListings } from '~/types/products/alternative/additional-listings.types'

// TODO: Prune this interface to only include keys actually used by the frontend
export interface AlternativeProduct {
  id: string
  name: string
  price: number
  description: string
  match_confidence: number
  product_id: string
  product_name: string
  product_description?: string
  image_url?: string
  beaver_score?: string
  province_origin: string
  city_origin?: string
  is_canadian?: string
  made_in_canada?: string
  product_of_canada?: string
  manufacturer_id?: string
  manufacturer_name: string
  manufacturer_is_canadian?: string
  manufacturer_country?: string
  manufacturer_website_url?: string
  listing_id?: string
  retailer_id?: string
  retailer_name: string
  retailer_sku?: string
  current_price: number
  currency_code?: string
  purchase_url: string
  affiliate_url?: string
  retailer_is_canadian?: string
  retailer_country?: string
  matching_term?: string
  rankScore?: number
  priceAbsDifference?: string
  match_type?: string
  other_listings?: RetailerListings
  activePromo: PromoData
  overallScore: number
  primary_category_name: string
  manufacturer_province: string
  manufacturer_city: string
  search_method: string
  userVote?: 'up' | 'down' | null
}
