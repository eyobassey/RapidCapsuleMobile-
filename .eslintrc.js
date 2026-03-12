module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    // Temporarily relax strict rules that block large refactors.
    '@typescript-eslint/no-unused-vars': 'off',
    'react-hooks/exhaustive-deps': 'off',
  },
};
