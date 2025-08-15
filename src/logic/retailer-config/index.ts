import amazon from './retailers/amazon/index'
import bestbuy from './retailers/bestbuy/index'
import canadiantire from './retailers/canadiantire/index'
import costco from './retailers/costco/index'
import shoppersdrugmart from './retailers/shoppersdrugmart/index'
import staples from './retailers/staples/index'
import walmart from './retailers/walmart/index'
import type { ConfigMap } from '~/types/retailer/retailer-config.types'

export default {
  amazon,
  bestbuy,
  canadiantire,
  costco,
  shoppersdrugmart,
  staples,
  walmart,
} as ConfigMap
