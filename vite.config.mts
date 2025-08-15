/// <reference types="vitest" />
import process from 'node:process'
import { dirname, relative } from 'node:path'
import type { UserConfig } from 'vite'
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import UnoCSS from 'unocss/vite'
import { presetUno } from 'unocss'
import { isDev, port, r } from './scripts/utils'
import packageJson from './package.json'

export const sharedConfig: UserConfig = {
  root: r('src'),
  envDir: process.cwd(),
  resolve: {
    alias: {
      '~/': `${r('src')}/`,
    },
  },
  define: {
    __DEV__: isDev,
    __NAME__: JSON.stringify(packageJson.name),
  },
  plugins: [
    Vue(),

    AutoImport({
      imports: [
        'vue',
        {
          'webextension-polyfill': [
            ['=', 'browser'],
          ],
        },
      ],
      dts: r('src/auto-imports.d.ts'),
    }),

    // https://github.com/antfu/unplugin-vue-components
    Components({
      dirs: [
        r('src/components'),
        r('src/popup/components/ui'),
      ],
      // generate `components.d.ts` for ts support with Volar
      dts: r('src/components.d.ts'),
      // resolvers: [
      //   // auto import icons
      //   IconsResolver({
      //     prefix: 'i',
      //     enabledCollections: ['lucide'],
      //   }),
      // ],
    }),

    // https://github.com/antfu/unplugin-icons
    // Icons(),

    // https://github.com/unocss/unocss
    // UnoCSS(),
    UnoCSS({
      presets: [
        presetUno(),
      ],

      safelist: [
        // Safelisting
        'mt-0.5',
        'mr-0.5',
        'mb-0.5',
        'ml-0.5',
        'mt-1',
        'mr-1',
        'mb-1',
        'ml-1',
        'mt-1.5',
        'mr-1.5',
        'mb-1.5',
        'ml-1.5',
        'mt-2',
        'mr-2',
        'mb-2',
        'ml-2',
        'inline-block',
        'flex',
      ],
      theme: {
        colors: {
          // bg color
          'popup-bg': '#FAFAFA',
          'card-bg': '#FFFFFF',
          // text color
          'primary': '#27272a',
          'secondary': '#3f3f46',
          'tertiary': '#52525b',
          // error
          'error': '#ef4444',
          'button': {
            primary: {
              bg: '#27272a',
              bg_hover: '#3f3f46',
              text: '#e5e5e5',
            },
          },
          'tooltip': {
            primary: {
              bg: '#27272a',
              text: '#e5e5e5',
            },
          },
        },
        spacing: {
          // Spacing units. If already defined, these will override. If not, they're added
          0.5: '0.125rem', // 2px
          1.5: '0.375rem', // 6px
          2.5: '0.625rem', // 10px
        },
      },
      shortcuts: {
        text_primary: 'zinc-900',
        text_secondary: 'red-300',
        button_primary: 'bg-button-primary-bg text-button-primary-text font-medium rounded overflow-hidden duration-500',
        button_primary_bg: 'bg-button-primary-bg',
        // button_primary_bg_hover: 'bg-button-primary-bg_hover',
        button_primary_text: 'text-button-primary-text',
        tooltip_bg: 'bg-tooltip-primary-bg',
        tooltip_text: 'text-tooltip-primary-text',
        section_heading: 'text-2xl font-semibold text-primary',
        section_subheading: 'text-xl font-semibold text-primary',
        body_text_lg: 'text-base text-primary',
        body_text: 'text-sm text-primary',
        body_text_sm: 'text-xs text-primary',
        card_base: 'flex items-center space-x-4 bg-card-bg p-2 rounded-md border border-gray-200 shadow-sm',
        card_heading: 'text-base font-medium text-primary truncate',
        card_sm_img: 'w-28 h-28',
        error_text: 'text-red-700',
        error_text_lg: 'text-red-700 text-xl font-semibold',
        text_link: 'text-sm underline',
        loader_screen: 'min-h-120',
      },
    }),
    // rewrite assets to use relative path
    {
      name: 'assets-rewrite',
      enforce: 'post',
      apply: 'build',
      transformIndexHtml(html, { path }) {
        return html.replace(/"\/assets\//g, `"${relative(dirname(path), '/assets')}/`)
      },
    },
  ],
  optimizeDeps: {
    include: [
      'vue',
      '@vueuse/core',
      'webextension-polyfill',
    ],
    exclude: [
      'vue-demi',
    ],
  },
}

export default defineConfig(({ command }) => ({
  ...sharedConfig,
  base: command === 'serve' ? `http://localhost:${port}/` : '/dist/',
  server: {
    port,
    hmr: {
      host: 'localhost',
    },
    origin: `http://localhost:${port}`,
  },
  build: {
    watch: isDev
      ? {}
      : undefined,
    outDir: r('extension/dist'),
    emptyOutDir: false,
    sourcemap: isDev ? 'inline' : false,
    minify: 'terser',
    // https://developer.chrome.com/docs/webstore/program_policies/#:~:text=Code%20Readability%20Requirements
    terserOptions: {
      mangle: false,
      compress: {
        drop_debugger: !isDev,
        drop_console: !isDev,
      },
    },
    rollupOptions: {
      input: {
        options: r('src/options/index.html'),
        popup: r('src/popup/index.html'),
        sidepanel: r('src/sidepanel/index.html'),
      },
    },
  },
  // optimizeDeps: {
  //   include: ['gsap', 'gsap/Flip'],
  // },
  test: {
    globals: true,
    environment: 'jsdom',
  },
}))
