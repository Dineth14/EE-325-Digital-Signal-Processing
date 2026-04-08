/* ═══════════════════════════════════════════════════════
   Chapter 1 — SIM 1.2: Aliasing Frequency Explorer
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var canvas, ctx, w, h;
  var fs = 50;
  var tones = [{ freq: 10, amp: 1 }, { freq: 22, amp: 0.7 }, { freq: 35, amp: 0.5 }];
  var animId;

  function init() {
    canvas = document.getElementById('aliasingCanvas');
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
    h = canvas.height = 300;
  }

  function draw() {
    ctx.save();
    PlotUtils.clearCanvas(ctx, w, h);
    var leftW = w * 0.48, rightW = w * 0.48, gap = w * 0.04;
    var pad = 40, plotH = h - 80;
    var maxFreq = 100;

    // Left: original spectrum
    PlotUtils.drawLabel(ctx, 'Original Spectrum', pad, 16, PlotUtils.COLORS.textMuted);
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad, h - 40); ctx.lineTo(pad + leftW - 20, h - 40); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, h - 40); ctx.lineTo(pad, 30); ctx.stroke();
    PlotUtils.drawLabel(ctx, 'f (Hz)', pad + leftW - 50, h - 20, PlotUtils.COLORS.textDim);

    tones.forEach(function (tone) {
      var x = pad + (tone.freq / maxFreq) * (leftW - 30);
      var barH = tone.amp * plotH * 0.8;
      ctx.strokeStyle = PlotUtils.COLORS.green;
      ctx.fillStyle = PlotUtils.COLORS.green;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, h - 40); ctx.lineTo(x, h - 40 - barH); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, h - 40 - barH, 4, 0, 2 * Math.PI); ctx.fill();
      PlotUtils.drawLabel(ctx, tone.freq + 'Hz', x - 12, h - 25, PlotUtils.COLORS.textDim, '9px "JetBrains Mono", monospace');
    });

    // Right: sampled spectrum with replicas
    var rx0 = pad + leftW + gap;
    PlotUtils.drawLabel(ctx, 'Sampled Spectrum (fs=' + fs + 'Hz)', rx0, 16, PlotUtils.COLORS.textMuted);
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(rx0, h - 40); ctx.lineTo(rx0 + rightW - 20, h - 40); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(rx0, h - 40); ctx.lineTo(rx0, 30); ctx.stroke();

    // Reconstruction window (LPF band)
    var lpfW = (fs / 2 / maxFreq) * (rightW - 30);
    ctx.fillStyle = 'rgba(0, 229, 255, 0.06)';
    ctx.fillRect(rx0, 30, lpfW, plotH);
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(rx0 + lpfW, 30); ctx.lineTo(rx0 + lpfW, h - 40); ctx.stroke();
    ctx.setLineDash([]);
    PlotUtils.drawLabel(ctx, 'fs/2', rx0 + lpfW - 10, h - 25, PlotUtils.COLORS.cyan, '9px "JetBrains Mono", monospace');

    // Draw replicas
    for (var rep = -2; rep <= 2; rep++) {
      tones.forEach(function (tone) {
        var aliasedF = tone.freq + rep * fs;
        if (aliasedF < 0) aliasedF = -aliasedF;
        if (aliasedF > maxFreq) return;

        var x = rx0 + (aliasedF / maxFreq) * (rightW - 30);
        var barH = tone.amp * plotH * 0.8;
        var isAliased = aliasedF < fs / 2 && rep !== 0;
        var color = isAliased ? PlotUtils.COLORS.red : (rep === 0 ? PlotUtils.COLORS.cyan : PlotUtils.COLORS.violet);

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = rep === 0 ? 1 : 0.6;
        ctx.beginPath(); ctx.moveTo(x, h - 40); ctx.lineTo(x, h - 40 - barH); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, h - 40 - barH, 3, 0, 2 * Math.PI); ctx.fill();

        if (isAliased) {
          ctx.fillStyle = 'rgba(255,82,82,0.15)';
          ctx.fillRect(x - 8, h - 40 - barH - 5, 16, barH + 5);
        }
        ctx.globalAlpha = 1;
      });
    }

    PlotUtils.drawScanlines(ctx, w, h);
    ctx.restore();
  }

  function bindControls() {
    var fsSlider = document.getElementById('aliasFsSlider');
    if (fsSlider) {
      fsSlider.addEventListener('input', function () {
        fs = parseFloat(this.value);
        document.getElementById('aliasFsVal').textContent = fs + ' Hz';
        draw();
      });
    }
    for (var i = 0; i < 3; i++) {
      (function (idx) {
        var fSlider = document.getElementById('toneFreq' + idx);
        var aSlider = document.getElementById('toneAmp' + idx);
        if (fSlider) {
          fSlider.addEventListener('input', function () {
            tones[idx].freq = parseFloat(this.value);
            document.getElementById('toneFreqVal' + idx).textContent = tones[idx].freq + ' Hz';
            draw();
          });
        }
        if (aSlider) {
          aSlider.addEventListener('input', function () {
            tones[idx].amp = parseFloat(this.value);
            draw();
          });
        }
      })(i);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
