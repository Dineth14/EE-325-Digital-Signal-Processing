/* ═══════════════════════════════════════════════════════
   Chapter 1 — SIM 1.3: Quantization Noise Lab
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var canvas, ctx, w, h;
  var bitDepth = 8, sigTypeQ = 'sine', dithering = false;

  function init() {
    canvas = document.getElementById('quantCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    bindControls();
    draw();
  }

  function resize() {
    var wrap = canvas.parentElement;
    w = canvas.width = wrap.clientWidth || 700;
    h = canvas.height = 260;
  }

  function generateSignal(N) {
    var x = new Array(N);
    for (var n = 0; n < N; n++) {
      var t = n / N;
      switch (sigTypeQ) {
        case 'sawtooth': x[n] = 2 * (t * 4 % 1) - 1; break;
        case 'random': x[n] = Math.random() * 2 - 1; break;
        default: x[n] = Math.sin(2 * Math.PI * 3 * t);
      }
    }
    return x;
  }

  function quantize(x, B) {
    var levels = Math.pow(2, B);
    var delta = 2.0 / levels;
    var xq = new Array(x.length);
    var err = new Array(x.length);
    for (var i = 0; i < x.length; i++) {
      var val = x[i];
      if (dithering) val += (Math.random() - 0.5) * delta;
      val = Math.max(-1, Math.min(1 - delta, val));
      var q = Math.round((val + 1) / delta) * delta - 1;
      xq[i] = q;
      err[i] = x[i] - q;
    }
    return { quantized: xq, error: err, delta: delta };
  }

  function draw() {
    ctx.save();
    PlotUtils.clearCanvas(ctx, w, h);

    var N = 200;
    var x = generateSignal(N);
    var result = quantize(x, bitDepth);
    var xq = result.quantized, err = result.error, delta = result.delta;

    var panelW = (w - 40) / 3;
    var panelH = h - 50;
    var pad = 15;

    // Panel 1: Quantized staircase
    var x1 = 10;
    PlotUtils.drawLabel(ctx, 'Quantized Signal', x1, 14, PlotUtils.COLORS.textMuted);
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.strokeRect(x1, 22, panelW, panelH);

    var amp1 = panelH * 0.4;
    var oy1 = 22 + panelH / 2;
    // Original (dim)
    ctx.strokeStyle = 'rgba(105,255,71,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var i = 0; i < N; i++) {
      var px = x1 + (i / N) * panelW;
      var py = oy1 - x[i] * amp1;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    // Quantized (cyan)
    ctx.strokeStyle = PlotUtils.COLORS.cyan;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (var j = 0; j < N; j++) {
      var px2 = x1 + (j / N) * panelW;
      var py2 = oy1 - xq[j] * amp1;
      if (j === 0) ctx.moveTo(px2, py2); else ctx.lineTo(px2, py2);
    }
    ctx.stroke();

    // Panel 2: Error signal
    var x2 = x1 + panelW + 10;
    PlotUtils.drawLabel(ctx, 'Quantization Error', x2, 14, PlotUtils.COLORS.textMuted);
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.strokeRect(x2, 22, panelW, panelH);

    var amp2 = panelH * 0.35;
    var oy2 = 22 + panelH / 2;
    var maxErr = delta / 2;
    ctx.strokeStyle = PlotUtils.COLORS.amber;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var k = 0; k < N; k++) {
      var px3 = x2 + (k / N) * panelW;
      var py3 = oy2 - (err[k] / (maxErr * 2)) * amp2;
      if (k === 0) ctx.moveTo(px3, py3); else ctx.lineTo(px3, py3);
    }
    ctx.stroke();
    // Zero line
    ctx.strokeStyle = PlotUtils.COLORS.gridFaint;
    ctx.setLineDash([2, 2]);
    ctx.beginPath(); ctx.moveTo(x2, oy2); ctx.lineTo(x2 + panelW, oy2); ctx.stroke();
    ctx.setLineDash([]);

    // Panel 3: Error histogram
    var x3 = x2 + panelW + 10;
    PlotUtils.drawLabel(ctx, 'Error Distribution', x3, 14, PlotUtils.COLORS.textMuted);
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.strokeRect(x3, 22, panelW, panelH);

    var bins = 20;
    var histo = new Array(bins).fill(0);
    for (var m = 0; m < N; m++) {
      var binIdx = Math.floor((err[m] / delta + 0.5) * (bins - 1));
      binIdx = Math.max(0, Math.min(bins - 1, binIdx));
      histo[binIdx]++;
    }
    var maxBin = Math.max.apply(null, histo) || 1;
    var barW = (panelW - 10) / bins;
    var oy3 = 22 + panelH - 5;
    for (var b = 0; b < bins; b++) {
      var bh = (histo[b] / maxBin) * (panelH - 20);
      var bx = x3 + 5 + b * barW;
      ctx.fillStyle = PlotUtils.COLORS.violet;
      ctx.fillRect(bx, oy3 - bh, barW - 1, bh);
    }

    PlotUtils.drawScanlines(ctx, w, h);
    ctx.restore();

    // Update readouts
    var signalPower = 0, noisePower = 0;
    for (var nn = 0; nn < N; nn++) {
      signalPower += x[nn] * x[nn];
      noisePower += err[nn] * err[nn];
    }
    signalPower /= N;
    noisePower /= N;
    var sqnrActual = 10 * Math.log10(signalPower / Math.max(noisePower, 1e-20));
    var sqnrTheory = 6.02 * bitDepth + 1.76;

    var sqnrEl = document.getElementById('sqnrVal');
    if (sqnrEl) sqnrEl.textContent = sqnrActual.toFixed(1) + ' dB (theory: ' + sqnrTheory.toFixed(1) + ' dB)';
    var maxErrEl = document.getElementById('maxErrVal');
    if (maxErrEl) maxErrEl.textContent = '±' + (delta / 2).toFixed(4);
    var dynEl = document.getElementById('dynRangeVal');
    if (dynEl) dynEl.textContent = (6.02 * bitDepth).toFixed(1) + ' dB';
  }

  function bindControls() {
    var bitSlider = document.getElementById('bitDepthSlider');
    if (bitSlider) {
      bitSlider.addEventListener('input', function () {
        bitDepth = parseInt(this.value, 10);
        document.getElementById('bitDepthVal').textContent = bitDepth + ' bits';
        draw();
      });
    }
    var typeSelect = document.getElementById('quantSigType');
    if (typeSelect) {
      typeSelect.addEventListener('change', function () {
        sigTypeQ = this.value;
        draw();
      });
    }
    var ditherToggle = document.getElementById('ditherToggle');
    if (ditherToggle) {
      ditherToggle.addEventListener('click', function () {
        dithering = !dithering;
        this.classList.toggle('active');
        draw();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
