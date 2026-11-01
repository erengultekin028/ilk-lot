// Bölüm kutusu bileşeni.

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
