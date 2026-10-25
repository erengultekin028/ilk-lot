// Küçük DOM yardımcıları.

// ═════════════════ YARDIMCILAR ═════════════════
export function byId(id) {
  return document.getElementById(id);
}

export function setText(id, text) {
  var element = byId(id);
  if (element && element.textContent !== text) element.textContent = text;
}
