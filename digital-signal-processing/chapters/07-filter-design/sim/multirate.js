/* ═══════════════════════════════════════════════════════
   Chapter 7 — SIM 7.2: Multirate Processing
   Decimation & interpolation visualizer
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var canvas, ctx, w, h;
  var factor = 3; // decimation/interpolation factor
  var mode = 'decimate'; // 'decimate' or 'interpolate'
  var sigFreq = 0.1; // normalized frequency of input

  function init() {
    canvas = document.getElementById('multirateCanvas');
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
    h = canvas.height = 400;
  }

  function generateSignal(N, freq) {
    var x = new Float64Array(N);
    for (var n = 0; n < N; n++) {
      x[n] = Math.cos(2 * Math.PI * freq * n) + 0.5 * Math.cos(2 * Math.PI * freq * 2.3 * n);
    }
    return x;
  }

  function decimate(x, M) {
    var N = Math.floor(x.length / M);
    var y = new Float64Array(N);
    for (var n = 0; n < N; n++) y[n] = x[n * M];
    return y;
  }

  function interpolate(x, L) {
    var N = x.length * L;
    var y = new Float64Array(N);
    for (var n = 0; n < x.length; n++) y[n * L] = x[n];
    return y;
  }

  function computeSpectrum(x, nfft) {
    nfft = nfft || 256;
    var mag = new Float64Array(nfft / 2);
    for (var k = 0; k < nfft / 2; k++) {
      var re = 0, im = 0;
      for (var n = 0; n < x.length; n++) {
        var w_n = 0.5 - 0.5 * Math.cos(2 * Math.PI * n / (x.length - 1)); // Hanning
        var angle = -2 * Math.PI * k * n / nfft;
        re += x[n] * w_n * Math.cos(angle);
        im += x[n] * w_n * Math.sin(angle);
      }
      mag[k] = 20 * Math.log10(Math.max(Math.sqrt(re * re + im * im), 1e-12));
    }
    return mag;
  }

  function draw() {
    ctx.save();
    PlotUtils.clearCanvas(ctx, w, h);
    var pad = { l: 45, r: 15, t: 15, b: 15 };
    var rowH = (h - pad.t - pad.b - 30) / 3;

    var N = 64;
    var x = generateSignal(N, sigFreq);
    var y;
    if (mode === 'decimate') {
      y = decimate(x, factor);
    } else {
      y = interpolate(x, factor);
    }

    // Row 1: Input signal stems
    drawSignalRow(x, pad.l, pad.t, w - pad.l - pad.r, rowH, 'Input x[n]', PlotUtils.COLORS.cyan);

    // Row 2: Output signal stems
    var row2Y = pad.t + rowH + 15;
    var label2 = mode === 'decimate' ? 'Decimated y[n] (↓' + factor + ')' : 'Interpolated y[n] (↑' + factor + ')';
    drawSignalRow(y, pad.l, row2Y, w - pad.l - pad.r, rowH, label2, PlotUtils.COLORS.green);

    // Row 3: Spectra comparison
    var row3Y = row2Y + rowH + 15;
    drawSpectraRow(x, y, pad.l, row3Y, w - pad.l - pad.r, rowH);

    PlotUtils.drawScanlines(ctx, w, h);
    ctx.restore();
  }

  function drawSignalRow(sig, ox, oy, pw, ph, title, color) {
    PlotUtils.drawLabel(ctx, title, ox, oy + 12, PlotUtils.COLORS.textMuted);

    var plotOy = oy + 20;
    var plotH = ph - 25;
    var mid = plotOy + plotH * 0.5;

    // Zero line
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(ox, mid); ctx.lineTo(ox + pw, mid); ctx.stroke();

    // Stems
    var maxV = 0;
    for (var i = 0; i < sig.length; i++) { var av = Math.abs(sig[i]); if (av > maxV) maxV = av; }
    if (maxV < 1e-10) maxV = 1;

    var stemW = pw / Math.max(sig.length, 1);
    for (var n = 0; n < sig.length; n++) {
      var sx = ox + (n + 0.5) * stemW;
      var sh = (sig[n] / maxV) * plotH * 0.4;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx, mid); ctx.lineTo(sx, mid - sh); ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(sx, mid - sh, 2, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawSpectraRow(x, y, ox, oy, pw, ph) {
    PlotUtils.drawLabel(ctx, 'Spectra: input (cyan) vs output (green)', ox, oy + 12, PlotUtils.COLORS.textMuted);

    var plotOy = oy + 20;
    var plotH = ph - 25;
    var nfft = 256;

    var specX = computeSpectrum(x, nfft);
    var specY = computeSpectrum(y, nfft);

    var dbMin = -60, dbMax = 40;

    // Grid
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.3;
    for (var db = dbMin; db <= dbMax; db += 20) {
      var gy = plotOy + plotH - (db - dbMin) / (dbMax - dbMin) * plotH;
      ctx.beginPath(); ctx.moveTo(ox, gy); ctx.lineTo(ox + pw, gy); ctx.stroke();
    }

    // Input spectrum
    ctx.strokeStyle = PlotUtils.COLORS.cyan;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    for (var k = 0; k < specX.length; k++) {
      var xp = ox + k / (specX.length - 1) * pw;
      var db = Math.max(dbMin, Math.min(dbMax, specX[k]));
      var yp = plotOy + plotH - (db - dbMin) / (dbMax - dbMin) * plotH;
      if (k === 0) ctx.moveTo(xp, yp); else ctx.lineTo(xp, yp);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Output spectrum
    ctx.strokeStyle = PlotUtils.COLORS.green;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (var k = 0; k < specY.length; k++) {
      var xp2 = ox + k / (specY.length - 1) * pw;
      var db2 = Math.max(dbMin, Math.min(dbMax, specY[k]));
      var yp2 = plotOy + plotH - (db2 - dbMin) / (dbMax - dbMin) * plotH;
      if (k === 0) ctx.moveTo(xp2, yp2); else ctx.lineTo(xp2, yp2);
    }
    ctx.stroke();
  }

  function bindControls() {
    var factEl = document.getElementById('mrFactor');
    if (factEl) factEl.addEventListener('input', function () {
      factor = parseInt(this.value);
      document.getElementById('mrFactorVal').textContent = factor;
      draw();
    });
    var modeEl = document.getElementById('mrMode');
    if (modeEl) modeEl.addEventListener('change', function () {
      mode = this.value;
      draw();
    });
    var freqEl = document.getElementById('mrFreq');
    if (freqEl) freqEl.addEventListener('input', function () {
      sigFreq = parseFloat(this.value);
      document.getElementById('mrFreqVal').textContent = sigFreq.toFixed(2);
      draw();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
