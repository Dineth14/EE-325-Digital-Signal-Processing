/* ═══════════════════════════════════════════════════════
   Chapter 3 — SIM 3.3: Inverse Z-Transform
   Visualize partial fraction decomposition and
   time-domain sequences from Z-transform expressions
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var canvas, ctx, w, h;
  var bCoeffs = [1, 0.5];     // numerator
  var aCoeffs = [1, -1.2, 0.5]; // denominator
  var Nsamples = 30;
  var rocType = 'causal'; // 'causal' | 'anticausal'

  function init() {
    canvas = document.getElementById('invzCanvas');
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

  function computeSequence() {
    // Use long division / recursion to find h[n]
    // For causal: y[n] = (1/a0)*(b[n] - sum a[k]*y[n-k])
    var seq = new Array(Nsamples);
    var a0 = aCoeffs[0] || 1;
    for (var n = 0; n < Nsamples; n++) {
      var val = (n < bCoeffs.length ? bCoeffs[n] : 0) / a0;
      for (var k = 1; k < aCoeffs.length; k++) {
        if (n - k >= 0) val -= (aCoeffs[k] / a0) * seq[n - k];
      }
      seq[n] = val;
    }
    if (rocType === 'anticausal') {
      // For anti-causal, reverse the computation
      var aseq = new Array(Nsamples);
      for (var m = Nsamples - 1; m >= 0; m--) {
        var v = (m < bCoeffs.length ? bCoeffs[m] : 0) / a0;
        for (var j = 1; j < aCoeffs.length; j++) {
          if (m + j < Nsamples) v -= (aCoeffs[j] / a0) * aseq[m + j];
        }
        aseq[m] = -v;
      }
      return aseq;
    }
    return seq;
  }

  function draw() {
    ctx.save();
    PlotUtils.clearCanvas(ctx, w, h);

    var seq = computeSequence();
    var maxAmp = 0;
    seq.forEach(function (v) { maxAmp = Math.max(maxAmp, Math.abs(v)); });
    if (maxAmp < 0.01) maxAmp = 1;

    // Top: Pole-zero diagram (small)
    var pzCx = w * 0.15, pzCy = h * 0.25, pzR = h * 0.18;
    ctx.strokeStyle = PlotUtils.COLORS.border;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(pzCx, pzCy, pzR, 0, 2 * Math.PI); ctx.stroke();
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(pzCx - pzR * 1.3, pzCy); ctx.lineTo(pzCx + pzR * 1.3, pzCy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pzCx, pzCy - pzR * 1.3); ctx.lineTo(pzCx, pzCy + pzR * 1.3); ctx.stroke();

    var pRoots = DSP.polyRoots ? DSP.polyRoots(aCoeffs) : [];
    var zRoots = DSP.polyRoots ? DSP.polyRoots(bCoeffs) : [];

    ctx.strokeStyle = PlotUtils.COLORS.amber;
    ctx.lineWidth = 2;
    pRoots.forEach(function (p) {
      var x = pzCx + p.re * pzR, y = pzCy - p.im * pzR;
      ctx.beginPath(); ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5); ctx.stroke();
    });
    ctx.strokeStyle = PlotUtils.COLORS.cyan;
    zRoots.forEach(function (z) {
      var x = pzCx + z.re * pzR, y = pzCy - z.im * pzR;
      ctx.beginPath(); ctx.arc(x, y, 5, 0, 2 * Math.PI); ctx.stroke();
    });
    PlotUtils.drawLabel(ctx, 'Pole-Zero', pzCx - 30, pzCy - pzR - 10, PlotUtils.COLORS.textMuted);

    // Expression display
    var exprX = w * 0.32, exprY = 30;
    ctx.fillStyle = PlotUtils.COLORS.textPrimary;
    ctx.font = '12px JetBrains Mono';
    ctx.textAlign = 'left';
    ctx.fillText('B(z) = [' + bCoeffs.join(', ') + ']', exprX, exprY);
    ctx.fillText('A(z) = [' + aCoeffs.join(', ') + ']', exprX, exprY + 20);
    ctx.fillStyle = PlotUtils.COLORS.cyan;
    ctx.fillText('Poles:', exprX, exprY + 50);
    pRoots.forEach(function (p, i) {
      ctx.fillStyle = PlotUtils.COLORS.textMuted;
      ctx.fillText('  p' + (i + 1) + ' = ' + p.re.toFixed(3) + (p.im >= 0 ? '+' : '') + p.im.toFixed(3) + 'j  |p|=' + Math.sqrt(p.re * p.re + p.im * p.im).toFixed(3), exprX, exprY + 70 + i * 18);
    });

    // Bottom: Time-domain sequence
    var stemY = h * 0.65, stemH = h * 0.28, stemX0 = 60, stemW = w - 100;
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(stemX0, stemY); ctx.lineTo(stemX0 + stemW, stemY); ctx.stroke();
    PlotUtils.drawLabel(ctx, 'h[n] — Inverse Z-Transform (' + rocType + ')', stemX0, stemY - stemH - 10, PlotUtils.COLORS.textMuted);

    ctx.strokeStyle = PlotUtils.COLORS.green;
    ctx.fillStyle = PlotUtils.COLORS.green;
    ctx.lineWidth = 1.5;
    for (var n = 0; n < Nsamples; n++) {
      var x = stemX0 + (n / (Nsamples - 1)) * stemW;
      var barH = (seq[n] / maxAmp) * stemH * 0.9;
      ctx.beginPath(); ctx.moveTo(x, stemY); ctx.lineTo(x, stemY - barH); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, stemY - barH, 3, 0, 2 * Math.PI); ctx.fill();
    }

    // n-axis labels
    ctx.fillStyle = PlotUtils.COLORS.textDim;
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'center';
    for (var m = 0; m < Nsamples; m += 5) {
      var lx = stemX0 + (m / (Nsamples - 1)) * stemW;
      ctx.fillText(m, lx, stemY + 14);
    }

    // Envelope (if exponential decay)
    if (pRoots.length > 0) {
      ctx.strokeStyle = 'rgba(255,202,40,0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      var maxPoleR = 0;
      pRoots.forEach(function (p) {
        var r = Math.sqrt(p.re * p.re + p.im * p.im);
        if (r > maxPoleR) maxPoleR = r;
      });
      ctx.beginPath();
      for (var e = 0; e < Nsamples; e++) {
        var ex = stemX0 + (e / (Nsamples - 1)) * stemW;
        var env = Math.pow(maxPoleR, e);
        var ey = stemY - (env / maxAmp) * stemH * 0.9;
        if (e === 0) ctx.moveTo(ex, ey); else ctx.lineTo(ex, ey);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    PlotUtils.drawScanlines(ctx, w, h);
    ctx.restore();
  }

  function bindControls() {
    var bEl = document.getElementById('invzB');
    var aEl = document.getElementById('invzA');
    var rocEl = document.getElementById('invzROC');
    var nEl = document.getElementById('invzN');

    function parse(str) {
      return str.split(',').map(function (s) { return parseFloat(s.trim()) || 0; });
    }
    if (bEl) bEl.addEventListener('change', function () { bCoeffs = parse(this.value); draw(); });
    if (aEl) aEl.addEventListener('change', function () { aCoeffs = parse(this.value); draw(); });
    if (rocEl) rocEl.addEventListener('change', function () { rocType = this.value; draw(); });
    if (nEl) nEl.addEventListener('input', function () {
      Nsamples = parseInt(this.value, 10) || 30;
      draw();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
