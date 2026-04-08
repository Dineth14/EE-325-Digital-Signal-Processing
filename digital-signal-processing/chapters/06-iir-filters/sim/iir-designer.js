/* ═══════════════════════════════════════════════════════
   Chapter 6 — SIM 6.1: IIR Designer
   Design Butterworth/Chebyshev IIR filters interactively
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var canvas, ctx, w, h;
  var filterOrder = 4;
  var cutoff = 0.3; // normalized [0,1] maps to [0,π]
  var filterProto = 'butterworth'; // 'butterworth' | 'chebyshev1'
  var ripple = 1; // dB for Chebyshev

  function init() {
    canvas = document.getElementById('iirCanvas');
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

  function designFilter() {
    // Simple Butterworth LP via bilinear transform
    var wc = Math.tan(cutoff * Math.PI / 2); // pre-warp
    var N = filterOrder;
    var b = [1], a = [1];

    if (filterProto === 'butterworth') {
      // Cascade second-order sections
      for (var k = 0; k < N; k++) {
        var theta = Math.PI * (2 * k + 1) / (2 * N) + Math.PI / 2;
        var s_re = wc * Math.cos(theta);
        var s_im = wc * Math.sin(theta);
        // Only use poles in left half-plane
        if (s_re < 0) {
          // Bilinear: z = (1 + s/2)/(1 - s/2)
          // Transfer function section: (wc^2) / (s^2 - 2*Re(s)*s + |s|^2)
          // After bilinear transform, get 2nd order digital section
          var mag2 = s_re * s_re + s_im * s_im;
          // Simple cascade accumulation
          var bi = [mag2, 2 * mag2, mag2]; // numerator
          var ai = [1 + Math.abs(2 * s_re) + mag2, 2 * (mag2 - 1), 1 - Math.abs(2 * s_re) + mag2]; // denominator
          b = convolve(b, bi);
          a = convolve(a, ai);
        }
      }
    } else {
      // Simple proxy: just return butterworth for now
      return designButterworth(N, cutoff);
    }

    // Normalize
    var gain = evalPolyAt1(a) / evalPolyAt1(b);
    for (var i = 0; i < b.length; i++) b[i] *= gain;
    return { b: b, a: a };
  }

  function designButterworth(N, wc) {
    // Direct computation via DSP lib
    var poles = DSP.butterworthPoles(N);
    var b = [1], a = [1];
    var wcPrewarp = Math.tan(wc * Math.PI / 2);
    for (var i = 0; i < poles.length; i++) {
      if (poles[i].im >= 0) {
        var sp_re = poles[i].re * wcPrewarp;
        var sp_im = poles[i].im * wcPrewarp;
        // Bilinear transform
        var result = DSP.bilinear([0, 0, sp_re * sp_re + sp_im * sp_im],
          [1, -2 * sp_re, sp_re * sp_re + sp_im * sp_im], 2);
        b = convolve(b, result.b);
        a = convolve(a, result.a);
      }
    }
    var g = evalPolyAt1(a) / evalPolyAt1(b);
    for (var j = 0; j < b.length; j++) b[j] *= g;
    return { b: b, a: a };
  }

  function convolve(a, b) {
    var len = a.length + b.length - 1;
    var c = new Array(len);
    for (var i = 0; i < len; i++) c[i] = 0;
    for (var i2 = 0; i2 < a.length; i2++) {
      for (var j = 0; j < b.length; j++) {
        c[i2 + j] += a[i2] * b[j];
      }
    }
    return c;
  }

  function evalPolyAt1(coeffs) {
    var sum = 0;
    for (var i = 0; i < coeffs.length; i++) sum += coeffs[i];
    return sum;
  }

  function draw() {
    ctx.save();
    PlotUtils.clearCanvas(ctx, w, h);

    var filter;
    try { filter = designFilter(); } catch (e) { filter = { b: [1], a: [1] }; }
    var b = filter.b, a = filter.a;

    var pad = 55, pw = w - pad - 20;
    var r1Y = 5, r1H = h * 0.3;
    var r2Y = h * 0.38, r2H = h * 0.28;
    var r3Y = h * 0.72, r3H = h * 0.24;

    // Row 1: Magnitude response in dB
    var Nw = 512, magDb = [];
    for (var i = 0; i < Nw; i++) {
      var omega = (i / (Nw - 1)) * Math.PI;
      var num_re = 0, num_im = 0, den_re = 0, den_im = 0;
      for (var k = 0; k < b.length; k++) {
        num_re += b[k] * Math.cos(-omega * k);
        num_im += b[k] * Math.sin(-omega * k);
      }
      for (var m = 0; m < a.length; m++) {
        den_re += a[m] * Math.cos(-omega * m);
        den_im += a[m] * Math.sin(-omega * m);
      }
      var numMag = Math.sqrt(num_re * num_re + num_im * num_im);
      var denMag = Math.sqrt(den_re * den_re + den_im * den_im);
      var mg = denMag > 1e-10 ? numMag / denMag : 0;
      magDb.push(20 * Math.log10(Math.max(mg, 1e-10)));
    }

    PlotUtils.drawLabel(ctx, '|H(e^jω)| dB — ' + filterProto + ' order ' + filterOrder, 5, r1Y + 14, PlotUtils.COLORS.textMuted);
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(pad, r1Y + 20, pw, r1H - 20);

    ctx.strokeStyle = PlotUtils.COLORS.cyan;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (var j = 0; j < Nw; j++) {
      var mx = pad + (j / (Nw - 1)) * pw;
      var db = Math.max(magDb[j], -80);
      var my = r1Y + 20 + (-db / 80) * (r1H - 20);
      if (j === 0) ctx.moveTo(mx, my); else ctx.lineTo(mx, my);
    }
    ctx.stroke();

    // Cutoff line
    var cutX = pad + cutoff * pw;
    ctx.strokeStyle = PlotUtils.COLORS.amber;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(cutX, r1Y + 20); ctx.lineTo(cutX, r1Y + r1H); ctx.stroke();
    ctx.setLineDash([]);

    // -3 dB line
    ctx.strokeStyle = 'rgba(255,107,107,0.4)';
    ctx.setLineDash([2, 4]);
    var db3Y = r1Y + 20 + (3 / 80) * (r1H - 20);
    ctx.beginPath(); ctx.moveTo(pad, db3Y); ctx.lineTo(pad + pw, db3Y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ff6b6b';
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'left';
    ctx.fillText('-3 dB', pad + pw + 3, db3Y + 4);

    // Row 2: Pole-zero plot
    PlotUtils.drawLabel(ctx, 'Pole-Zero Plot', 5, r2Y + 12, PlotUtils.COLORS.textMuted);
    var pzCx = pad + pw * 0.2, pzCy = r2Y + r2H / 2 + 5, pzR = r2H * 0.4;
    ctx.strokeStyle = PlotUtils.COLORS.border;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(pzCx, pzCy, pzR, 0, Math.PI * 2); ctx.stroke();

    var poles = DSP.polyRoots ? DSP.polyRoots(a) : [];
    var zeros = DSP.polyRoots ? DSP.polyRoots(b) : [];

    ctx.strokeStyle = PlotUtils.COLORS.amber;
    ctx.lineWidth = 2;
    poles.forEach(function (p) {
      var x = pzCx + p.re * pzR, y = pzCy - p.im * pzR;
      ctx.beginPath(); ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y + 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 4, y - 4); ctx.lineTo(x - 4, y + 4); ctx.stroke();
    });
    ctx.strokeStyle = PlotUtils.COLORS.cyan;
    zeros.forEach(function (z) {
      var x = pzCx + z.re * pzR, y = pzCy - z.im * pzR;
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.stroke();
    });

    // Impulse response on the right
    PlotUtils.drawLabel(ctx, 'h[n] — Impulse Response', pad + pw * 0.4, r2Y + 12, PlotUtils.COLORS.textMuted);
    var irLen = 40;
    var ir = [1];
    for (var ni = 1; ni < irLen; ni++) {
      var val = (ni < b.length ? b[ni] : 0);
      for (var ak = 1; ak < a.length; ak++) {
        if (ni - ak >= 0 && ni - ak < ir.length) val -= a[ak] * ir[ni - ak];
      }
      val /= a[0] || 1;
      ir.push(val);
    }

    var maxIr = 0;
    ir.forEach(function (v) { maxIr = Math.max(maxIr, Math.abs(v)); });
    if (maxIr < 1e-10) maxIr = 1;

    var irX0 = pad + pw * 0.42, irW = pw * 0.55;
    var irBase = r2Y + r2H - 5;
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(irX0, irBase); ctx.lineTo(irX0 + irW, irBase); ctx.stroke();

    ctx.strokeStyle = PlotUtils.COLORS.green;
    ctx.fillStyle = PlotUtils.COLORS.green;
    ctx.lineWidth = 1;
    for (var s = 0; s < irLen; s++) {
      var sx = irX0 + (s / (irLen - 1)) * irW;
      var sy = irBase - (ir[s] / maxIr) * r2H * 0.35;
      ctx.beginPath(); ctx.moveTo(sx, irBase); ctx.lineTo(sx, sy); ctx.stroke();
      ctx.beginPath(); ctx.arc(sx, sy, 1.5, 0, Math.PI * 2); ctx.fill();
    }

    // Row 3: Coefficients display
    PlotUtils.drawLabel(ctx, 'Filter Coefficients', 5, r3Y + 12, PlotUtils.COLORS.textMuted);
    ctx.fillStyle = PlotUtils.COLORS.textPrimary;
    ctx.font = '11px JetBrains Mono';
    ctx.textAlign = 'left';
    var bStr = 'b = [' + b.slice(0, 8).map(function (v) { return v.toFixed(4); }).join(', ') + (b.length > 8 ? '...' : '') + ']';
    var aStr = 'a = [' + a.slice(0, 8).map(function (v) { return v.toFixed(4); }).join(', ') + (a.length > 8 ? '...' : '') + ']';
    ctx.fillText(bStr, pad, r3Y + 32);
    ctx.fillText(aStr, pad, r3Y + 52);

    // Stability check
    var stable = poles.every(function (p) { return Math.sqrt(p.re * p.re + p.im * p.im) < 1.001; });
    ctx.fillStyle = stable ? PlotUtils.COLORS.green : '#ff4444';
    ctx.fillText(stable ? '✓ Stable' : '✗ Unstable', pad, r3Y + 75);

    PlotUtils.drawScanlines(ctx, w, h);
    ctx.restore();
  }

  function bindControls() {
    var ordEl = document.getElementById('iirOrder');
    var cutEl = document.getElementById('iirCutoff');
    var protoEl = document.getElementById('iirProto');

    if (ordEl) ordEl.addEventListener('input', function () {
      filterOrder = parseInt(this.value, 10);
      document.getElementById('iirOrderVal').textContent = filterOrder;
      draw();
    });
    if (cutEl) cutEl.addEventListener('input', function () {
      cutoff = parseFloat(this.value);
      document.getElementById('iirCutoffVal').textContent = cutoff.toFixed(2) + 'π';
      draw();
    });
    if (protoEl) protoEl.addEventListener('change', function () {
      filterProto = this.value;
      draw();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
