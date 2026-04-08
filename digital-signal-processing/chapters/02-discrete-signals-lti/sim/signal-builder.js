/* ═══════════════════════════════════════════════════════
   Chapter 2 — SIM 2.1: Interactive Signal Builder
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var canvas, ctx, w, h;
  var signal = [];
  var nStart = -5, nEnd = 20;
  var selectedIdx = -1, dragging = false;

  function init() {
    canvas = document.getElementById('signalBuilderCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    // Initialize with impulse
    resetSignal('impulse');
    window.addEventListener('resize', function () { resize(); draw(); });
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    bindControls();
    draw();
  }

  function resize() {
    var wrap = canvas.parentElement;
    w = canvas.width = wrap.clientWidth || 600;
    h = canvas.height = 250;
  }

  function resetSignal(type) {
    var len = nEnd - nStart + 1;
    signal = new Array(len).fill(0);
    var zeroIdx = -nStart;
    switch (type) {
      case 'impulse':
        signal[zeroIdx] = 1;
        break;
      case 'step':
        for (var i = zeroIdx; i < len; i++) signal[i] = 1;
        break;
      case 'ramp':
        for (var j = zeroIdx; j < len; j++) signal[j] = j - zeroIdx;
        break;
      case 'exponential':
        for (var k = zeroIdx; k < len; k++) signal[k] = Math.pow(0.85, k - zeroIdx);
        break;
      default:
        signal[zeroIdx] = 1;
    }
  }

  function nToX(n) {
    var pad = 40;
    return pad + ((n - nStart) / (nEnd - nStart)) * (w - 2 * pad);
  }

  function valToY(v) {
    var maxVal = Math.max(1, Math.max.apply(null, signal.map(Math.abs)));
    var plotH = h - 60;
    var oy = h / 2;
    return oy - (v / maxVal) * (plotH / 2);
  }

  function xToN(x) {
    var pad = 40;
    return Math.round(nStart + ((x - pad) / (w - 2 * pad)) * (nEnd - nStart));
  }

  function yToVal(y) {
    var maxVal = Math.max(1, Math.max.apply(null, signal.map(Math.abs)));
    var plotH = h - 60;
    var oy = h / 2;
    return -(y - oy) / (plotH / 2) * maxVal;
  }

  function draw() {
    ctx.save();
    PlotUtils.clearCanvas(ctx, w, h);
    PlotUtils.drawGrid(ctx, w, h, nEnd - nStart, 6);

    var oy = h / 2;
    // x-axis
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(30, oy); ctx.lineTo(w - 10, oy); ctx.stroke();

    // n labels
    for (var n = nStart; n <= nEnd; n += 5) {
      var lx = nToX(n);
      PlotUtils.drawLabel(ctx, '' + n, lx - 6, oy + 18, PlotUtils.COLORS.textDim, '10px "JetBrains Mono", monospace');
    }

    // Draw stems
    for (var i = 0; i < signal.length; i++) {
      var n2 = nStart + i;
      var x = nToX(n2);
      var y = valToY(signal[i]);
      ctx.strokeStyle = i === selectedIdx ? PlotUtils.COLORS.amber : PlotUtils.COLORS.cyan;
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, oy); ctx.lineTo(x, y); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 4, 0, 2 * Math.PI); ctx.fill();
    }

    PlotUtils.drawLabel(ctx, 'x[n]', 5, 16, PlotUtils.COLORS.textMuted);
    PlotUtils.drawLabel(ctx, 'n', w - 20, oy + 18, PlotUtils.COLORS.textMuted);
    PlotUtils.drawScanlines(ctx, w, h);
    ctx.restore();
    updateReadouts();
  }

  function updateReadouts() {
    var E = 0, P = 0;
    for (var i = 0; i < signal.length; i++) {
      E += signal[i] * signal[i];
    }
    P = E / signal.length;

    var energyEl = document.getElementById('sigEnergy');
    if (energyEl) energyEl.textContent = E.toFixed(3);
    var powerEl = document.getElementById('sigPower');
    if (powerEl) powerEl.textContent = P.toFixed(4);

    // Check periodicity
    var periodic = false, period = 0;
    for (var N = 1; N <= signal.length / 2; N++) {
      var match = true;
      for (var k = 0; k + N < signal.length; k++) {
        if (Math.abs(signal[k] - signal[k + N]) > 0.001) { match = false; break; }
      }
      if (match) { periodic = true; period = N; break; }
    }
    var perEl = document.getElementById('sigPeriodicity');
    if (perEl) perEl.textContent = periodic ? 'PERIODIC (N=' + period + ')' : 'APERIODIC';
  }

  function onPointerDown(e) {
    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    // Find nearest stem
    for (var i = 0; i < signal.length; i++) {
      var x = nToX(nStart + i);
      if (Math.abs(mx - x) < 10) {
        selectedIdx = i;
        dragging = true;
        canvas.setPointerCapture(e.pointerId);
        break;
      }
    }
  }

  function onPointerMove(e) {
    if (!dragging || selectedIdx < 0) return;
    var rect = canvas.getBoundingClientRect();
    var my = e.clientY - rect.top;
    signal[selectedIdx] = yToVal(my);
    draw();
  }

  function onPointerUp() {
    dragging = false;
    selectedIdx = -1;
  }

  function bindControls() {
    var presetSelect = document.getElementById('signalPreset');
    if (presetSelect) {
      presetSelect.addEventListener('change', function () {
        resetSignal(this.value);
        draw();
      });
    }
    var copyBtn = document.getElementById('copySignal');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var obj = {};
        for (var i = 0; i < signal.length; i++) {
          obj[nStart + i] = parseFloat(signal[i].toFixed(4));
        }
        navigator.clipboard.writeText(JSON.stringify(signal.map(function(v){ return parseFloat(v.toFixed(4)); }))).catch(function(){});
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
