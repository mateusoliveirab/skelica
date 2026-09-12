import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // An underscore prefix is how this codebase marks a deliberately unused binding
      // (unused function arguments, intentionally ignored destructured fields).
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    // `no-useless-escape` mis-reports inside character classes here. `[:\-—]` means the three
    // characters `:`, `-`, `—`; dropping the backslash yields `[:-—]`, which JavaScript reads
    // as the *range* from `:` to `—` and matches nearly every character. Following the rule
    // silently broke example detection across the corpus. The escapes stay.
    files: ['src/core/patterns/*.ts'],
    rules: {
      'no-useless-escape': 'off',
    },
  },
  {
    // Test files drive mocks and fixtures through shapes that are painful to model exactly;
    // `any` there is a deliberate trade-off, not an oversight. Production code has no such
    // exemption.
    files: ['**/*.test.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
])
