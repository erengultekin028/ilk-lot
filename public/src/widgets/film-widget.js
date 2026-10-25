// Bilgilendirme ekranındaki karar filmi.

import { state } from '../viewmodels/app-state.js';
import { byId } from '../utils/dom.js';
import { escapeHtml } from '../utils/format.js';
import { TRIAL_SETS } from '../models/trial-generator.js';

// ───────────────── Kararlarının filmi ─────────────────
// Sonda: ön ve son görevdeki kararlar yan yana. Ortada simülatör ayracı; sert düşüş anları gölgeli
const FILM_WIDTH = 340;

const FILM_HEIGHT = 170;

const FILM_PADDING = { l: 10, r: 10, t: 22, b: 20 };

let filmAnimationFrame = null;

let filmData = null;

const FILM_COLORS = { sat: '#C2412D', tut: '#8C93A3', al: '#1E8A5E' };

function buildFilmData() {
  var decisions = state.decisions,
    innerLength = decisions.length,
    gap = 1.2,
    length = TRIAL_SETS.X.length,
    xValue = function (i) {
      var unit = i + (i >= length ? gap : 0),
        total = innerLength + (innerLength > length ? gap : 0);
      return (
        FILM_PADDING.l + ((FILM_WIDTH - FILM_PADDING.l - FILM_PADDING.r) * (unit + 0.5)) / Math.max(1, total)
      );
    };
  return {
    n: innerLength,
    X: xValue,
    y: function (data) {
      return data.final === 'sat'
        ? FILM_PADDING.t + 18
        : data.final === 'tut'
          ? FILM_PADDING.t + 62
          : FILM_PADDING.t + 106;
    },
  };
}

export function filmHtml() {
  if (!state.decisions.length) return '';
  var film = buildFilmData(),
    bw = (FILM_WIDTH - FILM_PADDING.l - FILM_PADDING.r) / (film.n + 1.2);
  var html =
    '<div class="ficard-labelm"><div class="film-title"><b>Kararlarının filmi</b><button class="card-labelirow-subtitlecard-value" style="padding:0;color:var(--act)" data-a="playFilm">Tekrar oynat</button></div><svg viewBox="0 0 ' +
    FILM_WIDTH +
    ' ' +
    FILM_HEIGHT +
    '" width="100%" role="img" aria-label="Ön ve son görevdeki kararların"><defs><clipPath id="film-clip"><rect id="film-clip-rect" x="0" y="0" width="0" height="' +
    FILM_HEIGHT +
    '"/></clipPath></defs>';
  ['Sat', 'Tut', 'Daha al'].forEach(function (item, index) {
    var y = FILM_PADDING.t + 18 + index * 44;
    html +=
      '<line x1="' +
      FILM_PADDING.l +
      '" x2="' +
      (FILM_WIDTH - FILM_PADDING.r) +
      '" y1="' +
      y +
      '" y2="' +
      y +
      '" stroke="currentColor" stroke-opacity=".08"/>';
  });
  state.decisions.forEach(function (item, index) {
    if (item.kind === 'kriz' && item.pos === 'zarar')
      html +=
        '<rect x="' +
        (film.X(index) - bw / 2 + 1).toFixed(1) +
        '" y="' +
        (FILM_PADDING.t - 4) +
        '" width="' +
        (bw - 2).toFixed(1) +
        '" height="' +
        (FILM_HEIGHT - FILM_PADDING.t - FILM_PADDING.b + 8) +
        '" fill="#C2412D" opacity=".09" rx="3"/>';
  });
  var length = TRIAL_SETS.X.length;
  if (film.n > length) {
    var gridX = (film.X(length - 1) + film.X(length)) / 2;
    html +=
      '<line x1="' +
      gridX +
      '" x2="' +
      gridX +
      '" y1="' +
      (FILM_PADDING.t - 6) +
      '" y2="' +
      (FILM_HEIGHT - FILM_PADDING.b + 4) +
      '" stroke="var(--ac)" stroke-dasharray="3 3" stroke-opacity=".6"/><text x="' +
      gridX +
      '" y="12" font-size="9" text-anchor="middle" fill="var(--act)" font-weight="700">simülatör</text>';
  }
  html +=
    '<text x="' +
    FILM_PADDING.l +
    '" y="12" font-size="9" fill="currentColor" fill-opacity=".55">1. bölüm</text><text x="' +
    (FILM_WIDTH - FILM_PADDING.r) +
    '" y="12" font-size="9" text-anchor="end" fill="currentColor" fill-opacity=".55">3. bölüm</text>';
  state.decisions.forEach(function (item, index) {
    var centerX = film.X(index),
      centerY = film.y(item);
    html +=
      '<g class="film-marker is-off" data-t="' +
      (index + 1) +
      '"><circle cx="' +
      centerX.toFixed(1) +
      '" cy="' +
      centerY +
      '" r="8" fill="' +
      FILM_COLORS[item.final] +
      '" opacity=".18"/><circle cx="' +
      centerX.toFixed(1) +
      '" cy="' +
      centerY +
      '" r="4.6" fill="' +
      FILM_COLORS[item.final] +
      '" stroke="var(--sf)" stroke-width="1.5"/></g>';
  });
  html +=
    '<line id="film-playhead" x1="0" x2="0" y1="' +
    (FILM_PADDING.t - 6) +
    '" y2="' +
    (FILM_HEIGHT - FILM_PADDING.b + 4) +
    '" stroke="var(--fl)" stroke-opacity=".5"/>';
  ['Sat', 'Tut', 'Daha al'].forEach(function (item, index) {
    html +=
      '<text x="' +
      (FILM_WIDTH - FILM_PADDING.r) +
      '" y="' +
      (FILM_PADDING.t + 14 + index * 44) +
      '" font-size="8.5" text-anchor="end" fill="currentColor" fill-opacity=".45">' +
      item +
      '</text>';
  });
  return (
    html +
    '</svg><div class="film-caption" id="film-caption" aria-live="polite"></div><div class="film-legend"><span><i style="width:10px;height:8px;background:rgba(194,65,45,.25);display:inline-block;border-radius:2px"></i>Sert düşüş ve zarar anı</span></div></div>'
  );
}

function drawFilmFrame(progress) {
  var filmClipRectElement = byId('film-clip-rect');
  if (!filmClipRectElement) return false;
  progress = Math.max(0, Math.min(1, progress));
  var data = filmData,
    key = Math.max(0, Math.min(data.n, Math.floor(progress * data.n + 1e-9))),
    x = key >= data.n ? FILM_WIDTH : data.X(Math.max(0, key - 1)) + 6;
  var filmPlayheadElement = byId('film-playhead');
  filmPlayheadElement.setAttribute('x1', x);
  filmPlayheadElement.setAttribute('x2', x);
  document.querySelectorAll('.film .film-marker').forEach(function (item) {
    item.classList.toggle('is-off', +item.dataset.t > key);
  });
  var text, color;
  if (key >= data.n) {
    var classNames = function (other) {
      var decisions = state.decisions.filter(function (item) {
        return item.block === other && item.kind === 'kriz' && item.pos === 'zarar';
      });
      return (
        decisions.filter(function (item) {
          return item.final === 'sat';
        }).length +
        '/' +
        decisions.length
      );
    };
    text = 'Sert düşüş + zararda satış: 1. bölüm ' + classNames('pre') + ', 3. bölüm ' + classNames('post');
    color = 'var(--fl)';
  } else if (key === 0) {
    text = '1. bölüm başlıyor';
    color = 'var(--mu)';
  } else {
    var x2 = state.decisions[key - 1];
    text =
      (x2.block === 'pre' ? '1. bölüm' : '3. bölüm') +
      ' · ' +
      x2.sym +
      ': ' +
      { sat: 'sattın', tut: 'tuttun', al: 'daha aldın' }[x2.final] +
      (x2.kind === 'kriz' ? ' (sert düşüş, ' : ' (') +
      (x2.pos === 'kar' ? 'kârdaydın)' : 'zarardaydın)');
    color = FILM_COLORS[x2.final];
  }
  var filmCaptionElement = byId('film-caption'),
    html = '<i style="background:' + color + '"></i><span>' + escapeHtml(text) + '</span>';
  if (filmCaptionElement._h !== html) {
    filmCaptionElement.innerHTML = html;
    filmCaptionElement._h = html;
  }
  return true;
}

export function startFilm() {
  if (!byId('film-clip-rect')) return;
  filmData = buildFilmData();
  cancelAnimationFrame(filmAnimationFrame);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    state.filmProgress = 1;
    drawFilmFrame(1);
    return;
  }
  if (state.filmProgress == null) state.filmProgress = 0;
  var duration = 7000,
    startTime = performance.now() - state.filmProgress * duration;
  (function loop(now) {
    var price = Math.max(0, Math.min(1, (now - startTime) / duration));
    state.filmProgress = price;
    if (!drawFilmFrame(price)) return;
    if (price < 1) filmAnimationFrame = requestAnimationFrame(loop);
  })(performance.now());
}
