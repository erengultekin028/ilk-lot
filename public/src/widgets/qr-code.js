// QR kodu SVG üretimi.

import { QRLib } from '../vendor/qr-lib.js';

// Metni QR olarak SVG'ye çevirir. Ağ bağlantısı gerektirmez; claude.ai içinde de, kendi sunucunda da çalışır
export function renderQrSvg(innerText, pixels) {
  var quantity = new QRLib.QRCode(-1, QRLib.ECL.M);
  quantity.addData(innerText);
  quantity.make();
  var count = quantity.getModuleCount(),
    simulation = 4,
    text2 = count + simulation * 2,
    text = '';
  for (var result = 0; result < count; result++)
    for (var value = 0; value < count; value++)
      if (quantity.isDark(result, value))
        text += 'M' + (value + simulation) + ' ' + (result + simulation) + 'h1v1h-1z';
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
    text2 +
    ' ' +
    text2 +
    '" width="' +
    (pixels || 160) +
    '" height="' +
    (pixels || 160) +
    '" shape-rendering="crispEdges"><rect width="' +
    text2 +
    '" height="' +
    text2 +
    '" fill="#fff"/><path d="' +
    text +
    '" fill="#000"/></svg>'
  );
}
