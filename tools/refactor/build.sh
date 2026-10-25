#!/bin/sh
# Üretim hattı: kaynak/ -> public/ (göç araçları). Elle düzenlemelerden SONRA ÇALIŞTIRMA: public/ yeniden yazılır.
set -e
cd "$(dirname "$0")"
node emit.mjs | tail -3
node assets.mjs | tail -2
cd ../..
for i in 1 2 3; do node tools/refactor/node_modules/eslint/bin/eslint.js -c eslint.modernize.mjs --fix public/src >/dev/null 2>&1 || true; done
printf 'public/src/vendor/\n' > .prettierignore
node tools/refactor/node_modules/prettier/bin/prettier.cjs --write "public/src/**/*.js" --single-quote --print-width 110 --trailing-comma es5 >/dev/null
node tools/refactor/node_modules/eslint/bin/eslint.js public/src 2>&1 | tail -3
node tools/refactor/linkcheck.mjs public/src/main.js | tail -2
