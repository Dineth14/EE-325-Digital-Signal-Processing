/* ═══════════════════════════════════════════════════════
   Chapter 7 — SIM 7.1: Analog Prototype Comparison
   Compare Butterworth, Chebyshev I/II, Elliptic responses
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var canvas, ctx, w, h;
  var order = 4, showButter = true, showCheby1 = true, showCheby2 = true, showEllip = true;
  var ripple = 1; // dB

  function init() {
    canvas = document.getElementById('protoCanvas');
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

  // Butterworth |H(jΩ)|² = 1/(1+(Ω/Ωc)^2N)
  function butterMag(omega, N) {
    return 1 / Math.sqrt(1 + Math.pow(omega, 2 * N));
  }

  // Chebyshev polynomial T_N(x) via recursion
  function chebyPoly(N, x) {
    if (N === 0) return 1;
    if (N === 1) return x;
    var t0 = 1, t1 = x, t;
    for (var i = 2; i <= N; i++) {
      t = 2 * x * t1 - t0;
      t0 = t1; t1 = t;
    }
    return t1;
  }

  // Chebyshev Type I: |H|² = 1/(1+ε²*T_N²(Ω))
  function cheby1Mag(omega, N, eps) {
    var tn = chebyPoly(N, omega);
    return 1 / Math.sqrt(1 + eps * eps * tn * tn);
  }

  // Chebyshev Type II (inverse): flat passband, equiripple stopband
  // |H|² = 1/(1+1/(ε²*T_N²(1/Ω))) for Ω > 1
  function cheby2Mag(omega, N, eps) {
    if (Math.abs(omega) < 1e-10) return 1;
    var tn = chebyPoly(N, 1 / omega);
    var denom = 1 + 1 / (eps * eps * tn * tn);
    return 1 / Math.sqrt(denom);
  }

  // Approximate Elliptic — simplified model showing equiripple in both bands
  function ellipticMag(omega, N, eps) {
    // Real elliptic is complex; approximate with enhanced ripple model
    if (omega <= 1) {
      // Passband equiripple approximation
      var rp = eps * Math.cos(N * Math.acos(Math.min(1, Math.max(-1, omega))));
      return 1 / Math.sqrt(1 + rp * rp);
    } else {
      // Steeper rolloff than Chebyshev
      var factor = Math.pow(omega, 2 * N + 2);
      return 1 / Math.sqrt(1 + eps * eps * factor * 2);
    }
  }

  function draw() {
    ctx.save();
    PlotUtils.clearCanvas(ctx, w, h);
    var pad = { l: 55, r: 20, t: 40, b: 45 };
    var pW = w - pad.l - pad.r, pH = h - pad.t - pad.b;

    PlotUtils.drawLabel(ctx, 'Analog Filter Prototype Comparison', pad.l, 18, PlotUtils.COLORS.textMuted);

    // dB range
    var dbMin = -80, dbMax = 5;

    // Grid
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.3;
    ctx.fillStyle = PlotUtils.COLORS.textDim;
    ctx.font = '9px JetBrains Mono';
    ctx.textAlign = 'right';
    for (var db = dbMin; db <= dbMax; db += 10) {
      var y = pad.t + pH - (db - dbMin) / (dbMax - dbMin) * pH;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + pW, y); ctx.stroke();
      if (db % 20 === 0) ctx.fillText(db + ' dB', pad.l - 5, y + 3);
    }

    // 0 dB and -3 dB lines
    var y0 = pad.t + pH - (0 - dbMin) / (dbMax - dbMin) * pH;
    var y3 = pad.t + pH - (-3 - dbMin) / (dbMax - dbMin) * pH;
    ctx.strokeStyle = 'rgba(255,202,40,0.3)';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(pad.l, y0); ctx.lineTo(pad.l + pW, y0); ctx.stroke();
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(pad.l, y3); ctx.lineTo(pad.l + pW, y3); ctx.stroke();
    ctx.setLineDash([]);

    // Frequency axis (normalized Ω from 0.01 to 10, log scale)
    var fMin = 0.01, fMax = 10;
    ctx.textAlign = 'center';
    var freqs = [0.01, 0.1, 0.5, 1, 2, 5, 10];
    for (var fi = 0; fi < freqs.length; fi++) {
      var fx = pad.l + Math.log10(freqs[fi] / fMin) / Math.log10(fMax / fMin) * pW;
      ctx.strokeStyle = PlotUtils.COLORS.grid;
      ctx.lineWidth = 0.3;
      ctx.beginPath(); ctx.moveTo(fx, pad.t); ctx.lineTo(fx, pad.t + pH); ctx.stroke();
      ctx.fillStyle = PlotUtils.COLORS.textDim;
      ctx.fillText(freqs[fi], fx, pad.t + pH + 15);
    }
    ctx.fillText('Ω/Ωc (log)', pad.l + pW * 0.5, h - 5);

    // Cutoff line at Ω = 1
    var cutX = pad.l + Math.log10(1 / fMin) / Math.log10(fMax / fMin) * pW;
    ctx.strokeStyle = 'rgba(0,229,255,0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(cutX, pad.t); ctx.lineTo(cutX, pad.t + pH); ctx.stroke();
    ctx.setLineDash([]);

    var eps = Math.sqrt(Math.pow(10, ripple / 10) - 1);
    var nPts = 500;

    function plotCurve(magFn, color) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (var i = 0; i < nPts; i++) {
        var logF = Math.log10(fMin) + i / (nPts - 1) * (Math.log10(fMax) - Math.log10(fMin));
        var f = Math.pow(10, logF);
        var mag = magFn(f);
        var db = 20 * Math.log10(Math.max(mag, 1e-12));
        db = Math.max(dbMin, Math.min(dbMax, db));
        var x = pad.l + i / (nPts - 1) * pW;
        var y = pad.t + pH - (db - dbMin) / (dbMax - dbMin) * pH;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    if (showButter) plotCurve(function (f) { return butterMag(f, order); }, PlotUtils.COLORS.cyan);
    if (showCheby1) plotCurve(function (f) { return cheby1Mag(f, order, eps); }, PlotUtils.COLORS.violet);
    if (showCheby2) plotCurve(function (f) { return cheby2Mag(f, order, eps); }, PlotUtils.COLORS.green);
    if (showEllip) plotCurve(function (f) { return ellipticMag(f, order, eps); }, PlotUtils.COLORS.amber);

    // Legend
    var legX = pad.l + pW - 160, legY = pad.t + 10;
    var items = [];
    if (showButter) items.push({ c: PlotUtils.COLORS.cyan, t: 'Butterworth' });
    if (showCheby1) items.push({ c: PlotUtils.COLORS.violet, t: 'Chebyshev I' });
    if (showCheby2) items.push({ c: PlotUtils.COLORS.green, t: 'Chebyshev II' });
    if (showEllip) items.push({ c: PlotUtils.COLORS.amber, t: 'Elliptic' });
    ctx.font = '11px Inter';
    ctx.textAlign = 'left';
    for (var li = 0; li < items.length; li++) {
      ctx.fillStyle = items[li].c;
      ctx.fillRect(legX, legY + li * 18, 12, 3);
      ctx.fillStyle = PlotUtils.COLORS.textPrimary;
      ctx.fillText(items[li].t, legX + 18, legY + li * 18 + 5);
    }

    PlotUtils.drawScanlines(ctx, w, h);
    ctx.restore();
  }

  function bindControls() {
    var orderEl = document.getElementById('protoOrder');
    if (orderEl) orderEl.addEventListener('input', function () {
      order = parseInt(this.value);
      document.getElementById('protoOrderVal').textContent = order;
      draw();
    });
    var ripEl = document.getElementById('protoRipple');
    if (ripEl) ripEl.addEventListener('input', function () {
      ripple = parseFloat(this.value);
      document.getElementById('protoRippleVal').textContent = ripple.toFixed(1);
      draw();
    });

    ['protoButter', 'protoCheby1', 'protoCheby2', 'protoEllip'].forEach(function (id, idx) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('change', function () {
        if (idx === 0) showButter = this.checked;
        else if (idx === 1) showCheby1 = this.checked;
        else if (idx === 2) showCheby2 = this.checked;
        else showEllip = this.checked;
        draw();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
