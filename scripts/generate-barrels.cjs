#!/usr/bin/env node
const { execSync } = require('node:child_process')

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
  {
    directory: 'packages/db/src/testing/factories',
    outFile: 'packages/db/src/testing/factories/index.ts',
  },
]

const exclude = '\\.test\\.|\\.spec\\.'

for (const map of mappings) {
  console.log(`Generating barrel for ${map.directory}...`)
  execSync(
    `barrelsby --directory ${map.directory} --outFile ${map.outFile} --delete --exclude node_modules --exclude dist --exclude "${exclude}"`,
    { stdio: 'inherit' },
  )
}

console.log('All barrels generated ✅')
