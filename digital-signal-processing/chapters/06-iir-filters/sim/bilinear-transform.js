/* ═══════════════════════════════════════════════════════
   Chapter 6 — SIM 6.2: Bilinear Transform Visualizer
   Show mapping from s-plane to z-plane
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var canvas, ctx, w, h;
  var Fs = 2; // sampling rate for bilinear
  var probeS_re = -0.5, probeS_im = 1;

  function init() {
    canvas = document.getElementById('bilinCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', function () { resize(); draw(); });
    canvas.addEventListener('pointermove', onMove);
    bindControls();
    draw();
  }

  function resize() {
    var wrap = canvas.parentElement;
    w = canvas.width = wrap.clientWidth || 700;
    h = canvas.height = 380;
  }

  function bilinearMap(s_re, s_im) {
    // z = (1 + s/T) / (1 - s/T) where T = 2*Fs
    var T = 2 * Fs;
    var num_re = 1 + s_re / T;
    var num_im = s_im / T;
    var den_re = 1 - s_re / T;
    var den_im = -s_im / T;
    var den_mag2 = den_re * den_re + den_im * den_im;
    if (den_mag2 < 1e-20) return { re: 10, im: 0 };
    return {
      re: (num_re * den_re + num_im * den_im) / den_mag2,
      im: (num_im * den_re - num_re * den_im) / den_mag2
    };
  }

  function draw() {
    ctx.save();
    PlotUtils.clearCanvas(ctx, w, h);

    var halfW = w * 0.45;
    var padX = 40, padY = 40;

    // ─── LEFT: s-plane ───
    var sCx = padX + halfW * 0.5, sCy = h * 0.5;
    var sR = Math.min(halfW - padX, h - 2 * padY) * 0.4;

    PlotUtils.drawLabel(ctx, 's-plane (analog)', padX, 20, PlotUtils.COLORS.textMuted);

    // Axes
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(padX, sCy); ctx.lineTo(padX + halfW - 20, sCy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sCx, padY); ctx.lineTo(sCx, h - padY); ctx.stroke();

    // jω axis highlight (imaginary axis)
    ctx.strokeStyle = 'rgba(0,229,255,0.2)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(sCx, padY); ctx.lineTo(sCx, h - padY); ctx.stroke();

    // Left half-plane shading (stable region)
    ctx.fillStyle = 'rgba(105,255,71,0.03)';
    ctx.fillRect(padX, padY, sCx - padX, h - 2 * padY);

    // Grid lines in s-plane
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 0.5;
    for (var g = -3; g <= 3; g++) {
      var gx = sCx + g * sR * 0.5;
      ctx.beginPath(); ctx.moveTo(gx, padY); ctx.lineTo(gx, h - padY); ctx.stroke();
      var gy = sCy + g * sR * 0.5;
      ctx.beginPath(); ctx.moveTo(padX, gy); ctx.lineTo(padX + halfW - 20, gy); ctx.stroke();
    }

    // Probe point on s-plane
    var pSx = sCx + probeS_re * sR * 0.5;
    var pSy = sCy - probeS_im * sR * 0.5;
    ctx.fillStyle = PlotUtils.COLORS.amber;
    ctx.beginPath(); ctx.arc(pSx, pSy, 5, 0, Math.PI * 2); ctx.fill();

    // Labels
    ctx.fillStyle = PlotUtils.COLORS.textDim;
    ctx.font = '10px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText('σ', padX + halfW - 25, sCy - 8);
    ctx.fillText('jω', sCx + 12, padY + 5);

    // ─── RIGHT: z-plane ───
    var zOx = w * 0.55, zW = w * 0.42;
    var zCx = zOx + zW * 0.5, zCy = h * 0.5;
    var zR = Math.min(zW, h - 2 * padY) * 0.35;

    PlotUtils.drawLabel(ctx, 'z-plane (digital)', zOx, 20, PlotUtils.COLORS.textMuted);

    // Unit circle
    ctx.strokeStyle = PlotUtils.COLORS.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(zCx, zCy, zR, 0, Math.PI * 2); ctx.stroke();

    // Axes
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(zOx, zCy); ctx.lineTo(zOx + zW, zCy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(zCx, padY); ctx.lineTo(zCx, h - padY); ctx.stroke();

    // Map several s-plane points to z-plane to show mapping
    ctx.strokeStyle = 'rgba(0,229,255,0.15)';
    ctx.lineWidth = 1;
    // Map jω axis → unit circle
    for (var omega = -4; omega <= 4; omega += 0.1) {
      var z = bilinearMap(0, omega);
      var zx = zCx + z.re * zR, zy = zCy - z.im * zR;
      ctx.fillStyle = 'rgba(0,229,255,0.15)';
      ctx.fillRect(zx - 1, zy - 1, 2, 2);
    }

    // Map left half-plane grid
    for (var sig = -3; sig <= 0; sig += 0.5) {
      for (var om = -3; om <= 3; om += 0.3) {
        var zm = bilinearMap(sig, om);
        var zmx = zCx + zm.re * zR, zmy = zCy - zm.im * zR;
        if (zmx > zOx && zmx < zOx + zW && zmy > padY && zmy < h - padY) {
          ctx.fillStyle = 'rgba(105,255,71,0.06)';
          ctx.fillRect(zmx - 1, zmy - 1, 3, 3);
        }
      }
    }

    // Mapped probe point
    var zProbe = bilinearMap(probeS_re, probeS_im);
    var zpx = zCx + zProbe.re * zR, zpy = zCy - zProbe.im * zR;
    ctx.fillStyle = PlotUtils.COLORS.amber;
    ctx.beginPath(); ctx.arc(zpx, zpy, 5, 0, Math.PI * 2); ctx.fill();

    // Connecting line
    ctx.strokeStyle = 'rgba(255,202,40,0.3)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(pSx, pSy); ctx.lineTo(zpx, zpy); ctx.stroke();
    ctx.setLineDash([]);

    // Info
    var infoY = h - 50;
    ctx.fillStyle = PlotUtils.COLORS.textPrimary;
    ctx.font = '12px JetBrains Mono';
    ctx.textAlign = 'left';
    ctx.fillText('s = ' + probeS_re.toFixed(2) + (probeS_im >= 0 ? '+' : '') + probeS_im.toFixed(2) + 'j', padX, infoY);
    ctx.fillText('→ z = ' + zProbe.re.toFixed(3) + (zProbe.im >= 0 ? '+' : '') + zProbe.im.toFixed(3) + 'j', padX, infoY + 18);
    var zMag = Math.sqrt(zProbe.re * zProbe.re + zProbe.im * zProbe.im);
    ctx.fillStyle = zMag < 1 ? PlotUtils.COLORS.green : (zMag > 1 ? '#ff4444' : PlotUtils.COLORS.amber);
    ctx.fillText('|z| = ' + zMag.toFixed(3) + (zMag < 1 ? ' (inside UC → stable)' : zMag > 1 ? ' (outside UC → unstable)' : ' (on UC)'), padX + 300, infoY + 18);

    PlotUtils.drawScanlines(ctx, w, h);
    ctx.restore();
  }

  function onMove(e) {
    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    // Only respond to left half (s-plane)
    if (mx < w * 0.48) {
      var halfW = w * 0.45;
      var sCx = 40 + halfW * 0.5, sCy = h * 0.5;
      var sR = Math.min(halfW - 40, h - 80) * 0.4;
      probeS_re = ((mx - sCx) / (sR * 0.5));
      probeS_im = -((my - sCy) / (sR * 0.5));
      draw();
    }
  }

  function bindControls() {
    var fsEl = document.getElementById('bilinFs');
    if (fsEl) fsEl.addEventListener('input', function () {
      Fs = parseFloat(this.value);
      document.getElementById('bilinFsVal').textContent = Fs.toFixed(1);
      draw();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
