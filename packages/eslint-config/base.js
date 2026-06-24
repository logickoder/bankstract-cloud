// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import stylistic from '@stylistic/eslint-plugin'
import js from '@eslint/js'
import importPlugin from 'eslint-plugin-import'
import tseslint from 'typescript-eslint'

// Shared flat config. Directive 9: strict, errors not warns, zero `any`,
// `@ts-expect-error` only (never `@ts-ignore`), no unused vars.
export const base = tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    plugins: { import: importPlugin, '@stylistic': stylistic },
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      // Style is enforced by eslint, not prettier (there is no prettier in this repo). Single quotes
      // for JS strings, no semicolons, double quotes for JSX attributes. `eslint --fix` normalizes,
      // so editor format-on-save cannot drift the codebase off-idiom.
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/semi': ['error', 'never'],
      '@stylistic/jsx-quotes': ['error', 'prefer-double'],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-ignore': true, 'ts-expect-error': 'allow-with-description' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      'import/no-duplicates': 'error',
      'import/order': [
        'error',
        {
          'newlines-between': 'always',
          alphabetize: { order: 'asc' },
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // JS config files (eslint.config.js, etc) aren't part of any tsconfig, so turn off
    // type-aware rules so the project service doesn't demand them in a tsconfig.
    files: ['**/*.{js,cjs,mjs}'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    ignores: ['dist/**', '.next/**', '.turbo/**', 'node_modules/**'],
  },
)
