import type { LanguageKey } from '~/types/language/language.types'

type LocalizedLinks = {
  [key in LanguageKey]: {
    CONTACT: string
    SUPPORTED_RETAILERS: string
  }
}

export const LOON_WEBSITE_BASE_EN = 'https://getloon.ca'
export const LOON_WEBSITE_BASE_FR = 'https://getloon.ca/fr'

export const LOCALIZED_APP_LINKS: LocalizedLinks = {
  en: {
    CONTACT: `${LOON_WEBSITE_BASE_EN}/contact`,
    SUPPORTED_RETAILERS: `${LOON_WEBSITE_BASE_EN}/retailers`,
  },
  fr: {
    CONTACT: `${LOON_WEBSITE_BASE_FR}/contact`,
    SUPPORTED_RETAILERS: `${LOON_WEBSITE_BASE_FR}/détaillants`,
  },
}

export const APP_LINKS = {
  WELCOME: `${LOON_WEBSITE_BASE_EN}/welcome`,
}
