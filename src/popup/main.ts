import { createApp } from 'vue'
import { storage } from 'webextension-polyfill'
import App from './Popup.vue'
import { criticalStorageKeys } from '~/logic/storage/index'
import { setupApp } from '~/logic/common-setup'
import '../styles'

async function start() {
  /**
   * Pre-warms the cache for critical storage items.
   *
   * This ensures that when Vue components using these `useWebExtensionStorage`
   * refs are mounted, the data is already available synchronously. It prevents
   * a "flash" of default or empty state in the UI while waiting for the
   * initial async storage fetch to complete.
   */
  await storage.local.get(criticalStorageKeys)
  const app = createApp(App)
  setupApp(app)
  app.mount('#app')
}

start()
