// Statik denetim: tanımsız ad, sabit atama, içe aktarma ataması, tekrarlanan anahtar, kullanılmayan değişken.
// Çalıştırma: npm run lint
import globals from 'globals';

export default [
  {
    files: ['public/src/**/*.js'],
    ignores: ['public/src/vendor/**'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      // firebase: Firebase SDK betikleriyle (gstatic) yüklenen genel nesne
      globals: { ...globals.browser, firebase: 'readonly' },
    },
    rules: {
      'no-undef': 'error',
      'no-const-assign': 'error',
      'no-import-assign': 'error',
      'no-dupe-keys': 'error',
      'no-redeclare': 'error',
      'no-unreachable': 'error',
      'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }],
    },
  },
];
