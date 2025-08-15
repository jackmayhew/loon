import { createI18n } from 'vue-i18n'

import enRaw from '../locales/en.json?raw'
import frRaw from '../locales/fr.json?raw'

const enMessages = JSON.parse(enRaw)
const frMessages = JSON.parse(frRaw)

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: enMessages,
    fr: frMessages,
  },
})
