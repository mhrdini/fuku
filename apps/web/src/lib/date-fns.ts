import { enGB, ja } from 'date-fns/locale'

const dateFnsLocales = {
  en: enGB,
  ja,
} as const

export function getDateFnsLocale(language: string) {
  return dateFnsLocales[language as keyof typeof dateFnsLocales] ?? enGB
}
