/* ═══════════════════════════════════════════════════════
   Chapter 5 — SIM 5.2: Windowing Lab
   Compare window functions and their spectral properties
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var canvas, ctx, w, h;
  var N = 32;
  var activeWindows = { rectangular: true, hanning: true, hamming: false, blackman: false, kaiser: false };
  var colors = {
    rectangular: '#00e5ff',
    hanning: '#69ff47',
    hamming: '#ffca28',
    blackman: '#b388ff',
    kaiser: '#ff6b6b'
  };

  function init() {
    canvas = document.getElementById('windowCanvas');
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

  function getWindow(type, len) {
    switch (type) {
      case 'rectangular': return DSP.windowRect(len);
      case 'hanning': return DSP.windowHanning(len);
      case 'hamming': return DSP.windowHamming(len);
      case 'blackman': return DSP.windowBlackman(len);
      case 'kaiser': return DSP.windowKaiser(len, 5);
      default: return DSP.windowRect(len);
    }
  }

  function computeSpectrum(win) {
    var padN = 512;
    var padded = new Array(padN);
    for (var i = 0; i < padN; i++) padded[i] = i < win.length ? win[i] : 0;
    var re = new Array(padN), im = new Array(padN);
    for (var k = 0; k < padN; k++) {
      re[k] = 0; im[k] = 0;
      for (var n = 0; n < padN; n++) {
        var angle = -2 * Math.PI * k * n / padN;
        re[k] += padded[n] * Math.cos(angle);
        im[k] += padded[n] * Math.sin(angle);
      }
    }
    var mag = new Array(padN);
    for (var j = 0; j < padN; j++) {
      mag[j] = Math.sqrt(re[j] * re[j] + im[j] * im[j]);
    }
    return mag;
  }

  function draw() {
    ctx.save();
    PlotUtils.clearCanvas(ctx, w, h);

    var pad = 55, pw = w - pad - 20;
    var topH = h * 0.35, botY = h * 0.45, botH = h * 0.48;

    // Top panel: Time-domain window shapes
    PlotUtils.drawLabel(ctx, 'w[n] — Window Functions (N=' + N + ')', 5, 16, PlotUtils.COLORS.textMuted);
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    var wBase = topH * 0.9;
    ctx.beginPath(); ctx.moveTo(pad, wBase); ctx.lineTo(pad + pw, wBase); ctx.stroke();

    Object.keys(activeWindows).forEach(function (type) {
      if (!activeWindows[type]) return;
      var win = getWindow(type, N);
      ctx.strokeStyle = colors[type];
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (var n = 0; n < N; n++) {
        var x = pad + (n / (N - 1)) * pw;
        var y = wBase - win[n] * topH * 0.75;
        if (n === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });

    // Legend
    var lx = pad + 10;
    ctx.font = '10px Inter';
    Object.keys(activeWindows).forEach(function (type) {
      if (!activeWindows[type]) return;
      ctx.fillStyle = colors[type];
      ctx.fillRect(lx, 28, 12, 8);
      ctx.fillStyle = PlotUtils.COLORS.textMuted;
      ctx.textAlign = 'left';
      ctx.fillText(type, lx + 16, 36);
      lx += ctx.measureText(type).width + 30;
    });

    // Bottom panel: Frequency response in dB
    PlotUtils.drawLabel(ctx, '|W(e^jω)| dB', 5, botY + 12, PlotUtils.COLORS.textMuted);
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(pad, botY, pw, botH);

    // dB guidelines
    ctx.setLineDash([2, 4]);
    [-20, -40, -60].forEach(function (db) {
      var y = botY + (-db / 80) * botH;
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(pad + pw, y); ctx.stroke();
      ctx.fillStyle = PlotUtils.COLORS.textDim;
      ctx.textAlign = 'right';
      ctx.fillText(db + ' dB', pad - 5, y + 4);
    });
    ctx.setLineDash([]);

    Object.keys(activeWindows).forEach(function (type) {
      if (!activeWindows[type]) return;
      var win = getWindow(type, N);
      var spec = computeSpectrum(win);
      var maxSpec = spec[0] || 1;

      ctx.strokeStyle = colors[type];
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      var halfN = spec.length / 2;
      for (var k = 0; k < halfN; k++) {
        var x = pad + (k / halfN) * pw;
        var db = 20 * Math.log10(Math.max(spec[k] / maxSpec, 1e-6));
        db = Math.max(db, -80);
        var y = botY + (-db / 80) * botH;
        if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });

    // Axis labels
    ctx.fillStyle = PlotUtils.COLORS.textDim;
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText('0', pad, botY + botH + 12);
    ctx.fillText('π', pad + pw, botY + botH + 12);

    PlotUtils.drawScanlines(ctx, w, h);
    ctx.restore();
  }

  function bindControls() {
    var nEl = document.getElementById('winN');
    if (nEl) nEl.addEventListener('input', function () {
      N = parseInt(this.value, 10);
      document.getElementById('winNVal').textContent = N;
      draw();
    });

    ['rectangular', 'hanning', 'hamming', 'blackman', 'kaiser'].forEach(function (type) {
      var cb = document.getElementById('win_' + type);
      if (cb) cb.addEventListener('change', function () {
        activeWindows[type] = this.checked;
        draw();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
