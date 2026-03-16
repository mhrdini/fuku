import * as locales from 'date-fns/locale'

export type I18nLocaleCode = keyof typeof locales
export { locales }
