import { config } from '@fuku/config-eslint/base'
import { defineConfig } from 'eslint/config'

export default defineConfig(
  {
    ignores: ['dist/**'],
  },
  config,
)
