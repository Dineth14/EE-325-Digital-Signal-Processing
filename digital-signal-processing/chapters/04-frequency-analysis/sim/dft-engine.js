/* ═══════════════════════════════════════════════════════
   Chapter 4 — SIM 4.2: DFT Engine
   Compute and visualize N-point DFT with zero-padding
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var canvas, ctx, w, h;
  var sigType = 'rect';
  var N = 16, zeroPad = 0;

  function init() {
    canvas = document.getElementById('dftCanvas');
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
    for (var n = 0; n < N; n++) {
      switch (sigType) {
        case 'rect': x.push(n < N / 2 ? 1 : 0); break;
        case 'cosine': x.push(Math.cos(2 * Math.PI * 3 * n / N)); break;
        case 'two_tone': x.push(Math.cos(2 * Math.PI * 2 * n / N) + 0.5 * Math.cos(2 * Math.PI * 7 * n / N)); break;
        case 'chirp': x.push(Math.cos(2 * Math.PI * (n * n) / (2 * N))); break;
        default: x.push(n < N / 2 ? 1 : 0);
      }
    }
    // Zero-pad
    for (var p = 0; p < zeroPad; p++) x.push(0);
    return x;
  }

  function dft(x) {
    var Nf = x.length;
    var re = new Array(Nf), im = new Array(Nf);
    for (var k = 0; k < Nf; k++) {
      re[k] = 0; im[k] = 0;
      for (var n = 0; n < Nf; n++) {
        var angle = -2 * Math.PI * k * n / Nf;
        re[k] += x[n] * Math.cos(angle);
        im[k] += x[n] * Math.sin(angle);
      }
    }
    return { re: re, im: im };
  }

  function draw() {
    ctx.save();
    PlotUtils.clearCanvas(ctx, w, h);
    var x = getSignal();
    var X = dft(x);
    var Nf = x.length;

    var pad = 55, pw = w - pad - 20;
    var r1Y = 5, r1H = h * 0.22;
    var r2Y = h * 0.3, r2H = h * 0.28;
    var r3Y = h * 0.65, r3H = h * 0.3;

    // Row 1: Time-domain signal
    var maxX = 0;
    x.forEach(function (v) { maxX = Math.max(maxX, Math.abs(v)); });
    if (maxX < 0.01) maxX = 1;

    PlotUtils.drawLabel(ctx, 'x[n]  (N=' + N + ', padded=' + Nf + ')', 5, r1Y + 14, PlotUtils.COLORS.textMuted);
    var baseY = r1Y + r1H * 0.65;
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(pad, baseY); ctx.lineTo(pad + pw, baseY); ctx.stroke();

    ctx.strokeStyle = PlotUtils.COLORS.cyan;
    ctx.fillStyle = PlotUtils.COLORS.cyan;
    ctx.lineWidth = 1.5;
    for (var n = 0; n < Nf; n++) {
      var sx = pad + (n / (Nf - 1)) * pw;
      var sy = baseY - (x[n] / maxX) * r1H * 0.5;
      ctx.beginPath(); ctx.moveTo(sx, baseY); ctx.lineTo(sx, sy); ctx.stroke();
      ctx.beginPath(); ctx.arc(sx, sy, 2, 0, Math.PI * 2); ctx.fill();
    }

    // Row 2: DFT Magnitude
    var mag = [];
    var maxMag = 0;
    for (var k = 0; k < Nf; k++) {
      mag.push(Math.sqrt(X.re[k] * X.re[k] + X.im[k] * X.im[k]));
      if (mag[k] > maxMag) maxMag = mag[k];
    }
    if (maxMag < 0.01) maxMag = 1;

    PlotUtils.drawLabel(ctx, '|X[k]|  DFT Magnitude', 5, r2Y + 14, PlotUtils.COLORS.textMuted);
    var magBase = r2Y + r2H;
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(pad, magBase); ctx.lineTo(pad + pw, magBase); ctx.stroke();

    var barW = Math.max(2, pw / Nf * 0.7);
    for (var k2 = 0; k2 < Nf; k2++) {
      var bx = pad + (k2 / (Nf - 1)) * pw - barW / 2;
      var bh = (mag[k2] / maxMag) * r2H * 0.85;
      ctx.fillStyle = PlotUtils.COLORS.green;
      ctx.fillRect(bx, magBase - bh, barW, bh);
    }

    // k-axis labels
    ctx.fillStyle = PlotUtils.COLORS.textDim;
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText('0', pad, magBase + 12);
    ctx.fillText(Math.floor(Nf / 2).toString(), pad + pw / 2, magBase + 12);
    ctx.fillText((Nf - 1).toString(), pad + pw, magBase + 12);

    // Row 3: DFT Phase
    PlotUtils.drawLabel(ctx, '∠X[k]  DFT Phase', 5, r3Y + 14, PlotUtils.COLORS.textMuted);
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(pad, r3Y, pw, r3H);

    ctx.fillStyle = PlotUtils.COLORS.violet;
    for (var k3 = 0; k3 < Nf; k3++) {
      var ph = Math.atan2(X.im[k3], X.re[k3]);
      var px = pad + (k3 / (Nf - 1)) * pw;
      var py = r3Y + r3H / 2 - (ph / Math.PI) * r3H * 0.45;
      ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
    }

    ctx.fillStyle = PlotUtils.COLORS.textDim;
    ctx.fillText('π', pad - 15, r3Y + 10);
    ctx.fillText('-π', pad - 18, r3Y + r3H - 2);

    PlotUtils.drawScanlines(ctx, w, h);
    ctx.restore();
  }

  function bindControls() {
    var typeEl = document.getElementById('dftType');
    var nEl = document.getElementById('dftN');
    var zpEl = document.getElementById('dftZeroPad');
    if (typeEl) typeEl.addEventListener('change', function () { sigType = this.value; draw(); });
    if (nEl) nEl.addEventListener('input', function () {
      N = parseInt(this.value, 10);
      document.getElementById('dftNVal').textContent = N;
      draw();
    });
    if (zpEl) zpEl.addEventListener('input', function () {
      zeroPad = parseInt(this.value, 10);
      document.getElementById('dftZPVal').textContent = zeroPad;
      draw();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
