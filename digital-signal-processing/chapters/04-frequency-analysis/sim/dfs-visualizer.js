/* ═══════════════════════════════════════════════════════
   Chapter 4 — SIM 4.3: DFS Visualizer
   Discrete Fourier Series — periodic extension & DFS
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var canvas, ctx, w, h;
  var period = 8;
  var sigType = 'rect';
  var numPeriods = 3;

  function init() {
    canvas = document.getElementById('dfsCanvas');
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
    h = canvas.height = 360;
  }

  function getOnePeriod() {
    var x = [];
    for (var n = 0; n < period; n++) {
      switch (sigType) {
        case 'rect': x.push(n < period / 2 ? 1 : 0); break;
        case 'sawtooth': x.push(n / period); break;
        case 'triangle': x.push(1 - 2 * Math.abs(n - (period - 1) / 2) / (period - 1)); break;
        case 'impulse_train': x.push(n === 0 ? 1 : 0); break;
        default: x.push(n < period / 2 ? 1 : 0);
      }
    }
    return x;
  }

  function draw() {
    ctx.save();
    PlotUtils.clearCanvas(ctx, w, h);

    var one = getOnePeriod();
    var pad = 55, pw = w - pad - 20;
    var r1H = h * 0.3, r2H = h * 0.3;
    var r1Y = 10, r2Y = h * 0.4, r3Y = h * 0.75;

    // Periodic extension
    var total = period * numPeriods;
    var periodic = [];
    for (var i = 0; i < total; i++) periodic.push(one[i % period]);

    var maxVal = 0;
    periodic.forEach(function (v) { maxVal = Math.max(maxVal, Math.abs(v)); });
    if (maxVal < 0.01) maxVal = 1;

    PlotUtils.drawLabel(ctx, 'x̃[n]  (periodic, N=' + period + ')', 5, r1Y + 14, PlotUtils.COLORS.textMuted);
    var baseY = r1Y + r1H * 0.7;
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(pad, baseY); ctx.lineTo(pad + pw, baseY); ctx.stroke();

    // Period boundaries
    ctx.strokeStyle = 'rgba(179,136,255,0.2)';
    ctx.setLineDash([3, 3]);
    for (var p = 1; p < numPeriods; p++) {
      var bx = pad + (p * period / total) * pw;
      ctx.beginPath(); ctx.moveTo(bx, r1Y); ctx.lineTo(bx, r1Y + r1H); ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.strokeStyle = PlotUtils.COLORS.cyan;
    ctx.fillStyle = PlotUtils.COLORS.cyan;
    ctx.lineWidth = 1.5;
    for (var n = 0; n < total; n++) {
      var sx = pad + (n / (total - 1)) * pw;
      var sy = baseY - (periodic[n] / maxVal) * r1H * 0.5;
      ctx.beginPath(); ctx.moveTo(sx, baseY); ctx.lineTo(sx, sy); ctx.stroke();
      ctx.beginPath(); ctx.arc(sx, sy, 2, 0, Math.PI * 2); ctx.fill();
    }

    // DFS coefficients
    var X_re = new Array(period), X_im = new Array(period);
    for (var k = 0; k < period; k++) {
      X_re[k] = 0; X_im[k] = 0;
      for (var m = 0; m < period; m++) {
        var angle = -2 * Math.PI * k * m / period;
        X_re[k] += one[m] * Math.cos(angle);
        X_im[k] += one[m] * Math.sin(angle);
      }
      X_re[k] /= period; X_im[k] /= period;
    }

    var mag = [], maxMag = 0;
    for (var k2 = 0; k2 < period; k2++) {
      mag.push(Math.sqrt(X_re[k2] * X_re[k2] + X_im[k2] * X_im[k2]));
      if (mag[k2] > maxMag) maxMag = mag[k2];
    }
    if (maxMag < 0.01) maxMag = 1;

    PlotUtils.drawLabel(ctx, '|X̃[k]|  DFS Coefficients', 5, r2Y + 14, PlotUtils.COLORS.textMuted);
    var magBase = r2Y + r2H;
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(pad, magBase); ctx.lineTo(pad + pw, magBase); ctx.stroke();

    var barW = Math.max(4, pw / period * 0.6);
    for (var k3 = 0; k3 < period; k3++) {
      var bx2 = pad + (k3 / (period - 1)) * pw * 0.9;
      var bh = (mag[k3] / maxMag) * r2H * 0.8;
      ctx.fillStyle = PlotUtils.COLORS.amber;
      ctx.fillRect(bx2 - barW / 2, magBase - bh, barW, bh);
      ctx.fillStyle = PlotUtils.COLORS.textDim;
      ctx.font = '10px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(k3.toString(), bx2, magBase + 12);
    }

    // Synthesis: show reconstructed signal from DFS
    PlotUtils.drawLabel(ctx, 'Synthesis from DFS (verify)', 5, r3Y + 5, PlotUtils.COLORS.textMuted);
    var synthBase = r3Y + (h - r3Y) * 0.6;
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(pad, synthBase); ctx.lineTo(pad + pw, synthBase); ctx.stroke();

    ctx.strokeStyle = PlotUtils.COLORS.green;
    ctx.fillStyle = PlotUtils.COLORS.green;
    ctx.lineWidth = 1.5;
    for (var n2 = 0; n2 < period; n2++) {
      var val = 0;
      for (var k4 = 0; k4 < period; k4++) {
        var a = 2 * Math.PI * k4 * n2 / period;
        val += X_re[k4] * Math.cos(a) - X_im[k4] * Math.sin(a);
      }
      var sx2 = pad + (n2 / (period - 1)) * pw * 0.9;
      var sy2 = synthBase - (val / maxVal) * (h - r3Y) * 0.4;
      ctx.beginPath(); ctx.moveTo(sx2, synthBase); ctx.lineTo(sx2, sy2); ctx.stroke();
      ctx.beginPath(); ctx.arc(sx2, sy2, 3, 0, Math.PI * 2); ctx.fill();
    }

    PlotUtils.drawScanlines(ctx, w, h);
    ctx.restore();
  }

  function bindControls() {
    var typeEl = document.getElementById('dfsType');
    var nEl = document.getElementById('dfsPeriod');
    if (typeEl) typeEl.addEventListener('change', function () { sigType = this.value; draw(); });
    if (nEl) nEl.addEventListener('input', function () {
      period = parseInt(this.value, 10);
      document.getElementById('dfsPeriodVal').textContent = period;
      draw();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
