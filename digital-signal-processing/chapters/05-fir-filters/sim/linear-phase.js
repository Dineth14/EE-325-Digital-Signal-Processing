/* ═══════════════════════════════════════════════════════
   Chapter 5 — SIM 5.3: Linear Phase Explorer
   Visualize FIR filter symmetry and linear phase types
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var canvas, ctx, w, h;
  var filterLength = 11;
  var phaseType = 1; // 1-4

  function init() {
    canvas = document.getElementById('phaseCanvas');
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

  function getCoeffs() {
    var N = filterLength;
    var coeffs = [];
    var M = Math.floor((N - 1) / 2);
    switch (phaseType) {
      case 1: // Type I: odd N, symmetric
        for (var i = 0; i < N; i++) {
          var n = i - M;
          coeffs.push(n === 0 ? 0.4 : 0.4 * Math.sin(0.4 * Math.PI * n) / (Math.PI * n));
        }
        break;
      case 2: // Type II: even N, symmetric
        N = filterLength % 2 === 0 ? filterLength : filterLength + 1;
        M = (N - 1) / 2;
        coeffs = [];
        for (var j = 0; j < N; j++) {
          var n2 = j - M;
          coeffs.push(n2 === 0 ? 0.4 : 0.4 * Math.sin(0.4 * Math.PI * n2) / (Math.PI * n2));
        }
        break;
      case 3: // Type III: odd N, anti-symmetric
        for (var k = 0; k < N; k++) {
          var n3 = k - M;
          var val = n3 === 0 ? 0 : Math.sin(0.5 * Math.PI * n3) / (Math.PI * n3);
          coeffs.push(val);
        }
        // Make anti-symmetric
        for (var a = 0; a < Math.floor(N / 2); a++) {
          coeffs[N - 1 - a] = -coeffs[a];
        }
        if (N % 2 === 1) coeffs[M] = 0;
        break;
      case 4: // Type IV: even N, anti-symmetric
        N = filterLength % 2 === 0 ? filterLength : filterLength + 1;
        coeffs = [];
        for (var m = 0; m < N; m++) {
          coeffs.push(Math.sin(0.3 * Math.PI * (m - (N - 1) / 2)) * 0.3);
        }
        for (var b = 0; b < Math.floor(N / 2); b++) {
          coeffs[N - 1 - b] = -coeffs[b];
        }
        break;
      default:
        for (var d = 0; d < N; d++) coeffs.push(d === M ? 1 : 0);
    }

    // Apply Hamming window
    var win = DSP.windowHamming(coeffs.length);
    for (var wi = 0; wi < coeffs.length; wi++) coeffs[wi] *= win[wi];
    return coeffs;
  }

  function draw() {
    ctx.save();
    PlotUtils.clearCanvas(ctx, w, h);

    var coeffs = getCoeffs();
    var N = coeffs.length;
    var pad = 55, pw = w - pad - 20;
    var r1Y = 5, r1H = h * 0.22;
    var r2Y = h * 0.3, r2H = h * 0.28;
    var r3Y = h * 0.65, r3H = h * 0.3;

    // Row 1: Coefficients with symmetry highlight
    var maxC = 0;
    coeffs.forEach(function (c) { maxC = Math.max(maxC, Math.abs(c)); });
    if (maxC < 1e-10) maxC = 1;

    PlotUtils.drawLabel(ctx, 'h[n] — Type ' + phaseType + ' Linear Phase', 5, r1Y + 14, PlotUtils.COLORS.textMuted);
    var baseY = r1Y + r1H * 0.6;
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(pad, baseY); ctx.lineTo(pad + pw, baseY); ctx.stroke();

    // Symmetry line
    ctx.strokeStyle = 'rgba(179,136,255,0.3)';
    ctx.setLineDash([3, 3]);
    var symX = pad + ((N - 1) / 2 / (N - 1)) * pw;
    ctx.beginPath(); ctx.moveTo(symX, r1Y); ctx.lineTo(symX, r1Y + r1H); ctx.stroke();
    ctx.setLineDash([]);

    for (var n = 0; n < N; n++) {
      var x = pad + (n / (N - 1)) * pw;
      var y = baseY - (coeffs[n] / maxC) * r1H * 0.45;
      // Color: left half cyan, right half green to show symmetry
      ctx.strokeStyle = n < N / 2 ? PlotUtils.COLORS.cyan : PlotUtils.COLORS.green;
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x, baseY); ctx.lineTo(x, y); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
    }

    // Row 2: Magnitude response
    var Nw = 512, mag = [], phase = [];
    for (var i = 0; i < Nw; i++) {
      var omega = (i / (Nw - 1)) * Math.PI;
      var re = 0, im = 0;
      for (var k = 0; k < N; k++) {
        re += coeffs[k] * Math.cos(omega * k);
        im -= coeffs[k] * Math.sin(omega * k);
      }
      mag.push(Math.sqrt(re * re + im * im));
      phase.push(Math.atan2(im, re));
    }

    var maxMag = 0;
    mag.forEach(function (m) { maxMag = Math.max(maxMag, m); });
    if (maxMag < 1e-10) maxMag = 1;

    PlotUtils.drawLabel(ctx, '|H(e^jω)|', 5, r2Y + 12, PlotUtils.COLORS.textMuted);
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(pad, r2Y, pw, r2H);

    ctx.strokeStyle = PlotUtils.COLORS.cyan;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (var j = 0; j < Nw; j++) {
      var mx = pad + (j / (Nw - 1)) * pw;
      var my = r2Y + r2H - (mag[j] / maxMag) * r2H * 0.9;
      if (j === 0) ctx.moveTo(mx, my); else ctx.lineTo(mx, my);
    }
    ctx.stroke();

    // Row 3: Phase response (should be linear)
    PlotUtils.drawLabel(ctx, '∠H(e^jω) — expect linear', 5, r3Y + 12, PlotUtils.COLORS.textMuted);
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(pad, r3Y, pw, r3H);

    // Unwrap phase
    var unwrapped = [phase[0]];
    for (var u = 1; u < Nw; u++) {
      var diff = phase[u] - phase[u - 1];
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      unwrapped.push(unwrapped[u - 1] + diff);
    }
    var minPh = Infinity, maxPh = -Infinity;
    unwrapped.forEach(function (p) { minPh = Math.min(minPh, p); maxPh = Math.max(maxPh, p); });
    var phRange = maxPh - minPh || 1;

    ctx.strokeStyle = PlotUtils.COLORS.violet;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (var p = 0; p < Nw; p++) {
      var px = pad + (p / (Nw - 1)) * pw;
      var py = r3Y + r3H - ((unwrapped[p] - minPh) / phRange) * r3H * 0.9;
      if (p === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Linearity indicator
    var slope = (unwrapped[Nw - 1] - unwrapped[0]) / (Nw - 1);
    var linErr = 0;
    for (var le = 0; le < Nw; le++) {
      if (mag[le] / maxMag > 0.01) { // Only in passband
        var expected = unwrapped[0] + slope * le;
        linErr += Math.abs(unwrapped[le] - expected);
      }
    }
    linErr /= Nw;
    ctx.fillStyle = linErr < 0.05 ? PlotUtils.COLORS.green : PlotUtils.COLORS.amber;
    ctx.font = '12px Inter';
    ctx.textAlign = 'right';
    ctx.fillText('Phase linearity error: ' + linErr.toFixed(4), w - 20, r3Y + r3H + 15);

    PlotUtils.drawScanlines(ctx, w, h);
    ctx.restore();
  }

  function bindControls() {
    var typeEl = document.getElementById('lpType');
    var lenEl = document.getElementById('lpLen');
    if (typeEl) typeEl.addEventListener('change', function () {
      phaseType = parseInt(this.value, 10);
      draw();
    });
    if (lenEl) lenEl.addEventListener('input', function () {
      filterLength = parseInt(this.value, 10);
      document.getElementById('lpLenVal').textContent = filterLength;
      draw();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
