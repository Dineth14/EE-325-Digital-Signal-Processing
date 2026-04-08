/* ═══════════════════════════════════════════════════════
   Chapter 3 — SIM 3.2: Z-Plane Explorer
   Evaluate H(z) at any point on the complex z-plane
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var canvas, ctx, w, h;
  var probeRe = 1, probeIm = 0;
  var bCoeffs = [1, -1]; // numerator polynomial
  var aCoeffs = [1, -0.5]; // denominator polynomial
  var cx, cy, R;

  function init() {
    canvas = document.getElementById('zplaneCanvas');
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
    w = canvas.width = wrap.clientWidth || 650;
    h = canvas.height = 380;
    R = Math.min(w * 0.5, h) * 0.35;
    cx = w * 0.35;
    cy = h * 0.5;
  }

  function toCanvas(re, im) {
    return { x: cx + re * R, y: cy - im * R };
  }
  function fromCanvas(x, y) {
    return { re: (x - cx) / R, im: -(y - cy) / R };
  }

  function evalPoly(coeffs, z_re, z_im) {
    // Evaluate polynomial: coeffs[0] + coeffs[1]*z^-1 + coeffs[2]*z^-2 + ...
    // But we evaluate as sum c_k * z^(-k) = sum c_k / z^k
    var re = 0, im = 0;
    var zinv_re = 1, zinv_im = 0; // z^0 = 1
    var mag2 = z_re * z_re + z_im * z_im;
    if (mag2 < 1e-20) return { re: coeffs[0] || 0, im: 0 };
    var zi_re = z_re / mag2, zi_im = -z_im / mag2; // 1/z

    for (var k = 0; k < coeffs.length; k++) {
      re += coeffs[k] * zinv_re;
      im += coeffs[k] * zinv_im;
      // multiply zinv by zi: zinv *= (1/z)
      var tr = zinv_re * zi_re - zinv_im * zi_im;
      var ti = zinv_re * zi_im + zinv_im * zi_re;
      zinv_re = tr; zinv_im = ti;
    }
    return { re: re, im: im };
  }

  function draw() {
    ctx.save();
    PlotUtils.clearCanvas(ctx, w, h);

    // Magnitude surface as color map
    var step = 4;
    for (var px = 0; px < w * 0.65; px += step) {
      for (var py = 0; py < h; py += step) {
        var c = fromCanvas(px, py);
        var num = evalPoly(bCoeffs, c.re, c.im);
        var den = evalPoly(aCoeffs, c.re, c.im);
        var denMag = Math.sqrt(den.re * den.re + den.im * den.im);
        var numMag = Math.sqrt(num.re * num.re + num.im * num.im);
        var mag = denMag > 1e-8 ? numMag / denMag : 100;
        var logMag = Math.log10(mag + 0.001);
        var t = Math.max(0, Math.min(1, (logMag + 1) / 3));
        ctx.fillStyle = 'rgba(0,229,255,' + (t * 0.15).toFixed(3) + ')';
        ctx.fillRect(px, py, step, step);
      }
    }

    // Unit circle
    ctx.strokeStyle = PlotUtils.COLORS.border;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI); ctx.stroke();
    ctx.setLineDash([]);

    // Axes
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(cx - R * 1.6, cy); ctx.lineTo(cx + R * 1.6, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - R * 1.6); ctx.lineTo(cx, cy + R * 1.6); ctx.stroke();

    // Probe point
    var pp = toCanvas(probeRe, probeIm);
    ctx.fillStyle = PlotUtils.COLORS.amber;
    ctx.beginPath(); ctx.arc(pp.x, pp.y, 5, 0, 2 * Math.PI); ctx.fill();

    // Compute H(z) at probe point
    var num = evalPoly(bCoeffs, probeRe, probeIm);
    var den = evalPoly(aCoeffs, probeRe, probeIm);
    var denMag = Math.sqrt(den.re * den.re + den.im * den.im);
    var hz_re, hz_im;
    if (denMag > 1e-10) {
      hz_re = (num.re * den.re + num.im * den.im) / (denMag * denMag);
      hz_im = (num.im * den.re - num.re * den.im) / (denMag * denMag);
    } else {
      hz_re = Infinity; hz_im = 0;
    }
    var hzMag = Math.sqrt(hz_re * hz_re + hz_im * hz_im);
    var hzPhase = Math.atan2(hz_im, hz_re);

    // Info panel on right
    var infoX = w * 0.68;
    ctx.fillStyle = PlotUtils.COLORS.textPrimary;
    ctx.font = '13px JetBrains Mono';
    ctx.textAlign = 'left';
    ctx.fillText('z = ' + probeRe.toFixed(2) + (probeIm >= 0 ? ' + ' : ' − ') + Math.abs(probeIm).toFixed(2) + 'j', infoX, 40);
    ctx.fillText('|z| = ' + Math.sqrt(probeRe * probeRe + probeIm * probeIm).toFixed(3), infoX, 65);
    ctx.fillText('∠z = ' + (Math.atan2(probeIm, probeRe) * 180 / Math.PI).toFixed(1) + '°', infoX, 90);
    ctx.fillStyle = PlotUtils.COLORS.cyan;
    ctx.fillText('H(z):', infoX, 130);
    ctx.fillStyle = PlotUtils.COLORS.textPrimary;
    ctx.fillText('  Re = ' + (isFinite(hz_re) ? hz_re.toFixed(4) : '∞'), infoX, 155);
    ctx.fillText('  Im = ' + (isFinite(hz_im) ? hz_im.toFixed(4) : '—'), infoX, 175);
    ctx.fillText('  |H| = ' + (isFinite(hzMag) ? hzMag.toFixed(4) : '∞'), infoX, 195);
    ctx.fillText('  ∠H = ' + (isFinite(hzPhase) ? (hzPhase * 180 / Math.PI).toFixed(1) + '°' : '—'), infoX, 215);

    // ROC indicator
    var probeR = Math.sqrt(probeRe * probeRe + probeIm * probeIm);
    var maxPoleR = 0;
    var pRoots = DSP.polyRoots ? DSP.polyRoots(aCoeffs) : [];
    pRoots.forEach(function (p) {
      var r = Math.sqrt(p.re * p.re + p.im * p.im);
      if (r > maxPoleR) maxPoleR = r;
    });
    ctx.fillStyle = probeR > maxPoleR ? PlotUtils.COLORS.green : '#ff4444';
    ctx.fillText(probeR > maxPoleR ? '✓ Inside ROC (causal)' : '✗ Outside ROC', infoX, 250);

    PlotUtils.drawScanlines(ctx, w, h);
    ctx.restore();
  }

  function onMove(e) {
    var rect = canvas.getBoundingClientRect();
    var c = fromCanvas(e.clientX - rect.left, e.clientY - rect.top);
    probeRe = Math.round(c.re * 100) / 100;
    probeIm = Math.round(c.im * 100) / 100;
    draw();
  }

  function bindControls() {
    var bInput = document.getElementById('zpB');
    var aInput = document.getElementById('zpA');
    function parse(str) {
      return str.split(',').map(function (s) { return parseFloat(s.trim()) || 0; });
    }
    if (bInput) bInput.addEventListener('change', function () { bCoeffs = parse(this.value); draw(); });
    if (aInput) aInput.addEventListener('change', function () { aCoeffs = parse(this.value); draw(); });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
