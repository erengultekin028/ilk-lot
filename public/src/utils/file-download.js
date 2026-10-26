// Tarayıcıdan dosya indirme (metin, CSV, SVG, HTML).

// Metni dosya olarak indirtir. CSV ve metin dosyalarına BOM eklenir: Excel'de Türkçe karakterler bozulmasın.
export async function saveFile(name, text) {
  // JSON ve SVG dosyalarına BOM eklenmez (ayrıştırıcılar bozulmasın)
  const content = /\.(svg|json)$/.test(name) ? text : '﻿' + text;
  const mime = /\.html$/.test(name)
    ? 'text/html'
    : /\.svg$/.test(name)
      ? 'image/svg+xml'
      : /\.json$/.test(name)
        ? 'application/json'
        : /\.txt$/.test(name)
          ? 'text/plain'
          : 'text/csv';
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([content], { type: mime + ';charset=utf-8' }));
  link.download = name;
  document.body.appendChild(link);
  link.click();
  setTimeout(function () {
    URL.revokeObjectURL(link.href);
    link.remove();
  }, 1500);
}
