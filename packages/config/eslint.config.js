/**
 * @bpa/config - Shared ESLint configuration
 *
 * Usage in apps/packages:
 * import baseConfig from '@bpa/config/eslint';
 * export default [...baseConfig, { ... }];
 */

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        { allowExpressions: true },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'off',
    },
  },
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/.next/**'],
  }
);
