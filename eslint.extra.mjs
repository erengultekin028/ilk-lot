import base from './eslint.config.mjs';
export default [{ ...base[0], rules: { 'no-unreachable': 'error', 'no-constant-condition': 'error', 'no-useless-return': 'error', 'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }] } }];
