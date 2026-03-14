import js from '@eslint/js';
import css from '@eslint/css';
// import importResolver from 'eslint-import-resolver-node';
import importPlugin from 'eslint-plugin-import';
import '@underscript/eslint-config';
import { defineConfig } from '@eslint/config-helpers';
import globals from 'globals';

export default defineConfig([
  {
    files: ['**/*.js'],
    plugins: {
      importPlugin,
      js,
    },
    extends: [
      // '@underscript',
      js.configs.recommended,
      importPlugin.flatConfigs.recommended,
    ],
    ignores: [
      '/public/resources/modules/3rdparty/*',
      './scripts/*',
    ],
    languageOptions: {
      ecmaVersion: 2025,
      globals: {
        ...globals.browser,
        ...globals.es2021,
        editEvent: 'readonly',
      },
      sourceType: 'module',
    },
    rules: {
      'import/no-mutable-exports': 'warn',
      'import/extensions': ['error', 'ignorePackages'],
      'import/no-unresolved': ['error', {
        ignore: [
          '^http',
        ],
      }],
      camelcase: ['warn', {
        ignoreGlobals: true,
      }],
      'lines-between-class-members': ['error', 'always', {
        exceptAfterSingleLine: true,
      }],
      'max-len': ['error', {
        code: 120,
        ignoreComments: true,
        ignoreRegExpLiterals: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        tabWidth: 2,
      }],
      'no-bitwise': 'off',
      'no-console': ['error', {
        allow: ['dir', 'error'],
      }],
      'no-continue': 'off',
      'no-mixed-operators': 'off',
      // Allow modification of properties
      'no-param-reassign': ['error', {
        props: false,
      }],
      // Allow for loops to use unary (++/--)
      'no-plusplus': ['warn', {
        allowForLoopAfterthoughts: true,
      }],
      'no-restricted-globals': ['error', ''],
      'no-shadow': ['error', {
        ignoreOnInitialization: true,
      }],
      // Allow short circuits: test && action
      'no-unused-expressions': ['error', {
        allowShortCircuit: true,
      }],
      // Allow function arguments to be unused
      'no-unused-vars': ['error', {
        args: 'none',
      }],
      // Allow functions to be defined after references (functions are top-level)
      'no-use-before-define': ['error', 'nofunc'],
      'object-curly-newline': ['error', {
        multiline: true,
        consistent: true,
      }],
      'operator-linebreak': ['error', 'after'],
      'prefer-arrow-callback': ['error', {
        allowNamedFunctions: true,
      }],
      // Deconstruction not required when assigning to object properties (declared_var = object.key)
      'prefer-destructuring': ['error', {
        AssignmentExpression: {
          array: true,
          object: false,
        },
      }],
      quotes: ['error', 'single', {
        allowTemplateLiterals: true,
        avoidEscape: true,
      }],
      semi: 'error',
      'no-underscore-dangle': ['error', {
        allow: [
          '_oldValue',
          '_tippy',
        ],
      }],
    },
  },
  {
    files: ['./eslint.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['./public/service-worker.js'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        workbox: 'readonly',
      },
    },
  },
  {
    files: ['**/*.css'],
    plugins: {
      css,
    },
    language: 'css/css',
    // extends: ['css/recommended'],
    rules: {},
  },
  {
    files: ['./scripts/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
]);
