/* eslint-env node */
import { config as baseConfig } from '@fuku/config-eslint/base'

const config = [
  ...baseConfig,
  {
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    ignores: [
      'dist/**', // example: ignore build output
    ],
  },
  // {
  //   files: ['**/*.[jt]s', 'apps/web/**/*.[jt]s[x]'],
  // },
]
export default config
