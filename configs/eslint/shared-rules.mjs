import betterTailwindcss from 'eslint-plugin-better-tailwindcss'
import onlyWarn from 'eslint-plugin-only-warn'
import turboPlugin from 'eslint-plugin-turbo'
import globals from 'globals'

/**
 * Extra flat-config items shared by base/react/next. These get passed as
 * additional arguments to `antfu()`, which accepts any number of extra
 * flat config objects/arrays after its own options object.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const sharedRules = [
  // --- turbo ---
  turboPlugin.configs['flat/recommended'],
  {
    rules: {
      'turbo/no-undeclared-env-vars': [
        'error',
        {
          allowList: ['NODE_ENV'],
        },
      ],
    },
  },

  // --- never let the shared config block CI: downgrade every rule to "warn" ---
  {
    plugins: { onlyWarn },
  },

  // --- explicit node+browser globals, kept from your old config ---
  // (antfu infers a lot of this per file type already, this just preserves
  // the old blanket behavior across the whole repo)
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },

  // --- unused vars/args starting with `_` are ignored ---
  // antfu already wires up eslint-plugin-unused-imports for you (aliased
  // as `unused-imports/*`) — this just restores your old ignore pattern.
  {
    rules: {
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },

  // --- misc rule tweaks ---
  {
    rules: {
      'react-refresh/only-export-components': 'off',
      'no-irregular-whitespace': 'off',
      'no-unused-vars': 'off',
      'no-console': ['warn'],
      'ts/no-redeclare': 'off',
      'ts/explicit-function-return-type': 'off',
      'ts/consistent-type-definitions': ['error', 'type'],
      'antfu/no-top-level-await': ['off'],
      'node/prefer-global/process': ['off'],
      'node/no-process-env': ['off'],
      // Watch this one on Next.js apps: it'll flag PascalCase components
      // (Button.tsx) and bracketed dynamic routes ([id].tsx) unless you're
      // already fully kebab-case. Everything's still just a warning either
      // way (see onlyWarn above), so it's cheap to try and drop if noisy.
      'unicorn/filename-case': [
        'error',
        {
          case: 'kebabCase',
          ignore: ['README.md'],
        },
      ],
    },
  },

  // --- import order, replaces @ianvs/prettier-plugin-sort-imports ---
  // NOTE: this is an approximation. Perfectionist groups imports by a fixed
  // vocabulary (builtin/external/internal/parent/sibling/index) plus custom
  // pattern-matched groups, which isn't a 1:1 model of the ianvs plugin's
  // ordered regex list. Tweak the `groups` order below to taste.
  {
    rules: {
      'perfectionist/sort-imports': [
        'error',
        {
          type: 'natural',
          order: 'asc',
          newlinesBetween: 1, // v5+ takes a number of blank lines, not 'always'/'never'/'ignore'
          customGroups: [
            {
              groupName: 'react-type',
              modifiers: ['type'],
              elementNamePattern: ['^react$', '^react/', '^react-native'],
            },
            {
              groupName: 'react',
              elementNamePattern: ['^react$', '^react/', '^react-native'],
            },
            {
              groupName: 'next-type',
              modifiers: ['type'],
              elementNamePattern: ['^next$', '^next/'],
            },
            { groupName: 'next', elementNamePattern: ['^next$', '^next/'] },
            { groupName: 'expo', elementNamePattern: '^expo' },
            {
              groupName: 'mj-type',
              modifiers: ['type'],
              elementNamePattern: '^@mj/',
            },
            { groupName: 'mj', elementNamePattern: '^@mj/' },
            { groupName: 'alias', elementNamePattern: '^~/' },
          ],
          groups: [
            'react-type',
            'react',
            'next-type',
            'next',
            'expo',
            ['value-builtin', 'value-external'], // third-party modules
            'type-import', // remaining type-only imports
            'mj-type',
            'mj',
            'alias', // '~/...'
            ['value-parent', 'value-sibling', 'value-index'], // '../', './'
            'unknown',
          ],
        },
      ],
    },
  },

  // --- tailwind class sorting, replaces prettier-plugin-tailwindcss ---
  {
    plugins: { 'better-tailwindcss': betterTailwindcss },
    settings: {
      'better-tailwindcss': {
        // Point this at your real Tailwind entry file. Required for v4
        // (a .css file); for v3 point it at your tailwind.config.js instead.
        entryPoint: './styles/globals.css',
        attributes: ['className'],
        // cn/cva/clsx/twMerge are auto-detected already — no need to list them
      },
    },
    rules: {
      'better-tailwindcss/enforce-consistent-class-order': 'warn',
      // Prettier's printWidth-driven class wrapping isn't a faithful port —
      // turn this off rather than fight it. Flip to 'warn' if you want it.
      'better-tailwindcss/enforce-consistent-line-wrapping': 'off',
    },
  },
]
