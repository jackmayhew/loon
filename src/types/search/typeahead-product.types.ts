export interface TypeaheadProduct {
  product_id: string
  manufacturer_name: string
  product_name: string
  product_name_highlighted: string
  product_description: string
  image_url: string
  purchase_url: string
  affiliate_url: string
  current_price: number
  currency_code: string
  primary_category_name: string
  retailer_name: string
  retailer_country: string
  active_promo: {
    id: string
    url: string | null
    code: string
    name: string
    description: string | null
    discount_type: 'fixed_amount' | 'percentage' | 'bogo'
    discount_value: number
  } | null
  other_listings: {
    listing_id: string
    active_promo: null
    purchase_url: string
    affiliate_url: string
    currency_code: string
    current_price: number
    retailer_name: string
    retailer_country: string
  }[] | null
}
