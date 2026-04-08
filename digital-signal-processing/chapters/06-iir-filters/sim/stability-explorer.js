/* ═══════════════════════════════════════════════════════
   Chapter 6 — SIM 6.3: Stability Explorer
   Interactive pole placement with stability analysis
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var canvas, ctx, w, h;
  var poles = [{ re: 0.5, im: 0.3 }, { re: 0.5, im: -0.3 }]; // conjugate pair
  var zeros = [{ re: -1, im: 0 }];
  var dragIdx = -1, dragType = ''; // 'pole' or 'zero'
  var zCx, zCy, zR;

  function init() {
    canvas = document.getElementById('stabilityCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', function () { resize(); draw(); });
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMoveEvt);
    canvas.addEventListener('pointerup', onUp);
    bindControls();
    draw();
  }

  function resize() {
    var wrap = canvas.parentElement;
    w = canvas.width = wrap.clientWidth || 700;
    h = canvas.height = 400;
    zCx = 170; zCy = h * 0.5;
    zR = Math.min(140, (h - 80) * 0.42);
  }

  function maxPoleMag() {
    var m = 0;
    for (var i = 0; i < poles.length; i++) {
      var r = Math.sqrt(poles[i].re * poles[i].re + poles[i].im * poles[i].im);
      if (r > m) m = r;
    }
    return m;
  }

  function computeImpulse(N) {
    // Build H(z) numerator/denominator from poles and zeros, compute h[n] via recursion
    // a = denominator coefficients from poles, b = numerator from zeros
    var a = [1], b = [1];
    for (var i = 0; i < poles.length; i++) {
      a = polyMul(a, [-poles[i].re - (poles[i].im ? 0 : 0), 1]);
      // Proper complex polynomial: (z - p)
      a = polyMulComplex(a, poles[i]);
    }
    // Rebuild a properly
    a = [1];
    for (var i = 0; i < poles.length; i++) {
      a = convolve(a, [1, -poles[i].re, -(poles[i].im !== 0 ? 0 : 0)]);
    }
    // Better approach: direct recursion from transfer function 
    // H(z) = B(z)/A(z), compute y[n] = x[n]*b[0] + ... - a[1]*y[n-1] - ...
    // For impulse response, x[n] = delta[n]
    
    // Build denominator polynomial from poles
    var den = realPolyFromRoots(poles);
    var num = realPolyFromRoots(zeros);

    var result = new Float64Array(N);
    var yBuf = new Float64Array(N);
    for (var n = 0; n < N; n++) {
      var x = (n < num.length) ? num[n] : 0; // impulse convolved with numerator = numerator coeffs
      if (n === 0) x = num[0];
      else if (n < num.length) x = num[n];
      else x = 0;
      
      var sum = x;
      for (var k = 1; k < den.length; k++) {
        if (n - k >= 0) sum -= den[k] * yBuf[n - k];
      }
      yBuf[n] = sum;
      result[n] = sum;
    }
    return result;
  }

  function realPolyFromRoots(roots) {
    // Compute real polynomial coefficients from complex roots
    // Returns array [1, c1, c2, ...] so poly = z^n + c1*z^(n-1) + ...
    var p = [1];
    for (var i = 0; i < roots.length; i++) {
      var r = roots[i];
      // (z - r): coefficients [1, -re - j*im]
      // For real output, handle conjugate pairs
      var newP = new Array(p.length + 1).fill(0);
      for (var k = 0; k < p.length; k++) {
        newP[k] += p[k];
        newP[k + 1] -= p[k] * r.re;
      }
      // If root has imaginary part, we're computing with complex coeffs
      // But we'll handle this by only using real arithmetic for conjugate pairs
      p = newP;
    }
    // Ensure real
    for (var i = 0; i < p.length; i++) p[i] = Math.round(p[i] * 1e10) / 1e10;
    return p;
  }

  // Simple convolution for polynomial multiplication
  function convolve(a, b) {
    var out = new Array(a.length + b.length - 1).fill(0);
    for (var i = 0; i < a.length; i++)
      for (var j = 0; j < b.length; j++)
        out[i + j] += a[i] * b[j];
    return out;
  }

  function polyMul(a, b) { return convolve(a, b); }
  function polyMulComplex() { }

  function computeFreqResponse(nPts) {
    var mag = new Float64Array(nPts);
    for (var k = 0; k < nPts; k++) {
      var omega = Math.PI * k / (nPts - 1);
      // H(e^jw) = product(e^jw - z_i) / product(e^jw - p_i)
      var num_re = 1, num_im = 0;
      for (var i = 0; i < zeros.length; i++) {
        var dr = Math.cos(omega) - zeros[i].re;
        var di = Math.sin(omega) - zeros[i].im;
        var t_re = num_re * dr - num_im * di;
        var t_im = num_re * di + num_im * dr;
        num_re = t_re; num_im = t_im;
      }
      var den_re = 1, den_im = 0;
      for (var i = 0; i < poles.length; i++) {
        var dr2 = Math.cos(omega) - poles[i].re;
        var di2 = Math.sin(omega) - poles[i].im;
        var t2_re = den_re * dr2 - den_im * di2;
        var t2_im = den_re * di2 + den_im * dr2;
        den_re = t2_re; den_im = t2_im;
      }
      var dm2 = den_re * den_re + den_im * den_im;
      if (dm2 < 1e-30) { mag[k] = 40; continue; }
      var h_re = (num_re * den_re + num_im * den_im) / dm2;
      var h_im = (num_im * den_re - num_re * den_im) / dm2;
      var m = Math.sqrt(h_re * h_re + h_im * h_im);
      mag[k] = 20 * Math.log10(Math.max(m, 1e-12));
    }
    return mag;
  }

  function draw() {
    ctx.save();
    PlotUtils.clearCanvas(ctx, w, h);
    var pad = 30;

    // ─── LEFT: z-plane with poles/zeros ───
    var paneW = 340;

    // Unit circle
    ctx.strokeStyle = PlotUtils.COLORS.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(zCx, zCy, zR, 0, Math.PI * 2); ctx.stroke();

    // Stability region fill
    ctx.fillStyle = 'rgba(105,255,71,0.03)';
    ctx.beginPath(); ctx.arc(zCx, zCy, zR, 0, Math.PI * 2); ctx.fill();

    // Axes
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(zCx - zR - 20, zCy); ctx.lineTo(zCx + zR + 20, zCy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(zCx, zCy - zR - 20); ctx.lineTo(zCx, zCy + zR + 20); ctx.stroke();

    // Zeros (o)
    ctx.strokeStyle = PlotUtils.COLORS.cyan;
    ctx.lineWidth = 2;
    for (var i = 0; i < zeros.length; i++) {
      var zx = zCx + zeros[i].re * zR, zy = zCy - zeros[i].im * zR;
      ctx.beginPath(); ctx.arc(zx, zy, 6, 0, Math.PI * 2); ctx.stroke();
    }

    // Poles (x)
    ctx.strokeStyle = PlotUtils.COLORS.amber;
    ctx.lineWidth = 2;
    for (var i = 0; i < poles.length; i++) {
      var px = zCx + poles[i].re * zR, py = zCy - poles[i].im * zR;
      ctx.beginPath();
      ctx.moveTo(px - 5, py - 5); ctx.lineTo(px + 5, py + 5);
      ctx.moveTo(px + 5, py - 5); ctx.lineTo(px - 5, py + 5);
      ctx.stroke();
    }

    // Title
    PlotUtils.drawLabel(ctx, 'Pole-Zero Plot', 20, 15, PlotUtils.COLORS.textMuted);

    // Stability indicator
    var mpm = maxPoleMag();
    var stableText, stableColor;
    if (mpm < 0.999) { stableText = 'STABLE'; stableColor = PlotUtils.COLORS.green; }
    else if (mpm > 1.001) { stableText = 'UNSTABLE'; stableColor = '#ff4444'; }
    else { stableText = 'MARGINAL'; stableColor = PlotUtils.COLORS.amber; }

    ctx.fillStyle = stableColor;
    ctx.font = 'bold 14px Space Grotesk';
    ctx.textAlign = 'center';
    ctx.fillText(stableText, zCx, zCy + zR + 35);
    ctx.font = '10px JetBrains Mono';
    ctx.fillStyle = PlotUtils.COLORS.textDim;
    ctx.fillText('max|p| = ' + mpm.toFixed(4), zCx, zCy + zR + 50);

    // ─── TOP-RIGHT: Magnitude response ───
    var rOx = paneW + 20, rW = w - rOx - 20;
    var magY0 = pad, magH = (h - 2 * pad - 20) * 0.45;
    PlotUtils.drawLabel(ctx, '|H(e^jω)| dB', rOx, magY0 + 10, PlotUtils.COLORS.textMuted);

    var nPts = 256;
    var mag = computeFreqResponse(nPts);
    var magMin = -60, magMax = 40;

    // Grid
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.3;
    for (var db = magMin; db <= magMax; db += 20) {
      var gy = magY0 + magH - (db - magMin) / (magMax - magMin) * magH;
      ctx.beginPath(); ctx.moveTo(rOx, gy); ctx.lineTo(rOx + rW, gy); ctx.stroke();
      ctx.fillStyle = PlotUtils.COLORS.textDim;
      ctx.font = '9px JetBrains Mono';
      ctx.textAlign = 'right';
      ctx.fillText(db + '', rOx - 4, gy + 3);
    }

    // 0 dB line
    var zeroDbY = magY0 + magH - (0 - magMin) / (magMax - magMin) * magH;
    ctx.strokeStyle = 'rgba(255,202,40,0.3)';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(rOx, zeroDbY); ctx.lineTo(rOx + rW, zeroDbY); ctx.stroke();

    // Magnitude curve
    ctx.strokeStyle = PlotUtils.COLORS.cyan;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (var k = 0; k < nPts; k++) {
      var x = rOx + k / (nPts - 1) * rW;
      var clamped = Math.max(magMin, Math.min(magMax, mag[k]));
      var y = magY0 + magH - (clamped - magMin) / (magMax - magMin) * magH;
      if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // ─── BOTTOM-RIGHT: Impulse response ───
    var impY0 = magY0 + magH + 30, impH = h - impY0 - pad;
    PlotUtils.drawLabel(ctx, 'h[n] impulse response', rOx, impY0 + 10, PlotUtils.COLORS.textMuted);

    var N = 40;
    // For unstable systems, cap the impulse computation
    var impN = mpm > 1.5 ? 20 : N;
    var imp = new Float64Array(impN);
    // Direct recursion: h[n] = delta[n] - sum(a[k]*h[n-k])
    var den = realPolyFromRoots(poles);
    var num = realPolyFromRoots(zeros);
    var yBuf = new Float64Array(impN);
    for (var n = 0; n < impN; n++) {
      var x_n = (n < num.length) ? num[n] : 0;
      var sum = x_n;
      for (var k = 1; k < den.length; k++) {
        if (n - k >= 0) sum -= den[k] * yBuf[n - k];
      }
      yBuf[n] = sum;
      imp[n] = sum;
    }

    // Find range
    var impMax = 0;
    for (var i = 0; i < impN; i++) {
      var av = Math.abs(imp[i]);
      if (av > impMax) impMax = av;
    }
    if (impMax < 1e-10) impMax = 1;

    // Zero line
    var impMid = impY0 + impH * 0.5;
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(rOx, impMid); ctx.lineTo(rOx + rW, impMid); ctx.stroke();

    // Stems
    var stemW = rW / impN;
    for (var n = 0; n < impN; n++) {
      var sx = rOx + (n + 0.5) * stemW;
      var sh = (imp[n] / impMax) * impH * 0.4;
      ctx.strokeStyle = mpm > 1 ? '#ff4444' : PlotUtils.COLORS.green;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx, impMid); ctx.lineTo(sx, impMid - sh); ctx.stroke();
      ctx.fillStyle = mpm > 1 ? '#ff4444' : PlotUtils.COLORS.green;
      ctx.beginPath(); ctx.arc(sx, impMid - sh, 2, 0, Math.PI * 2); ctx.fill();
    }

    // Decay envelope for stable
    if (mpm < 1) {
      ctx.strokeStyle = 'rgba(255,202,40,0.3)';
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var n = 0; n < impN; n++) {
        var env = Math.pow(mpm, n) * (impMax > 0 ? 1 : 0);
        var ey = impMid - env / impMax * impH * 0.4;
        if (n === 0) ctx.moveTo(rOx + (n + 0.5) * stemW, ey);
        else ctx.lineTo(rOx + (n + 0.5) * stemW, ey);
      }
      ctx.stroke();
      ctx.beginPath();
      for (var n = 0; n < impN; n++) {
        var env2 = -Math.pow(mpm, n);
        var ey2 = impMid - env2 / impMax * impH * 0.4;
        if (n === 0) ctx.moveTo(rOx + (n + 0.5) * stemW, ey2);
        else ctx.lineTo(rOx + (n + 0.5) * stemW, ey2);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    PlotUtils.drawScanlines(ctx, w, h);
    ctx.restore();
  }

  function hitTest(mx, my) {
    for (var i = 0; i < poles.length; i++) {
      var px = zCx + poles[i].re * zR, py = zCy - poles[i].im * zR;
      if (Math.hypot(mx - px, my - py) < 10) return { type: 'pole', idx: i };
    }
    for (var i = 0; i < zeros.length; i++) {
      var zx = zCx + zeros[i].re * zR, zy = zCy - zeros[i].im * zR;
      if (Math.hypot(mx - zx, my - zy) < 10) return { type: 'zero', idx: i };
    }
    return null;
  }

  function onDown(e) {
    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left, my = e.clientY - rect.top;
    var hit = hitTest(mx, my);
    if (hit) {
      dragIdx = hit.idx;
      dragType = hit.type;
      canvas.setPointerCapture(e.pointerId);
    }
  }

  function onMoveEvt(e) {
    if (dragIdx < 0) return;
    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left, my = e.clientY - rect.top;
    var re = (mx - zCx) / zR, im = -(my - zCy) / zR;
    re = Math.max(-2, Math.min(2, re));
    im = Math.max(-2, Math.min(2, im));
    var arr = dragType === 'pole' ? poles : zeros;
    arr[dragIdx] = { re: re, im: im };
    // Auto-conjugate: if this creates a near-conjugate, pair it
    var conjIdx = findConjugate(arr, dragIdx);
    if (conjIdx >= 0 && conjIdx !== dragIdx) {
      arr[conjIdx] = { re: re, im: -im };
    }
    draw();
  }

  function findConjugate(arr, idx) {
    var p = arr[idx];
    if (Math.abs(p.im) < 0.01) return -1;
    for (var i = 0; i < arr.length; i++) {
      if (i === idx) continue;
      if (Math.abs(arr[i].re - p.re) < 0.15 && Math.abs(arr[i].im + p.im) < 0.15) return i;
    }
    return -1;
  }

  function onUp() { dragIdx = -1; dragType = ''; }

  function bindControls() {
    var presetEl = document.getElementById('stabPreset');
    if (presetEl) presetEl.addEventListener('change', function () {
      var v = this.value;
      if (v === 'stable-real') {
        poles = [{ re: 0.5, im: 0 }, { re: -0.3, im: 0 }];
        zeros = [{ re: -1, im: 0 }];
      } else if (v === 'stable-complex') {
        poles = [{ re: 0.5, im: 0.5 }, { re: 0.5, im: -0.5 }];
        zeros = [{ re: -1, im: 0 }];
      } else if (v === 'marginal') {
        poles = [{ re: 0, im: 1 }, { re: 0, im: -1 }];
        zeros = [{ re: 0, im: 0 }];
      } else if (v === 'unstable') {
        poles = [{ re: 0.8, im: 0.8 }, { re: 0.8, im: -0.8 }];
        zeros = [{ re: -1, im: 0 }];
      }
      draw();
    });

    var addPoleBtn = document.getElementById('stabAddPole');
    var addZeroBtn = document.getElementById('stabAddZero');
    var resetBtn = document.getElementById('stabReset');

    if (addPoleBtn) addPoleBtn.addEventListener('click', function () {
      var r = 0.3 + Math.random() * 0.4;
      var a = Math.random() * Math.PI * 0.8 + 0.1;
      poles.push({ re: r * Math.cos(a), im: r * Math.sin(a) });
      poles.push({ re: r * Math.cos(a), im: -r * Math.sin(a) });
      draw();
    });
    if (addZeroBtn) addZeroBtn.addEventListener('click', function () {
      zeros.push({ re: -0.5 - Math.random() * 0.5, im: 0 });
      draw();
    });
    if (resetBtn) resetBtn.addEventListener('click', function () {
      poles = [{ re: 0.5, im: 0.3 }, { re: 0.5, im: -0.3 }];
      zeros = [{ re: -1, im: 0 }];
      draw();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
