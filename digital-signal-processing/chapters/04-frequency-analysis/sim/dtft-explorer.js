/* ═══════════════════════════════════════════════════════
   Chapter 4 — SIM 4.1: DTFT Explorer
   Real-time DTFT magnitude/phase with adjustable signal
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var canvas, ctx, w, h;
  var sigType = 'rect';
  var sigLen = 8;
  var omega0 = 0.5;

  function init() {
    canvas = document.getElementById('dtftCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', function () { resize(); draw(); });
    bindControls();
    draw();
  }

  function resize() {
    var wrap = canvas.parentElement;
    w = canvas.width = wrap.clientWidth || 700;
    h = canvas.height = 380;
  }

  function getSignal() {
    var x = [];
    for (var n = 0; n < sigLen; n++) {
      switch (sigType) {
        case 'rect': x.push(1); break;
        case 'triangle': x.push(1 - 2 * Math.abs(n - (sigLen - 1) / 2) / (sigLen - 1)); break;
        case 'sinusoid': x.push(Math.sin(omega0 * n)); break;
        case 'exponential': x.push(Math.pow(0.8, n)); break;
        case 'impulse': x.push(n === 0 ? 1 : 0); break;
        default: x.push(1);
      }
    }
    return x;
  }

  function draw() {
    ctx.save();
    PlotUtils.clearCanvas(ctx, w, h);
    var x = getSignal();
    var Nw = 512;

    // Compute DTFT
    var mag = [], phase = [];
    for (var i = 0; i < Nw; i++) {
      var omega = -Math.PI + (2 * Math.PI * i) / (Nw - 1);
      var re = 0, im = 0;
      for (var n = 0; n < x.length; n++) {
        re += x[n] * Math.cos(omega * n);
        im -= x[n] * Math.sin(omega * n);
      }
      mag.push(Math.sqrt(re * re + im * im));
      phase.push(Math.atan2(im, re));
    }

    var pad = 55, pw = w - pad - 20;
    var topH = h * 0.3, midY = h * 0.38, midH = h * 0.28, botY = h * 0.72, botH = h * 0.24;

    // Row 1: Signal stems
    var maxX = 0;
    x.forEach(function (v) { maxX = Math.max(maxX, Math.abs(v)); });
    if (maxX < 0.01) maxX = 1;
    PlotUtils.drawLabel(ctx, 'x[n]', 5, 15, PlotUtils.COLORS.textMuted);
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(pad, topH * 0.6); ctx.lineTo(pad + pw, topH * 0.6); ctx.stroke();

    ctx.strokeStyle = PlotUtils.COLORS.cyan;
    ctx.fillStyle = PlotUtils.COLORS.cyan;
    ctx.lineWidth = 2;
    for (var s = 0; s < x.length; s++) {
      var sx = pad + (s / Math.max(sigLen - 1, 1)) * pw * 0.8;
      var sy = topH * 0.6 - (x[s] / maxX) * topH * 0.4;
      ctx.beginPath(); ctx.moveTo(sx, topH * 0.6); ctx.lineTo(sx, sy); ctx.stroke();
      ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2); ctx.fill();
    }

    // Row 2: Magnitude
    var maxMag = 0;
    mag.forEach(function (m) { maxMag = Math.max(maxMag, m); });
    if (maxMag < 0.01) maxMag = 1;
    PlotUtils.drawLabel(ctx, '|X(e^jω)|', 5, midY + 10, PlotUtils.COLORS.textMuted);
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(pad, midY, pw, midH);

    ctx.strokeStyle = PlotUtils.COLORS.cyan;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (var j = 0; j < Nw; j++) {
      var mx = pad + (j / (Nw - 1)) * pw;
      var my = midY + midH - (mag[j] / maxMag) * midH * 0.9;
      if (j === 0) ctx.moveTo(mx, my); else ctx.lineTo(mx, my);
    }
    ctx.stroke();

    // ω-axis labels
    ctx.fillStyle = PlotUtils.COLORS.textDim;
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText('-π', pad, midY + midH + 12);
    ctx.fillText('0', pad + pw / 2, midY + midH + 12);
    ctx.fillText('π', pad + pw, midY + midH + 12);

    // Row 3: Phase
    PlotUtils.drawLabel(ctx, '∠X(e^jω)', 5, botY + 10, PlotUtils.COLORS.textMuted);
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(pad, botY, pw, botH);

    ctx.strokeStyle = PlotUtils.COLORS.violet;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (var k = 0; k < Nw; k++) {
      var px = pad + (k / (Nw - 1)) * pw;
      var py = botY + botH / 2 - (phase[k] / Math.PI) * botH * 0.45;
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    ctx.fillStyle = PlotUtils.COLORS.textDim;
    ctx.fillText('-π', pad, botY + botH + 12);
    ctx.fillText('0', pad + pw / 2, botY + botH + 12);
    ctx.fillText('π', pad + pw, botY + botH + 12);

    PlotUtils.drawScanlines(ctx, w, h);
    ctx.restore();
  }

  function bindControls() {
    var typeEl = document.getElementById('dtftType');
    var lenEl = document.getElementById('dtftLen');
    var freqEl = document.getElementById('dtftFreq');
    if (typeEl) typeEl.addEventListener('change', function () { sigType = this.value; draw(); });
    if (lenEl) lenEl.addEventListener('input', function () {
      sigLen = parseInt(this.value, 10);
      document.getElementById('dtftLenVal').textContent = sigLen;
      draw();
    });
    if (freqEl) freqEl.addEventListener('input', function () {
      omega0 = parseFloat(this.value);
      document.getElementById('dtftFreqVal').textContent = omega0.toFixed(2);
      draw();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
