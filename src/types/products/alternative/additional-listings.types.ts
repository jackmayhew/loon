export interface RetailerListingItem {
  purchase_url: string
  currency_code: string
  current_price: number
  retailer_name: string
  retailer_country: string
  listing_id: string
}

export type RetailerListings = RetailerListingItem[] | undefined | null
