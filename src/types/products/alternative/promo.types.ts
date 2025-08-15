export interface PromoData {
  url: string | null
  code: string
  name: string | null
  id: string
  description: string | null
  discount_type: 'percentage' | 'fixed_amount' | 'bogo'
  discount_value: number | string | null
}
