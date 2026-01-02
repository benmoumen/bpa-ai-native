import baseConfig from '@bpa/config/eslint';

export default [
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['src/**/*.ts'],
    rules: {
      // Allow rest args to be any for AI SDK compatibility
      '@typescript-eslint/no-explicit-any': [
        'error',
        { ignoreRestArgs: true },
      ],
      // Allow returning promises without awaiting in async generators
      '@typescript-eslint/require-await': 'off',
      // Allow non-null assertions for AI SDK internals
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    files: ['**/*.test.ts'],
    rules: {
      // Relax type checking in tests
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
];
