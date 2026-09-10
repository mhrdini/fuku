export default {
  locales: ['en', 'ja'],
  extract: {
    input: 'apps/web/src/**/*.{js,jsx,ts,tsx}',
    output: 'packages/i18n/src/locales/{{language}}/{{namespace}}.json',
  },
}
