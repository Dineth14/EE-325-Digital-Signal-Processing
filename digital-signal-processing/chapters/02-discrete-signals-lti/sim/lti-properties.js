/* ═══════════════════════════════════════════════════════
   Chapter 2 — SIM 2.3: LTI Properties Tester
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var canvas, ctx, w, h;
  var testType = 'linearity'; // 'linearity' | 'timeinvariance'
  var systemType = 'ma3';     // 'ma3' | 'echo' | 'square' | 'median'
  var alpha = 1.5, delay = 3;
  var N = 40;

  function init() {
    canvas = document.getElementById('ltiCanvas');
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

  // System definitions
  function applySystem(x) {
    var y = new Array(x.length);
    var i;
    switch (systemType) {
      case 'ma3': // 3-point moving average — LTI
        for (i = 0; i < x.length; i++) {
          y[i] = ((x[i] || 0) + (x[i - 1] || 0) + (x[i - 2] || 0)) / 3;
        }
        break;
      case 'echo': // y[n] = x[n] + 0.5*x[n-4] — LTI
        for (i = 0; i < x.length; i++) {
          y[i] = (x[i] || 0) + 0.5 * (x[i - 4] || 0);
        }
        break;
      case 'square': // y[n] = x[n]^2 — NOT linear
        for (i = 0; i < x.length; i++) {
          y[i] = x[i] * x[i];
        }
        break;
      case 'median': // 3-point median filter — NOT linear
        for (i = 0; i < x.length; i++) {
          var arr = [x[i - 1] || 0, x[i] || 0, x[i + 1] || 0].sort(function (a, b) { return a - b; });
          y[i] = arr[1];
        }
        break;
      default:
        for (i = 0; i < x.length; i++) y[i] = x[i];
    }
    return y;
  }

  function makeTestSignal1() {
    var s = new Array(N);
    for (var i = 0; i < N; i++) {
      s[i] = i >= 5 && i <= 10 ? 1 : 0;
    }
    return s;
  }
  function makeTestSignal2() {
    var s = new Array(N);
    for (var i = 0; i < N; i++) {
      s[i] = i === 8 ? 2 : (i >= 12 && i <= 18 ? 0.5 * Math.sin(0.5 * (i - 12)) : 0);
    }
    return s;
  }

  function shiftSignal(x, d) {
    var y = new Array(x.length);
    for (var i = 0; i < x.length; i++) {
      y[i] = (i - d >= 0 && i - d < x.length) ? x[i - d] : 0;
    }
    return y;
  }

  function scaleAndAdd(a, x1, b, x2) {
    var y = new Array(x1.length);
    for (var i = 0; i < x1.length; i++) {
      y[i] = a * (x1[i] || 0) + b * (x2[i] || 0);
    }
    return y;
  }

  function maxAbs(arr) {
    var m = 0;
    for (var i = 0; i < arr.length; i++) m = Math.max(m, Math.abs(arr[i]));
    return m || 1;
  }

  function draw() {
    ctx.save();
    PlotUtils.clearCanvas(ctx, w, h);
    if (testType === 'linearity') drawLinearityTest();
    else drawTimeInvarianceTest();
    PlotUtils.drawScanlines(ctx, w, h);
    ctx.restore();
    updateVerdict();
  }

  function drawLinearityTest() {
    // Test: T{α·x1 + β·x2} == α·T{x1} + β·T{x2}
    var x1 = makeTestSignal1();
    var x2 = makeTestSignal2();
    var combined = scaleAndAdd(alpha, x1, 1, x2);
    var lhs = applySystem(combined);           // T{α·x1 + x2}
    var tx1 = applySystem(x1);
    var tx2 = applySystem(x2);
    var rhs = scaleAndAdd(alpha, tx1, 1, tx2); // α·T{x1} + T{x2}

    var allMax = Math.max(maxAbs(lhs), maxAbs(rhs), maxAbs(x1), maxAbs(x2));
    var rowH = h / 4;

    drawStemRow(0, 'x₁[n]', x1, PlotUtils.COLORS.cyan, allMax);
    drawStemRow(1, 'x₂[n]', x2, PlotUtils.COLORS.green, allMax);
    drawStemRow(2, 'T{αx₁+x₂} (LHS)', lhs, PlotUtils.COLORS.amber, allMax);
    drawStemRow(3, 'αT{x₁}+T{x₂} (RHS)', rhs, PlotUtils.COLORS.violet, allMax);

    // Draw difference indicator
    var err = 0;
    for (var i = 0; i < lhs.length; i++) err += Math.abs(lhs[i] - rhs[i]);
    var col = err < 0.001 ? PlotUtils.COLORS.green : '#ff4444';
    ctx.fillStyle = col;
    ctx.font = '13px Inter';
    ctx.textAlign = 'right';
    ctx.fillText('Error: ' + err.toFixed(4), w - 15, h - 8);
  }

  function drawTimeInvarianceTest() {
    // Test: T{x[n-d]} == y[n-d] where y=T{x}
    var x = makeTestSignal1();
    var xDelayed = shiftSignal(x, delay);
    var lhs = applySystem(xDelayed);                // T{x[n-d]}
    var y = applySystem(x);
    var rhs = shiftSignal(y, delay);                // y[n-d]

    var allMax = Math.max(maxAbs(lhs), maxAbs(rhs), maxAbs(x), maxAbs(xDelayed));
    var rowH = h / 4;

    drawStemRow(0, 'x[n]', x, PlotUtils.COLORS.cyan, allMax);
    drawStemRow(1, 'x[n−' + delay + ']', xDelayed, PlotUtils.COLORS.green, allMax);
    drawStemRow(2, 'T{x[n−' + delay + ']} (LHS)', lhs, PlotUtils.COLORS.amber, allMax);
    drawStemRow(3, 'T{x}[n−' + delay + '] (RHS)', rhs, PlotUtils.COLORS.violet, allMax);

    var err = 0;
    for (var i = 0; i < lhs.length; i++) err += Math.abs(lhs[i] - rhs[i]);
    var col = err < 0.001 ? PlotUtils.COLORS.green : '#ff4444';
    ctx.fillStyle = col;
    ctx.font = '13px Inter';
    ctx.textAlign = 'right';
    ctx.fillText('Error: ' + err.toFixed(4), w - 15, h - 8);
  }

  function drawStemRow(rowIdx, label, sig, color, maxAmp) {
    var rowH = h / 4;
    var oy = rowIdx * rowH + rowH / 2;
    var amp = rowH * 0.35;
    var pad = 50;

    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(pad, oy); ctx.lineTo(w - 10, oy); ctx.stroke();
    PlotUtils.drawLabel(ctx, label, 5, rowIdx * rowH + 16, PlotUtils.COLORS.textMuted);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.5;
    for (var i = 0; i < sig.length; i++) {
      var x = pad + (i / (N - 1)) * (w - pad - 20);
      var y = oy - (sig[i] / maxAmp) * amp;
      ctx.beginPath(); ctx.moveTo(x, oy); ctx.lineTo(x, y); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 2.5, 0, 2 * Math.PI); ctx.fill();
    }
  }

  function updateVerdict() {
    var verdictEl = document.getElementById('ltiVerdict');
    if (!verdictEl) return;
    var islinear = (systemType === 'ma3' || systemType === 'echo');
    if (testType === 'linearity') {
      verdictEl.textContent = islinear
        ? '✓ System is LINEAR — superposition holds'
        : '✗ System is NOT linear — LHS ≠ RHS';
      verdictEl.style.color = islinear ? PlotUtils.COLORS.green : '#ff4444';
    } else {
      verdictEl.textContent = islinear
        ? '✓ System is TIME-INVARIANT — shifting commutes'
        : '✗ System is NOT time-invariant — shifting does not commute';
      verdictEl.style.color = islinear ? PlotUtils.COLORS.green : '#ff4444';
    }
  }

  function bindControls() {
    var sysEl = document.getElementById('ltiSystem');
    if (sysEl) sysEl.addEventListener('change', function () { systemType = this.value; draw(); });
    var testEl = document.getElementById('ltiTest');
    if (testEl) testEl.addEventListener('change', function () { testType = this.value; draw(); });
    var alphaEl = document.getElementById('ltiAlpha');
    if (alphaEl) alphaEl.addEventListener('input', function () {
      alpha = parseFloat(this.value);
      document.getElementById('ltiAlphaVal').textContent = 'α = ' + alpha.toFixed(1);
      draw();
    });
    var delayEl = document.getElementById('ltiDelay');
    if (delayEl) delayEl.addEventListener('input', function () {
      delay = parseInt(this.value, 10);
      document.getElementById('ltiDelayVal').textContent = 'd = ' + delay;
      draw();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
