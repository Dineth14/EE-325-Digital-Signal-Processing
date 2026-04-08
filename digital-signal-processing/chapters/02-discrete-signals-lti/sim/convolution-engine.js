/* ═══════════════════════════════════════════════════════
   Chapter 2 — SIM 2.2: Graphical Convolution Engine
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var canvas, ctx, w, h;
  var xSignal = [], hSignal = [];
  var nShift = -5, autoPlay = false, stepMode = false, playing = false;
  var animSpeed = 1, animTimer = 0;
  var nMin = -10, nMax = 30;

  function init() {
    canvas = document.getElementById('convCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', function () { resize(); draw(); });
    loadPresets();
    bindControls();
    draw();
  }

  function resize() {
    var wrap = canvas.parentElement;
    w = canvas.width = wrap.clientWidth || 700;
    h = canvas.height = 400;
  }

  function loadPresets() {
    var xPre = document.getElementById('convXPreset');
    var hPre = document.getElementById('convHPreset');
    setSignal('x', xPre ? xPre.value : 'impulse');
    setSignal('h', hPre ? hPre.value : 'rect');
  }

  function setSignal(which, type) {
    var s = [];
    switch (type) {
      case 'impulse': s = [1]; break;
      case 'step': s = [1, 1, 1, 1, 1, 1, 1, 1]; break;
      case 'rect': s = [1, 1, 1, 1, 1]; break;
      case 'exponential':
        for (var i = 0; i < 8; i++) s.push(Math.pow(0.8, i));
        break;
      case 'causal_exp':
        for (var j = 0; j < 10; j++) s.push(Math.pow(0.7, j));
        break;
      default: s = [1];
    }
    if (which === 'x') xSignal = s; else hSignal = s;
  }

  function nToX(n, rowOx) {
    var pad = 50, plotW = w - 2 * pad;
    return pad + ((n - nMin) / (nMax - nMin)) * plotW;
  }

  function draw() {
    ctx.save();
    PlotUtils.clearCanvas(ctx, w, h);

    var rowH = h / 3;
    var pad = 50, plotW = w - 2 * pad;
    var output = DSP.convLinear(xSignal, hSignal);
    var maxAmp = 1;
    xSignal.forEach(function (v) { maxAmp = Math.max(maxAmp, Math.abs(v)); });
    hSignal.forEach(function (v) { maxAmp = Math.max(maxAmp, Math.abs(v)); });
    output.forEach(function (v) { maxAmp = Math.max(maxAmp, Math.abs(v)); });

    // Row 1: x[k]
    drawRow(0, 'x[k]', xSignal, 0, PlotUtils.COLORS.green, maxAmp);
    // Row 2: h[n-k] (flipped and shifted)
    drawFlippedRow(1, 'h[' + nShift + '−k]', hSignal, nShift, PlotUtils.COLORS.cyan, maxAmp);
    // Products highlight
    drawProducts(1, maxAmp);
    // Row 3: y[n]
    drawOutputRow(2, 'y[n]', output, maxAmp);

    PlotUtils.drawScanlines(ctx, w, h);
    ctx.restore();

    // Update output display
    var outEl = document.getElementById('convOutputVals');
    if (outEl) {
      outEl.textContent = output.map(function (v) { return v.toFixed(3); }).join(', ');
    }
  }

  function drawRow(rowIdx, label, sig, offset, color, maxAmp) {
    var rowH = h / 3;
    var oy = rowIdx * rowH + rowH / 2;
    var amp = rowH * 0.35;

    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(40, oy); ctx.lineTo(w - 10, oy); ctx.stroke();
    PlotUtils.drawLabel(ctx, label, 5, rowIdx * rowH + 18, PlotUtils.COLORS.textMuted);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    for (var i = 0; i < sig.length; i++) {
      var n = offset + i;
      var x = nToX(n);
      var y = oy - (sig[i] / maxAmp) * amp;
      if (x < 40 || x > w - 10) continue;
      ctx.beginPath(); ctx.moveTo(x, oy); ctx.lineTo(x, y); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 3, 0, 2 * Math.PI); ctx.fill();
    }
  }

  function drawFlippedRow(rowIdx, label, sig, n, color, maxAmp) {
    var rowH = h / 3;
    var oy = rowIdx * rowH + rowH / 2;
    var amp = rowH * 0.35;

    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(40, oy); ctx.lineTo(w - 10, oy); ctx.stroke();
    PlotUtils.drawLabel(ctx, label, 5, rowIdx * rowH + 18, PlotUtils.COLORS.cyan);

    // h[n-k] means flip h and shift to position n
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    for (var k = 0; k < sig.length; k++) {
      var pos = n - k; // position of h[n-k] for this k
      var x = nToX(pos);
      var y = oy - (sig[k] / maxAmp) * amp;
      if (x < 40 || x > w - 10) continue;
      ctx.beginPath(); ctx.moveTo(x, oy); ctx.lineTo(x, y); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 3, 0, 2 * Math.PI); ctx.fill();
    }
  }

  function drawProducts(rowIdx, maxAmp) {
    var rowH = h / 3;
    var oy = rowIdx * rowH + rowH / 2;
    var amp = rowH * 0.35;

    // Highlight overlapping products
    for (var k = 0; k < xSignal.length; k++) {
      var hIdx = nShift - k;
      if (hIdx >= 0 && hIdx < hSignal.length) {
        var product = xSignal[k] * hSignal[hIdx];
        var x = nToX(k);
        if (x < 40 || x > w - 10) continue;
        ctx.fillStyle = 'rgba(255,202,40,0.3)';
        var barH = Math.abs(product / maxAmp) * amp;
        ctx.fillRect(x - 5, oy - (product > 0 ? barH : 0), 10, barH);
      }
    }
  }

  function drawOutputRow(rowIdx, label, output, maxAmp) {
    var rowH = h / 3;
    var oy = rowIdx * rowH + rowH / 2;
    var amp = rowH * 0.35;

    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(40, oy); ctx.lineTo(w - 10, oy); ctx.stroke();
    PlotUtils.drawLabel(ctx, label, 5, rowIdx * rowH + 18, PlotUtils.COLORS.textMuted);

    for (var i = 0; i < output.length; i++) {
      var x = nToX(i);
      var y = oy - (output[i] / maxAmp) * amp;
      if (x < 40 || x > w - 10) continue;

      var isComputed = i <= nShift;
      var isCurrent = i === nShift;

      ctx.strokeStyle = isCurrent ? PlotUtils.COLORS.amber : (isComputed ? PlotUtils.COLORS.green : PlotUtils.COLORS.textDim);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, oy); ctx.lineTo(x, y); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 3, 0, 2 * Math.PI); ctx.fill();
    }
  }

  function bindControls() {
    var nSlider = document.getElementById('convNSlider');
    if (nSlider) {
      nSlider.addEventListener('input', function () {
        nShift = parseInt(this.value, 10);
        document.getElementById('convNVal').textContent = 'n = ' + nShift;
        draw();
      });
    }
    var xPre = document.getElementById('convXPreset');
    if (xPre) xPre.addEventListener('change', function () { setSignal('x', this.value); draw(); });
    var hPre = document.getElementById('convHPreset');
    if (hPre) hPre.addEventListener('change', function () { setSignal('h', this.value); draw(); });

    var nextBtn = document.getElementById('convNext');
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        nShift++;
        if (nSlider) nSlider.value = nShift;
        document.getElementById('convNVal').textContent = 'n = ' + nShift;
        draw();
      });
    }
    var autoBtn = document.getElementById('convAuto');
    if (autoBtn) {
      autoBtn.addEventListener('click', function () {
        autoPlay = !autoPlay;
        this.textContent = autoPlay ? '⏸ Stop' : '▶ Auto-Play';
        if (autoPlay) runAuto();
      });
    }
    var resetBtn = document.getElementById('convReset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        nShift = -5;
        autoPlay = false;
        if (nSlider) nSlider.value = nShift;
        document.getElementById('convNVal').textContent = 'n = ' + nShift;
        document.getElementById('convAuto').textContent = '▶ Auto-Play';
        draw();
      });
    }
  }

  function runAuto() {
    if (!autoPlay) return;
    nShift++;
    if (nShift > nMax) { nShift = nMin; }
    var nSlider = document.getElementById('convNSlider');
    if (nSlider) nSlider.value = nShift;
    document.getElementById('convNVal').textContent = 'n = ' + nShift;
    draw();
    setTimeout(runAuto, 300);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
