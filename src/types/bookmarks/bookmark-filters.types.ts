export interface BookmarkFilters {
  query: string | null
  priceMin: number | null
  priceMax: number | null
  dateOrder: 'asc' | 'desc'
  alphabeticalOrder: 'asc' | 'desc'
  categories: string[]
  manufacturers: string[]
  provinces: string[]
  activePromo: boolean | null
  trigger: number | null
}
