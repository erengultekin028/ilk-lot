// Göç sonrası statik denetim: tanımsız ad, sabit atama, içe aktarma ataması vb.
import globals from './tools/refactor/node_modules/globals/index.js';
export default [{
  files: ['public/src/**/*.js'],
  ignores: ['public/src/vendor/**'],
  languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.browser, firebase: 'readonly', claude: 'readonly' } },
  rules: {
    'no-undef': 'error', 'no-const-assign': 'error', 'no-import-assign': 'error', 'no-dupe-keys': 'error',
    'no-redeclare': 'error', 'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }], 'no-use-before-define': 'off',
  },
}];
