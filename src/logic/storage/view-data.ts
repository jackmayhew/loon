import { useWebExtensionStorage } from '~/composables/use-web-extension-storage'
import type { CustomViewType } from '~/types/view-data/custom-view.types'
import type { ViewData } from '~/types/view-data/view-data.types'

export const activeCustomView = useWebExtensionStorage<CustomViewType | null>('active_custom_view', null)
export const viewDataCached = useWebExtensionStorage<Record<number, ViewData>>('view_data_cached', {})
