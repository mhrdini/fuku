import baseConfig from '@fuku/config-eslint/base'

export default [
  ...baseConfig,
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
]
