module.exports = {
  parser: '@typescript-eslint/parser',
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    jest: true,
  },
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:@typescript-eslint/recommended'],
  parserOptions: {
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
      jsx: true,
    },
    ecmaVersion: 8,
    sourceType: 'module',
  },
  rules: {
    'max-len': ['error', { code: 120, ignoreComments: true, ignoreTemplateLiterals: true }],
    'implicit-arrow-linebreak': 0,
    'object-curly-newline': 'off',
    'operator-linebreak': 'off',
    'no-underscore-dangle': 'off',
    'arrow-body-style': 'off',
    // note you must disable the base rule as it can report incorrect errors
    'no-unused-expressions': 'off',
    indent: 'off',
    '@typescript-eslint/indent': ['error', 2],
    '@typescript-eslint/no-unused-expressions': ['error'],
    '@typescript-eslint/no-use-before-define': ['error'],
    'react/destructuring-assignment': 'never',
    'react/jsx-filename-extension': [1, { 'extensions': ['.js', '.jsx', '.ts', '.tsx'] }],
    'no-use-before-define': 'off',
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ForInStatement',
        message: `for..in loops iterate over the entire prototype chain, which is virtually never what you want. 
          Use Object.{keys,values,entries}, and iterate over the resulting array.`,
      },
      {
        selector: 'LabeledStatement',
        message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      },
      {
        selector: 'WithStatement',
        message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
    ],
    'no-bitwise': 0,
    'no-unreachable': 'warn',
    'no-case-declarations': 'warn',
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': ['error', { ignoreTypeValueShadow: true }],
    'key-spacing': 'warn',
    'jsx-quotes': [2, 'prefer-single'],
    'object-curly-spacing': ['warn', 'always'],
    'comma-dangle': 'off',
    eqeqeq: 'warn',
    'block-scoped-var': 'error',
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
  },
};
