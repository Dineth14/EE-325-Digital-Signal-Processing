/* ═══════════════════════════════════════════════════════
   Chapter 4 — SIM 4.4: FFT Butterfly Visualizer
   Animated Cooley-Tukey radix-2 DIT butterfly diagram
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var canvas, ctx, w, h;
  var N = 8;
  var animStage = -1; // -1 = all stages shown
  var playing = false;

  function init() {
    canvas = document.getElementById('fftCanvas');
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

  function bitReverse(x, bits) {
    var r = 0;
    for (var i = 0; i < bits; i++) {
      r = (r << 1) | (x & 1);
      x >>= 1;
    }
    return r;
  }

  function draw() {
    ctx.save();
    PlotUtils.clearCanvas(ctx, w, h);

    var log2N = Math.log2(N);
    var stages = log2N;
    var pad = 60, pw = w - 2 * pad;
    var ph = h - 60;
    var colW = pw / (stages + 1);
    var rowH = ph / N;

    // Bit-reversed input order
    var brOrder = [];
    for (var i = 0; i < N; i++) brOrder.push(bitReverse(i, log2N));

    // Column labels
    ctx.fillStyle = PlotUtils.COLORS.textMuted;
    ctx.font = '11px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText('Input (bit-rev)', pad + colW * 0.5, 20);
    for (var s = 0; s < stages; s++) {
      ctx.fillText('Stage ' + (s + 1), pad + colW * (s + 1.5), 20);
    }

    // Draw nodes
    for (var col = 0; col <= stages; col++) {
      for (var row = 0; row < N; row++) {
        var x = pad + colW * (col + 0.5);
        var y = 35 + row * rowH + rowH / 2;
        var isActive = animStage === -1 || col <= animStage;

        ctx.fillStyle = isActive ? PlotUtils.COLORS.cyan : PlotUtils.COLORS.textDim;
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();

        // Label on first column
        if (col === 0) {
          ctx.fillStyle = PlotUtils.COLORS.textMuted;
          ctx.font = '10px JetBrains Mono';
          ctx.textAlign = 'right';
          ctx.fillText('x[' + brOrder[row] + ']', x - 12, y + 4);
        }
        // Label on last column
        if (col === stages) {
          ctx.fillStyle = PlotUtils.COLORS.textMuted;
          ctx.font = '10px JetBrains Mono';
          ctx.textAlign = 'left';
          ctx.fillText('X[' + row + ']', x + 12, y + 4);
        }
      }
    }

    // Draw butterfly connections
    for (var stage = 0; stage < stages; stage++) {
      var halfSize = 1 << stage;
      var fullSize = halfSize << 1;
      var isActStage = animStage === -1 || stage <= animStage;

      for (var group = 0; group < N; group += fullSize) {
        for (var pair = 0; pair < halfSize; pair++) {
          var top = group + pair;
          var bot = top + halfSize;
          var x1 = pad + colW * (stage + 0.5);
          var x2 = pad + colW * (stage + 1.5);
          var y1 = 35 + top * rowH + rowH / 2;
          var y2 = 35 + bot * rowH + rowH / 2;

          if (isActStage) {
            // Top line (straight)
            ctx.strokeStyle = PlotUtils.COLORS.cyan;
            ctx.lineWidth = 1;
            ctx.globalAlpha = stage === animStage ? 1 : 0.4;
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y1); ctx.stroke();

            // Cross lines
            ctx.strokeStyle = PlotUtils.COLORS.green;
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

            ctx.strokeStyle = PlotUtils.COLORS.amber;
            ctx.beginPath(); ctx.moveTo(x1, y2); ctx.lineTo(x2, y1); ctx.stroke();

            ctx.strokeStyle = PlotUtils.COLORS.violet;
            ctx.beginPath(); ctx.moveTo(x1, y2); ctx.lineTo(x2, y2); ctx.stroke();

            // Twiddle factor label
            var tw = pair;
            if (tw > 0 && stage === animStage) {
              ctx.fillStyle = PlotUtils.COLORS.amber;
              ctx.font = '9px JetBrains Mono';
              ctx.textAlign = 'center';
              ctx.fillText('W' + N + '^' + tw, (x1 + x2) / 2, (y1 + y2) / 2 - 3);
            }
            ctx.globalAlpha = 1;
          }
        }
      }
    }

    // Complexity info
    ctx.fillStyle = PlotUtils.COLORS.textMuted;
    ctx.font = '12px Inter';
    ctx.textAlign = 'left';
    ctx.fillText('N = ' + N + '  |  Stages: ' + stages + '  |  Butterflies: ' + (N / 2 * stages), pad, h - 10);
    ctx.fillText('O(N log N) = ' + (N * stages) + '  vs  O(N²) = ' + (N * N), pad + 300, h - 10);

    PlotUtils.drawScanlines(ctx, w, h);
    ctx.restore();
  }

  function bindControls() {
    var nEl = document.getElementById('fftN');
    var stageBtn = document.getElementById('fftStage');
    var allBtn = document.getElementById('fftAll');
    var autoBtn = document.getElementById('fftAuto');

    if (nEl) nEl.addEventListener('change', function () {
      N = parseInt(this.value, 10);
      animStage = -1;
      draw();
    });
    if (stageBtn) stageBtn.addEventListener('click', function () {
      var maxStage = Math.log2(N) - 1;
      animStage = Math.min(animStage + 1, maxStage);
      draw();
    });
    if (allBtn) allBtn.addEventListener('click', function () {
      animStage = -1;
      draw();
    });
    if (autoBtn) autoBtn.addEventListener('click', function () {
      if (playing) return;
      playing = true;
      animStage = -1;
      var maxStage = Math.log2(N) - 1;
      var cur = 0;
      function step() {
        animStage = cur;
        draw();
        cur++;
        if (cur <= maxStage) {
          setTimeout(step, 800);
        } else {
          playing = false;
          setTimeout(function () { animStage = -1; draw(); }, 800);
        }
      }
      setTimeout(step, 200);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
