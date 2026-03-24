module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    // ─── Hooks ───────────────────────────────────────────────────────────────
    // Enforces complete dependency arrays. Catches stale closures at lint time.
    // Previously disabled to unblock refactors — all known violations resolved.
    'react-hooks/exhaustive-deps': 'error',

    // ─── TypeScript ──────────────────────────────────────────────────────────
    // Dead code surfaces real bugs (unused state, orphaned handlers, etc.).
    '@typescript-eslint/no-unused-vars': [
      'error',
      { vars: 'all', args: 'after-used', ignoreRestSiblings: true, argsIgnorePattern: '^_' },
    ],

    // `any` bypasses the type system — prefer `unknown` + type narrowing.
    // 'warn' not 'error' so legacy code doesn't block PRs; address incrementally.
    '@typescript-eslint/no-explicit-any': 'warn',
  },
  overrides: [
    {
      // jest.setup.js and all test/spec files need the jest global.
      files: ['jest.setup.js', '**/__tests__/**/*.{ts,tsx,js}', '**/*.{test,spec}.{ts,tsx,js}'],
      env: { jest: true },
    },
  ],
};
