import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const typescriptFiles = ['**/*.{ts,tsx}']
const sourceAreaImports = (...areas) => areas.flatMap((area) => [`**/${area}`, `**/${area}/**`])

export default defineConfig(
  {
    ignores: [
      'coverage/',
      'dist/',
      'node_modules/',
      'outputs/',
      'playwright-report/',
      'test-results/',
      'tmp/',
    ],
  },
  {
    ...js.configs.recommended,
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.node,
      sourceType: 'module',
    },
  },
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: typescriptFiles,
  })),
  {
    files: typescriptFiles,
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      ...reactRefresh.configs.vite.rules,
    },
  },
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react/*', 'react-dom', 'react-dom/*'],
              message: 'Domain modules must remain independent of React and other UI frameworks.',
            },
            {
              group: sourceAreaImports(
                'app',
                'components',
                'config',
                'features',
                'i18n',
                'storage',
                'test',
              ),
              message:
                'Domain modules must remain independent of application, UI, configuration, localization, storage, and test infrastructure.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: sourceAreaImports('app', 'features', 'storage'),
              message:
                'Shared components must not depend on the application shell, product features, or persistence.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/config/**/*.{ts,tsx}', 'src/i18n/**/*.{ts,tsx}', 'src/storage/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: sourceAreaImports('app', 'components', 'features'),
              message: 'Infrastructure modules must not depend on the application shell or UI.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: sourceAreaImports('app'),
              message: 'Features must not depend on the application composition root.',
            },
          ],
        },
      ],
    },
  },
)
