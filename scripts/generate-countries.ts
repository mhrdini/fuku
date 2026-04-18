import fs from 'node:fs'
import path from 'node:path'
import countries from 'i18n-iso-countries'
import en from 'i18n-iso-countries/langs/en.json'

countries.registerLocale(en)

async function main() {
  // -------------------------
  // 1. Generate ALL countries
  // -------------------------
  const allCountries = Object.entries(
    countries.getNames('en', { select: 'official' }),
  ).map(([code, name]) => ({
    code,
    name,
  }))

  const allOutputPath = path.resolve(
    'packages/domain/src/i18n/country/all-countries.generated.ts',
  )

  const allFile = `// AUTO-GENERATED FILE — DO NOT EDIT

export const ALL_COUNTRIES = ${JSON.stringify(allCountries, null, 2)} as const;

export type CountryCode =
  (typeof ALL_COUNTRIES)[number]['code'];
`

  fs.mkdirSync(path.dirname(allOutputPath), { recursive: true })
  fs.writeFileSync(allOutputPath, allFile)

  console.log(`Generated ${allCountries.length} total countries`)

  // -------------------------
  // 2. Fetch Nager countries
  // -------------------------
  const res = await fetch('https://date.nager.at/api/v3/AvailableCountries')

  if (!res.ok) {
    throw new Error(`Failed to fetch Nager countries: ${res.status}`)
  }

  const nagerCountries: {
    countryCode: string
    name: string
  }[] = await res.json()

  // -------------------------
  // 3. Normalize to codes only
  // -------------------------
  const supportedCodes = nagerCountries.map(c => c.countryCode)

  const supportOutputPath = path.resolve(
    'packages/infrastructure/src/holiday/supported-countries.generated.ts',
  )

  const supportFile = `// AUTO-GENERATED FILE — DO NOT EDIT

export const SUPPORTED_COUNTRY_CODES = ${JSON.stringify(
    supportedCodes,
    null,
    2,
  )} as const;

export const SUPPORTED_COUNTRY_SET = new Set(SUPPORTED_COUNTRY_CODES);
`

  fs.mkdirSync(path.dirname(supportOutputPath), { recursive: true })
  fs.writeFileSync(supportOutputPath, supportFile)

  console.log(`Generated ${supportedCodes.length} supported countries`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
