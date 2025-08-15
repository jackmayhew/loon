import type { PageType } from '~/types/view-data/page-type.types'
import type { RetailerInfo } from '~/types/retailer/retailer.types'

export interface ScrapeTriggerData {
  pageType: PageType
  tabId: number
  retailer: RetailerInfo
}
