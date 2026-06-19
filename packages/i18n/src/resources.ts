import en from './locales/en/translation.json'
import ja from './locales/ja/translation.json'

export const resources = {
  en: {
    translation: en,
  },
  ja: {
    translation: ja,
  },
} as const

export type Language = keyof typeof resources
