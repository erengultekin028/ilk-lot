#!/bin/sh
# Üretim hattı: kaynak/ -> public/ (göç araçları). Elle düzenlemelerden SONRA ÇALIŞTIRMA: public/ yeniden yazılır.
set -e
cd "$(dirname "$0")"
node emit.mjs | tail -3
node assets.mjs | tail -2
python postgen.py
cd ../..
FILES=$(grep -rl "DEMO_MODE\|QUICK_TEST_MODE\|FORCED_SESSION\|QUERY_PARAMS\|HASH_PARAMS" public/src --include=*.js | grep -v constants/app-config.js)
(cd tools/refactor && node fold.mjs $(echo $FILES | sed 's#public/#../../public/#g'))
for f in $FILES; do sed -i -E '/^import \{ *\} from /d' $f; done
for i in 1 2 3; do node tools/refactor/node_modules/eslint/bin/eslint.js -c eslint.modernize.mjs --fix public/src >/dev/null 2>&1 || true; done
printf 'public/src/vendor/\n' > .prettierignore
node tools/refactor/node_modules/prettier/bin/prettier.cjs --write "public/src/**/*.js" --single-quote --print-width 110 --trailing-comma es5 >/dev/null
node tools/refactor/node_modules/eslint/bin/eslint.js public/src 2>&1 | tail -3
node tools/refactor/linkcheck.mjs public/src/main.js | tail -2
