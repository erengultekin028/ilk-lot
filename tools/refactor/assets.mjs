// kaynak/01_head.html -> public/index.html + public/styles/*.css + public/assets/*
// CSS: sınıf ve id adları yeniden adlandırılır, bölümlere ayrılır, biçimlendirilir.
import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import prettier from 'prettier';
import { CLASSES } from './map-classes.mjs';
import { IDS, ACTIONS } from './map-names.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const html = fs.readFileSync(path.join(ROOT, 'kaynak', '01_head.html'), 'utf8');
const PUB = path.join(ROOT, 'public');
fs.mkdirSync(path.join(PUB, 'styles'), { recursive: true });
fs.mkdirSync(path.join(PUB, 'assets', 'fonts'), { recursive: true });

// ── 1. Yazı tipleri ve simge dosyaları ──
for (const f of ['BricolageGrotesque-Regular.woff', 'BricolageGrotesque-Bold.woff', 'BricolageGrotesque-OFL.txt']) fs.copyFileSync(path.join(ROOT, 'kaynak', 'yazi', f), path.join(PUB, 'assets', 'fonts', f));
fs.copyFileSync(path.join(ROOT, 'kaynak', 'yazi', 'ikon180.png'), path.join(PUB, 'assets', 'icon-180.png'));

// ── 2. CSS ──
let css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
css = css.replace(/url\(data:font\/woff;base64,\{\{YAZI:(\w+)\}\}\)/g, 'url(../assets/fonts/BricolageGrotesque-$1.woff)');
const root = postcss.parse(css);
const renameSel = selectorParser((sels) => {
  sels.walk((n) => {
    if (n.type === 'class' && CLASSES[n.value]) n.value = CLASSES[n.value];
    if (n.type === 'id' && IDS[n.value]) n.value = IDS[n.value];
    if (n.type === 'attribute' && n.attribute === 'data-a' && n.value && ACTIONS[n.value.replace(/["']/g, '')]) n.value = ACTIONS[n.value.replace(/["']/g, '')][0];
  });
});
root.walkRules((r) => { if (r.parent.type === 'atrule' && /keyframes/.test(r.parent.name)) return; r.selector = renameSel.processSync(r.selector); });

// Bölümler: eşleşen yorum, yeni dosyanın başlangıcıdır. İlk kural ('*') temel stillerin başlangıcıdır.
const SECTIONS = [
  { file: 'tokens.css', title: 'Tasarım değişkenleri: yazı tipi, renk paleti (açık ve koyu tema).' },
  { file: 'base.css', title: 'Temel stiller ve uygulama kabuğu: sıfırlama, sayfa, üst çubuk, ana alan, alt gezinme, bildirim.', start: (n) => n.type === 'rule' && n.selector === '*' },
  { file: 'components.css', title: 'Ortak bileşenler: portföy özeti, satırlar, düğmeler, kartlar, notlar, çubuklar, alanlar.', start: (n) => n.type === 'comment' && n.text.includes('Portföy değeri sayfanın tek') },
  { file: 'free-play.css', title: 'Serbest mod bileşenleri.', start: (n) => n.type === 'comment' && n.text.includes('serbest mod') && n.text.includes('b19') },
  { file: 'sheet-and-screens.css', title: 'Alt pencere, karşılama/test ekranları, modal ve kayıt durumu noktası.', start: (n) => n.type === 'comment' && n.text.includes('Alt pencere') },
  { file: 'effects.css', title: 'Görsel efektler: yön ışığı, ekran okuyucu metni, yön rozeti, fiyat parlaması.', start: (n) => n.type === 'comment' && n.text.includes('Yön ışığı') },
  { file: 'film-and-tour.css', title: 'Karar filmi, araştırmacı panosu, karar seçenekleri ve rehberli tur.', start: (n) => n.type === 'comment' && n.text.includes('Kararlarının filmi') },
  { file: 'simulator.css', title: 'Simülatör: anlama kontrolü, sözlük, haber şeridi, sekmeler, hisse listesi, detay, işlem penceresi, ilerleme çubuğu.', start: (n) => n.type === 'comment' && n.text.includes('Anlama kontrolü') },
  { file: 'consent.css', title: 'Katmanlı onam ekranı.', start: (n) => n.type === 'comment' && n.text.includes('Katmanlı onam') },
  { file: 'motion-and-responsive.css', title: 'Hareket, grafikte gezinme, dar ekran ve yazı boyutu kuralları.', start: (n) => n.type === 'comment' && n.text.includes('İnce hareket') },
];
const buckets = SECTIONS.map(() => []);
let cur = 0;
for (const node of root.nodes) {
  for (let i = cur + 1; i < SECTIONS.length; i++) if (SECTIONS[i].start(node)) { cur = i; break; }
  buckets[cur].push(node);
}
const cssFiles = [];
for (let i = 0; i < SECTIONS.length; i++) {
  const r = postcss.root();
  buckets[i].forEach((n) => r.append(n.clone()));
  let out = r.toString();
  out = `/* ${SECTIONS[i].title} */\n` + out;
  out = await prettier.format(out, { parser: 'css', printWidth: 120 });
  fs.writeFileSync(path.join(PUB, 'styles', SECTIONS[i].file), out, 'utf8');
  cssFiles.push(SECTIONS[i].file);
}
// ── 3. HTML iskeleti ──
const headPart = html.slice(0, html.indexOf('<style>'));
const bodyPart = html.slice(html.indexOf('</style>') + 8, html.indexOf('<script>'));
const q = '\\\\?["\']';
const reId = new RegExp(`(\\b(?:id|for|aria-labelledby|aria-controls|aria-describedby)=["'])(${Object.keys(IDS).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\w-])`, 'g');
const reAct = new RegExp(`(data-a=["'])(${Object.keys(ACTIONS).join('|')})(?![\\w-])`, 'g');
const renameClassAttr = (m, a, v) => a + v.replace(/[A-Za-z][\w-]*/g, (t) => CLASSES[t] ?? t);
const skeleton = bodyPart.replace(reId, (_, a, b) => a + IDS[b]).replace(reAct, (_, a, b) => a + ACTIONS[b][0]).replace(/(class=["'])([^"']*)/g, renameClassAttr);
let head = headPart
  .replace(/<link rel="apple-touch-icon"[^>]*>/, '<link rel="apple-touch-icon" href="assets/icon-180.png">')
  .replace(/<link rel="icon"[^>]*>/, '<link rel="icon" type="image/png" href="assets/icon-180.png">')
  .replace(/<!-- Ana ekrana ekle[\s\S]*?-->/, '<!-- Ana ekrana ekle: kısayol eklenir (iOS: tam ekran açılır). Çevrimdışı çalışmaz. -->');
const links = cssFiles.map((f) => `<link rel="stylesheet" href="styles/${f}">`).join('\n');
const doc = `${head}${links}\n</head>${skeleton.replace(/^[\s\S]*?<body>/, '<body>')}\n<noscript>Bu araştırma uygulaması JavaScript gerektirir.</noscript>\n<script type="module" src="src/main.js"></script>\n</body>\n</html>\n`;
fs.writeFileSync(path.join(PUB, 'index.html'), await prettier.format(doc, { parser: 'html', printWidth: 140, htmlWhitespaceSensitivity: 'ignore' }), 'utf8');
console.log('CSS dosyaları:', cssFiles.join(', '));
console.log('index.html yazıldı');
