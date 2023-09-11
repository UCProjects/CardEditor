/* eslint-env node */
module.exports = {
  env: {
    es6: true,
    browser: true,
    node: false,
  },
  extends: [
    '@underscript',
  ],
  globals: {
    editEvent: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'import/no-unresolved': ['error', {
      ignore: [
        '^http',
      ],
    }],
    'no-underscore-dangle': ['error', {
      allow: [
        '_oldValue',
        '_tippy',
      ],
    }],
  },
};
