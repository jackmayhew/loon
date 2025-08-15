import { defineConfig } from 'unocss/vite'
import { presetAttributify, presetIcons, presetUno, transformerDirectives } from 'unocss'
import presetWebFonts from '@unocss/preset-web-fonts'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons(),
    presetWebFonts({
      provider: 'google',
      fonts: {
        sans: 'Inter:400,700',
        poppins: 'Poppins:400,500',
        onest: 'Onest:400,500,600',
      },
    }),
  ],
  transformers: [
    transformerDirectives(),
  ],
})
