import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/*'],
  ignoreWatch: ['node_modules', '.git', 'dist', 'generated'],
})
