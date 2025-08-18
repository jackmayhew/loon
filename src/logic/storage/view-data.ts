import { useWebExtensionStorage } from '~/composables/use-web-extension-storage'
import type { ViewData } from '~/types/view-data/view-data.types'

export const viewDataCached = useWebExtensionStorage<Record<number, ViewData>>('view_data_cached', {})
