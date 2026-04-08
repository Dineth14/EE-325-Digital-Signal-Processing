/* ═══════════════════════════════════════════════════════
   Chapter 5 — SIM 5.1: FIR Designer
   Interactive FIR filter design via windowed sinc
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var canvas, ctx, w, h;
  var filterType = 'lowpass';
  var cutoff = 0.3; // normalized to π
  var order = 21;
  var windowType = 'hamming';

  function init() {
    canvas = document.getElementById('firCanvas');
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

  function getWindow(N) {
    switch (windowType) {
      case 'rectangular': return DSP.windowRect(N);
      case 'hanning': return DSP.windowHanning(N);
      case 'hamming': return DSP.windowHamming(N);
      case 'blackman': return DSP.windowBlackman(N);
      case 'kaiser': return DSP.windowKaiser(N, 5);
      default: return DSP.windowHamming(N);
    }
  }

  function designFilter() {
    var M = order;
    var wc = cutoff * Math.PI;
    var coeffs;

    if (filterType === 'lowpass') {
      coeffs = DSP.firLowpass(M, wc / Math.PI);
    } else if (filterType === 'highpass') {
      coeffs = DSP.firHighpass(M, wc / Math.PI);
    } else {
      // bandpass
      coeffs = DSP.firBandpass(M, 0.2, 0.5);
    }

    // Apply window
    var win = getWindow(M);
    for (var i = 0; i < M; i++) coeffs[i] *= win[i];
    return coeffs;
  }

  function draw() {
    ctx.save();
    PlotUtils.clearCanvas(ctx, w, h);

    var coeffs = designFilter();
    var pad = 55, pw = w - pad - 20;
    var r1H = h * 0.25, r2H = h * 0.3, r3H = h * 0.25;
    var r1Y = 5, r2Y = h * 0.32, r3Y = h * 0.68;

    // Row 1: Impulse response (coefficients)
    var maxC = 0;
    coeffs.forEach(function (c) { maxC = Math.max(maxC, Math.abs(c)); });
    if (maxC < 1e-10) maxC = 1;

    PlotUtils.drawLabel(ctx, 'h[n] — Impulse Response (order=' + order + ')', 5, r1Y + 15, PlotUtils.COLORS.textMuted);
    var baseY = r1Y + r1H * 0.65;
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(pad, baseY); ctx.lineTo(pad + pw, baseY); ctx.stroke();

    ctx.strokeStyle = PlotUtils.COLORS.cyan;
    ctx.fillStyle = PlotUtils.COLORS.cyan;
    ctx.lineWidth = 1.5;
    for (var n = 0; n < coeffs.length; n++) {
      var x = pad + (n / (coeffs.length - 1)) * pw;
      var y = baseY - (coeffs[n] / maxC) * r1H * 0.5;
      ctx.beginPath(); ctx.moveTo(x, baseY); ctx.lineTo(x, y); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
    }

    // Row 2: Magnitude response
    var Nw = 512, mag = [], magDb = [];
    for (var i = 0; i < Nw; i++) {
      var omega = (i / (Nw - 1)) * Math.PI;
      var re = 0, im = 0;
      for (var k = 0; k < coeffs.length; k++) {
        re += coeffs[k] * Math.cos(omega * k);
        im -= coeffs[k] * Math.sin(omega * k);
      }
      var m = Math.sqrt(re * re + im * im);
      mag.push(m);
      magDb.push(20 * Math.log10(Math.max(m, 1e-10)));
    }

    PlotUtils.drawLabel(ctx, '|H(e^jω)| dB', 5, r2Y + 12, PlotUtils.COLORS.textMuted);
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(pad, r2Y, pw, r2H);

    // dB range: 0 to -80
    ctx.strokeStyle = PlotUtils.COLORS.green;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (var j = 0; j < Nw; j++) {
      var mx = pad + (j / (Nw - 1)) * pw;
      var db = Math.max(magDb[j], -80);
      var my = r2Y + (-db / 80) * r2H;
      if (j === 0) ctx.moveTo(mx, my); else ctx.lineTo(mx, my);
    }
    ctx.stroke();

    // Cutoff indicator
    var cutX = pad + cutoff * pw;
    ctx.strokeStyle = PlotUtils.COLORS.amber;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(cutX, r2Y); ctx.lineTo(cutX, r2Y + r2H); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = PlotUtils.COLORS.amber;
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText('ωc', cutX, r2Y + r2H + 12);

    // Axis labels
    ctx.fillStyle = PlotUtils.COLORS.textDim;
    ctx.fillText('0', pad, r2Y + r2H + 12);
    ctx.fillText('π', pad + pw, r2Y + r2H + 12);
    ctx.textAlign = 'right';
    ctx.fillText('0 dB', pad - 5, r2Y + 10);
    ctx.fillText('-80', pad - 5, r2Y + r2H);

    // Row 3: Window shape
    var win = getWindow(order);
    PlotUtils.drawLabel(ctx, 'w[n] — ' + windowType + ' Window', 5, r3Y + 12, PlotUtils.COLORS.textMuted);
    var wBase = r3Y + r3H * 0.85;
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(pad, wBase); ctx.lineTo(pad + pw, wBase); ctx.stroke();

    ctx.strokeStyle = PlotUtils.COLORS.violet;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (var wi = 0; wi < win.length; wi++) {
      var wx = pad + (wi / (win.length - 1)) * pw;
      var wy = wBase - win[wi] * r3H * 0.75;
      if (wi === 0) ctx.moveTo(wx, wy); else ctx.lineTo(wx, wy);
    }
    ctx.stroke();

    PlotUtils.drawScanlines(ctx, w, h);
    ctx.restore();
  }

  function bindControls() {
    var typeEl = document.getElementById('firType');
    var cutEl = document.getElementById('firCutoff');
    var ordEl = document.getElementById('firOrder');
    var winEl = document.getElementById('firWindow');

    if (typeEl) typeEl.addEventListener('change', function () { filterType = this.value; draw(); });
    if (cutEl) cutEl.addEventListener('input', function () {
      cutoff = parseFloat(this.value);
      document.getElementById('firCutoffVal').textContent = cutoff.toFixed(2) + 'π';
      draw();
    });
    if (ordEl) ordEl.addEventListener('input', function () {
      order = parseInt(this.value, 10) | 1; // ensure odd
      document.getElementById('firOrderVal').textContent = order;
      draw();
    });
    if (winEl) winEl.addEventListener('change', function () { windowType = this.value; draw(); });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
