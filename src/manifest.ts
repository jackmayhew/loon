import fs from 'fs-extra'
import type { Manifest } from 'webextension-polyfill'
import type PkgType from '../package.json'
import { isDev, isFirefox, port, r } from '../scripts/utils'
import { LOON_WEBSITE_BASE_EN } from './constants/links/links'

export async function getManifest() {
  const pkg = await fs.readJSON(r('package.json')) as typeof PkgType

  const manifest: Manifest.WebExtensionManifest = {
    manifest_version: 3,
    name: pkg.displayName || pkg.name,
    version: pkg.version,
    description: pkg.description,
    ...(isFirefox && {
      browser_specific_settings: {
        gecko: {
          id: 'loon@getloon.ca',
        },
      },
    }),
    homepage_url: LOON_WEBSITE_BASE_EN,
    action: {
      default_icon: 'assets/icons/icon48.png',
      default_popup: './dist/popup/index.html',
    },
    options_ui: {
      page: './dist/options/index.html',
      open_in_tab: true,
    },
    background: isFirefox
      ? {
          scripts: ['dist/background/index.mjs'],
          type: 'module',
        }
      : {
          service_worker: './dist/background/index.mjs',
        },
    icons: {
      16: 'assets/icons/icon16.png',
      32: 'assets/icons/icon32.png',
      48: 'assets/icons/icon48.png',
      128: 'assets/icons/icon128.png',
    },
    permissions: [
      'tabs',
      'storage',
      'activeTab',
      'scripting',
      'alarms',
      'webNavigation',
    ],
    host_permissions: [
      '*://*.amazon.ca/*',
      '*://*.bestbuy.ca/*',
      '*://*.bureauengros.com/*',
      '*://*.bureauengros.ca/*',
      '*://*.canadiantire.ca/*',
      '*://*.costco.ca/*',
      '*://*.pharmaprix.ca/*',
      '*://*.shoppersdrugmart.ca/*',
      '*://*.staples.ca/*',
      '*://*.walmart.ca/*',
      'https://api.getloon.ca/*',
      ...(isDev ? [`http://localhost:${port}/*`] : []),
    ],
    content_scripts: [
      {
        matches: [
          '*://*.amazon.ca/*',
          '*://*.bestbuy.ca/*',
          '*://*.bureauengros.com/*',
          '*://*.bureauengros.ca/*',
          '*://*.canadiantire.ca/*',
          '*://*.costco.ca/*',
          '*://*.pharmaprix.ca/*',
          '*://*.shoppersdrugmart.ca/*',
          '*://*.staples.ca/*',
          '*://*.walmart.ca/*',
          ...(isDev ? [`http://localhost:${port}/*`] : []),
        ],
        js: [
          'dist/contentScripts/index.global.js',
        ],
      },
    ],
    web_accessible_resources: [
      {
        resources: ['dist/contentScripts/style.css'],
        matches: [
          '*://*.amazon.ca/*',
          '*://*.bestbuy.ca/*',
          '*://*.bureauengros.com/*',
          '*://*.bureauengros.ca/*',
          '*://*.canadiantire.ca/*',
          '*://*.costco.ca/*',
          '*://*.pharmaprix.ca/*',
          '*://*.shoppersdrugmart.ca/*',
          '*://*.staples.ca/*',
          '*://*.walmart.ca/*',
          ...(isDev ? [`http://localhost:${port}/*`] : []),
        ],
      },
    ],
    content_security_policy: {
      extension_pages: isDev
        // This is required on dev for Vite script to load
        ? `script-src \'self\' http://localhost:${port}; object-src \'self\'`
        : 'script-src \'self\'; object-src \'self\'; connect-src https://api.getloon.ca',
    },
  }

  // FIXME: not working in MV3
  if (isDev && false) {
    // for content script, as browsers will cache them for each reload,
    // we use a background script to always inject the latest version
    // see src/background/contentScriptHMR.ts
    delete manifest.content_scripts
    manifest.permissions?.push('webNavigation')
  }

  return manifest
}
