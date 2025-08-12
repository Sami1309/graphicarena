/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', '@typescript-eslint', 'react-hooks'],
  settings: { react: { version: 'detect' } },
  rules: {
    'semi': ['error', 'never'],
    'quotes': ['error', 'single'],
    'react/react-in-jsx-scope': 'off',
    'react-refresh/only-export-components': 'warn'
  }
}

