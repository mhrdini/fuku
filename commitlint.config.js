module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'body-max-line-length': [0, 'always', 100],
    'body-leading-blank': [0, 'always'],
    'subject-case': [2, 'always', ['lower-case']],
  },
};
