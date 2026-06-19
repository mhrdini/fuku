export default {
  locales: ['en', 'ja'],
  extract: {
    input: 'apps/web/src/**/*.{js,ts,jsx,tsx}',
    output: 'packages/i18n/locales/{{language}}/{{namespace}}.json',
  },
}
