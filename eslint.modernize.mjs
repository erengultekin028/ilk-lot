// Tek seferlik modernizasyon: var -> let/const, çoklu bildirimleri böl (güvenli otomatik düzeltmeler).
import base from './eslint.config.mjs';
export default [{ ...base[0], rules: { 'no-var': 'error', 'prefer-const': 'error', 'one-var': ['error', 'never'], 'no-extra-semi': 'error' } }];
