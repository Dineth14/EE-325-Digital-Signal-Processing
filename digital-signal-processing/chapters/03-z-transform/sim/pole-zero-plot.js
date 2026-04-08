/* ═══════════════════════════════════════════════════════
   Chapter 3 — SIM 3.1: Pole-Zero Plot
   Interactive pole-zero placement on the z-plane
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var canvas, ctx, w, h;
  var poles = [{re: 0.5, im: 0.3}, {re: 0.5, im: -0.3}];
  var zeros = [{re: -1, im: 0}, {re: 1, im: 0}];
  var dragging = null; // {type:'pole'|'zero', idx:number}
  var cx, cy, R; // center and radius of unit circle

  function init() {
    canvas = document.getElementById('pzCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', function () { resize(); draw(); });
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    bindControls();
    draw();
  }

  function resize() {
    var wrap = canvas.parentElement;
    w = canvas.width = wrap.clientWidth || 600;
    h = canvas.height = 400;
    R = Math.min(w, h) * 0.32;
    cx = w * 0.4;
    cy = h * 0.5;
  }

  function toCanvas(re, im) {
    return { x: cx + re * R, y: cy - im * R };
  }
  function fromCanvas(x, y) {
    return { re: (x - cx) / R, im: -(y - cy) / R };
  }

  function draw() {
    ctx.save();
    PlotUtils.clearCanvas(ctx, w, h);

    // Unit circle
    ctx.strokeStyle = PlotUtils.COLORS.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke();

    // Axes
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(cx - R * 1.4, cy); ctx.lineTo(cx + R * 1.4, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - R * 1.4); ctx.lineTo(cx, cy + R * 1.4); ctx.stroke();

    // Labels
    PlotUtils.drawLabel(ctx, 'Re', cx + R * 1.3, cy - 10, PlotUtils.COLORS.textMuted);
    PlotUtils.drawLabel(ctx, 'Im', cx + 5, cy - R * 1.3, PlotUtils.COLORS.textMuted);

    // Draw zeros (○)
    ctx.strokeStyle = PlotUtils.COLORS.cyan;
    ctx.lineWidth = 2;
    zeros.forEach(function (z) {
      var p = toCanvas(z.re, z.im);
      ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, 2 * Math.PI); ctx.stroke();
    });

    // Draw poles (×)
    ctx.strokeStyle = PlotUtils.COLORS.amber;
    ctx.lineWidth = 2;
    poles.forEach(function (p) {
      var pt = toCanvas(p.re, p.im);
      ctx.beginPath(); ctx.moveTo(pt.x - 6, pt.y - 6); ctx.lineTo(pt.x + 6, pt.y + 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pt.x + 6, pt.y - 6); ctx.lineTo(pt.x - 6, pt.y + 6); ctx.stroke();
    });

    // Draw frequency response on the right
    drawFreqResponse();

    PlotUtils.drawScanlines(ctx, w, h);
    ctx.restore();
    updateInfo();
  }

  function drawFreqResponse() {
    var plotX = w * 0.68, plotW = w * 0.28, plotY = 30, plotH = h * 0.35;
    var plotY2 = h * 0.55, plotH2 = h * 0.35;

    // Compute H(e^jw)
    var N = 200;
    var mag = [], phase = [];
    for (var i = 0; i < N; i++) {
      var omega = (i / (N - 1)) * Math.PI;
      var z_re = Math.cos(omega), z_im = Math.sin(omega);
      // H(z) = product(z-z_i) / product(z-p_i)
      var num_re = 1, num_im = 0;
      zeros.forEach(function (zr) {
        var dr = z_re - zr.re, di = z_im - zr.im;
        var tr = num_re * dr - num_im * di;
        var ti = num_re * di + num_im * dr;
        num_re = tr; num_im = ti;
      });
      var den_re = 1, den_im = 0;
      poles.forEach(function (p) {
        var dr = z_re - p.re, di = z_im - p.im;
        var tr = den_re * dr - den_im * di;
        var ti = den_re * di + den_im * dr;
        den_re = tr; den_im = ti;
      });
      var dMag = Math.sqrt(den_re * den_re + den_im * den_im);
      if (dMag < 1e-10) dMag = 1e-10;
      var h_re = (num_re * den_re + num_im * den_im) / (dMag * dMag);
      var h_im = (num_im * den_re - num_re * den_im) / (dMag * dMag);
      mag.push(Math.sqrt(h_re * h_re + h_im * h_im));
      phase.push(Math.atan2(h_im, h_re));
    }

    // Magnitude plot
    var maxMag = 0;
    mag.forEach(function (m) { if (m > maxMag) maxMag = m; });
    if (maxMag < 0.01) maxMag = 1;

    PlotUtils.drawLabel(ctx, '|H(e^jω)|', plotX, plotY - 5, PlotUtils.COLORS.textMuted);
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(plotX, plotY, plotW, plotH);

    ctx.strokeStyle = PlotUtils.COLORS.cyan;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (var j = 0; j < N; j++) {
      var x = plotX + (j / (N - 1)) * plotW;
      var y = plotY + plotH - (mag[j] / maxMag) * plotH * 0.9;
      if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Phase plot
    PlotUtils.drawLabel(ctx, '∠H(e^jω)', plotX, plotY2 - 5, PlotUtils.COLORS.textMuted);
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(plotX, plotY2, plotW, plotH2);

    ctx.strokeStyle = PlotUtils.COLORS.violet;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (var k = 0; k < N; k++) {
      var px = plotX + (k / (N - 1)) * plotW;
      var py = plotY2 + plotH2 / 2 - (phase[k] / Math.PI) * plotH2 * 0.45;
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  function findNearest(x, y) {
    var best = null, bestDist = 20;
    zeros.forEach(function (z, i) {
      var p = toCanvas(z.re, z.im);
      var d = Math.hypot(p.x - x, p.y - y);
      if (d < bestDist) { bestDist = d; best = { type: 'zero', idx: i }; }
    });
    poles.forEach(function (p, i) {
      var pt = toCanvas(p.re, p.im);
      var d = Math.hypot(pt.x - x, pt.y - y);
      if (d < bestDist) { bestDist = d; best = { type: 'pole', idx: i }; }
    });
    return best;
  }

  function onDown(e) {
    var rect = canvas.getBoundingClientRect();
    dragging = findNearest(e.clientX - rect.left, e.clientY - rect.top);
    if (dragging) canvas.setPointerCapture(e.pointerId);
  }
  function onMove(e) {
    if (!dragging) return;
    var rect = canvas.getBoundingClientRect();
    var c = fromCanvas(e.clientX - rect.left, e.clientY - rect.top);
    var arr = dragging.type === 'pole' ? poles : zeros;
    arr[dragging.idx].re = Math.round(c.re * 100) / 100;
    arr[dragging.idx].im = Math.round(c.im * 100) / 100;
    draw();
  }
  function onUp() { dragging = null; }

  function bindControls() {
    var addPole = document.getElementById('pzAddPole');
    var addZero = document.getElementById('pzAddZero');
    var resetBtn = document.getElementById('pzReset');
    var conjBtn = document.getElementById('pzConjugate');

    if (addPole) addPole.addEventListener('click', function () {
      poles.push({ re: 0.3, im: 0.4 });
      poles.push({ re: 0.3, im: -0.4 });
      draw();
    });
    if (addZero) addZero.addEventListener('click', function () {
      zeros.push({ re: -0.5, im: 0.5 });
      zeros.push({ re: -0.5, im: -0.5 });
      draw();
    });
    if (resetBtn) resetBtn.addEventListener('click', function () {
      poles = [{ re: 0.5, im: 0.3 }, { re: 0.5, im: -0.3 }];
      zeros = [{ re: -1, im: 0 }, { re: 1, im: 0 }];
      draw();
    });
    if (conjBtn) conjBtn.addEventListener('click', function () {
      // Ensure conjugate pairs
      var ensureConj = function (arr) {
        var result = [];
        arr.forEach(function (p) {
          result.push(p);
          if (Math.abs(p.im) > 0.01) {
            var hasConj = arr.some(function (q) {
              return Math.abs(q.re - p.re) < 0.02 && Math.abs(q.im + p.im) < 0.02;
            });
            if (!hasConj) result.push({ re: p.re, im: -p.im });
          }
        });
        return result;
      };
      poles = ensureConj(poles);
      zeros = ensureConj(zeros);
      draw();
    });
  }

  function updateInfo() {
    var el = document.getElementById('pzInfo');
    if (!el) return;
    var stable = poles.every(function (p) {
      return Math.sqrt(p.re * p.re + p.im * p.im) < 1;
    });
    el.innerHTML = 'Poles: ' + poles.length + ' | Zeros: ' + zeros.length +
      '<br>Stable: <span style="color:' + (stable ? PlotUtils.COLORS.green : '#ff4444') + '">' +
      (stable ? 'Yes (all poles inside UC)' : 'No (pole outside UC)') + '</span>';
  }

  document.addEventListener('DOMContentLoaded', init);
})();
