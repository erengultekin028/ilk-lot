// Bölüm kutusu ve ilerleme çubuğu bileşenleri.

// ═════════════════ GÖRÜNÜMLER ═════════════════
export function section(title, body, right) {
  return (
    '<div class="card-section"><div class="card-header"><h3>' +
    title +
    '</h3>' +
    (right || '') +
    '</div><div class="card-body">' +
    body +
    '</div></div>'
  );
}

function progressBar(percent, color) {
  return (
    '<div class="barrow"><i style="width:' +
    Math.max(0, Math.min(100, percent)) +
    '%' +
    (color ? ';background:' + color : '') +
    '"></i></div>'
  );
}
