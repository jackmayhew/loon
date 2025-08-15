import { StorageSerializers } from '@vueuse/core'
import { useWebExtensionStorage } from '~/composables/use-web-extension-storage'
import type { RetailerConfigFromDB } from '~/types/retailer/retailer-data.types'

export const allRetailerConfigs = useWebExtensionStorage<RetailerConfigFromDB[] | null>('all_retailer_configs', null, { serializer: StorageSerializers.object })
