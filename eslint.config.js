import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';

export default [
  {
    ignores: [
      'dist',
      'node_modules',
      '*.config.js',
      '*.config.ts',
      'jscpd-report',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.node,
        React: 'readonly',
        EventListener: 'readonly',
      },
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'off', // Disabled for development - Chrome AI debugging
      'prettier/prettier': [
        'error',
        {
          semi: true,
          singleQuote: true,
        },
      ],
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-undef': 'off',
    },
  },
  {
    files: [
      '**/components/ui/**/*.{ts,tsx}',
      '**/services/**/*.{ts,tsx}',
      '**/utils/**/*.{ts,tsx}',
      '**/types/**/*.{ts,tsx}',
      '**/testing/**/*.{ts,tsx}',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: [
      '**/__tests__/**/*.{ts,tsx}',
      '**/tests/**/*.{ts,tsx}',
      '**/utils/**/*.{ts,tsx}',
      '**/lib/**/*.{ts,tsx}',
      '**/types/**/*.{ts,tsx}',
      '**/constants/**/*.{ts,tsx}',
      '**/config/**/*.{ts,tsx}',
      '**/helpers/**/*.{ts,tsx}',
      '**/stores/**/*.{ts,tsx}',
      '**/services/**/*.{ts,tsx}',
      '**/hooks/**/*.{ts,tsx}',
      '**/components/ui/**/*.{ts,tsx}',
      '**/components/shared/ViewCodeButton.tsx',
      '**/summarizer/components/QuickSamplesCard.tsx',
      '**/providers/CodeThemeProvider.tsx',
      '**/providers/ThemeProvider.tsx',
      '**/shared/components/Toast.tsx',
      '**/testing/**/*.{ts,tsx}',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
];
