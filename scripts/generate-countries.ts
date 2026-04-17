// scripts/generate-countries.ts
import fs from 'node:fs'
import path from 'node:path'
import countries from 'i18n-iso-countries'
import en from 'i18n-iso-countries/langs/en.json'

countries.registerLocale(en)

const data = Object.entries(
  countries.getNames('en', { select: 'official' }),
).map(([code, name]) => ({
  code,
  name,
}))

const outputPath = path.resolve(
  'packages/domain/src/i18n/country/country.generated.ts',
)

const file = `// AUTO-GENERATED FILE — DO NOT EDIT

export const ALL_COUNTRIES = ${JSON.stringify(data, null, 2)} as const;

export type CountryCode =
  (typeof ALL_COUNTRIES)[number]['code'];
`

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, file)

console.log(`Generated ${data.length} countries`)
