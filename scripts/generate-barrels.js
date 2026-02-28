#!/usr/bin/env node
const { execSync } = require('child_process')

const mappings = [
  {
    directory: 'packages/domain/src/schemas',
    outFile: 'packages/domain/src/schemas/index.ts',
  },
  {
    directory: 'packages/api/src/schemas',
    outFile: 'packages/api/src/schemas/index.ts',
  },
  {
    directory: 'packages/scheduling/src/domain/types',
    outFile: 'packages/scheduling/src/domain/types/index.ts',
  },
  {
    directory: 'packages/ui/src/components',
    outFile: 'packages/ui/src/components/index.ts',
  },
]

for (const map of mappings) {
  console.log(`Generating barrel for ${map.directory}...`)
  execSync(
    `pnpx barrelsby --directory ${map.directory} --outFile ${map.outFile} --delete --exclude node_modules --exclude dist`,
    { stdio: 'inherit' },
  )
}

console.log('All barrels generated ✅')
