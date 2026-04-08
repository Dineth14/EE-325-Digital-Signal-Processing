/* ═══════════════════════════════════════════════════════
   Chapter 7 — SIM 7.3: Real-Time Filter Playground
   Apply FIR/IIR filters to live-generated signals
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var canvas, ctx, w, h;
  var sigType = 'chirp'; // chirp, noise, multi-tone, square
  var filterType = 'lowpass'; // lowpass, highpass, bandpass, notch
  var method = 'fir'; // fir, iir
  var cutoff = 0.3, filterOrder = 15;
  var anim = true;
  var bufferSize = 256;
  var inputBuf = new Float64Array(bufferSize);
  var outputBuf = new Float64Array(bufferSize);
  var phase = 0;

  function init() {
    canvas = document.getElementById('playgroundCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', function () { resize(); });
    bindControls();
    loop();
  }

  function resize() {
    var wrap = canvas.parentElement;
    w = canvas.width = wrap.clientWidth || 700;
    h = canvas.height = 400;
  }

  function generateBlock(N) {
    var x = new Float64Array(N);
    for (var n = 0; n < N; n++) {
      var t = phase + n;
      if (sigType === 'chirp') {
        var f = 0.01 + 0.4 * (t % 200) / 200;
        x[n] = Math.sin(2 * Math.PI * f * t);
      } else if (sigType === 'noise') {
        x[n] = (Math.random() - 0.5) * 2;
      } else if (sigType === 'multi-tone') {
        x[n] = 0.5 * Math.sin(2 * Math.PI * 0.05 * t) +
               0.3 * Math.sin(2 * Math.PI * 0.2 * t) +
               0.2 * Math.sin(2 * Math.PI * 0.45 * t);
      } else if (sigType === 'square') {
        x[n] = Math.sin(2 * Math.PI * 0.08 * t) >= 0 ? 1 : -1;
      }
    }
    phase += N;
    return x;
  }

  function designFilter() {
    var coeffB, coeffA;
    if (method === 'fir') {
      coeffA = [1];
      var M = filterOrder;
      var mid = M / 2;
      coeffB = new Float64Array(M + 1);
      var wc = cutoff * Math.PI;

      for (var n = 0; n <= M; n++) {
        var nm = n - mid;
        if (Math.abs(nm) < 1e-10) {
          coeffB[n] = wc / Math.PI;
        } else {
          coeffB[n] = Math.sin(wc * nm) / (Math.PI * nm);
        }
        // Hamming window
        coeffB[n] *= 0.54 - 0.46 * Math.cos(2 * Math.PI * n / M);
      }

      if (filterType === 'highpass') {
        for (var n = 0; n <= M; n++) {
          coeffB[n] = -coeffB[n];
          if (n === Math.round(mid)) coeffB[n] += 1;
        }
      } else if (filterType === 'bandpass') {
        var wc2 = Math.min(cutoff + 0.2, 0.95) * Math.PI;
        var lpH = new Float64Array(M + 1);
        for (var n = 0; n <= M; n++) {
          var nm2 = n - mid;
          if (Math.abs(nm2) < 1e-10) lpH[n] = wc2 / Math.PI;
          else lpH[n] = Math.sin(wc2 * nm2) / (Math.PI * nm2);
          lpH[n] *= 0.54 - 0.46 * Math.cos(2 * Math.PI * n / M);
        }
        for (var n = 0; n <= M; n++) coeffB[n] = lpH[n] - coeffB[n];
      } else if (filterType === 'notch') {
        for (var n = 0; n <= M; n++) {
          if (n === Math.round(mid)) coeffB[n] = 1 - coeffB[n]; 
          else coeffB[n] = -coeffB[n];
        }
      }
    } else {
      // Simple IIR via bilinear-transformed Butterworth
      var N = Math.min(filterOrder, 6);
      var wc = cutoff * Math.PI;
      var Omega_c = 2 * Math.tan(wc / 2);
      // Butterworth poles
      var sPoles = [];
      for (var k = 0; k < N; k++) {
        var angle = Math.PI * (2 * k + N + 1) / (2 * N);
        sPoles.push({ re: Omega_c * Math.cos(angle), im: Omega_c * Math.sin(angle) });
      }
      // Bilinear transform each pole
      var zPoles = sPoles.map(function (p) {
        var num_re = 1 + p.re / 2, num_im = p.im / 2;
        var den_re = 1 - p.re / 2, den_im = -p.im / 2;
        var dm = den_re * den_re + den_im * den_im;
        return { re: (num_re * den_re + num_im * den_im) / dm, im: (num_im * den_re - num_re * den_im) / dm };
      });
      // Build denominator from poles
      coeffA = [1];
      for (var i = 0; i < zPoles.length; i++) {
        var newA = new Array(coeffA.length + 1).fill(0);
        for (var k = 0; k < coeffA.length; k++) {
          newA[k] += coeffA[k];
          newA[k + 1] -= coeffA[k] * zPoles[i].re;
        }
        coeffA = newA;
      }
      // Round to real
      for (var i = 0; i < coeffA.length; i++) coeffA[i] = Math.round(coeffA[i] * 1e10) / 1e10;
      // Numerator: all zeros at z = -1 for lowpass
      coeffB = [1];
      for (var i = 0; i < N; i++) coeffB = convolve(coeffB, [1, 1]);
      // Normalize gain at DC
      var sumB = 0, sumA = 0;
      for (var i = 0; i < coeffB.length; i++) sumB += coeffB[i];
      for (var i = 0; i < coeffA.length; i++) sumA += coeffA[i];
      if (Math.abs(sumA) > 1e-10) {
        var gain = sumA / sumB;
        for (var i = 0; i < coeffB.length; i++) coeffB[i] *= gain;
      }
    }
    return { b: coeffB, a: coeffA };
  }

  function convolve(a, b) {
    var out = new Array(a.length + b.length - 1).fill(0);
    for (var i = 0; i < a.length; i++)
      for (var j = 0; j < b.length; j++)
        out[i + j] += a[i] * b[j];
    return out;
  }

  function applyFilter(x, b, a) {
    var N = x.length;
    var y = new Float64Array(N);
    for (var n = 0; n < N; n++) {
      var sum = 0;
      for (var k = 0; k < b.length; k++) {
        if (n - k >= 0) sum += b[k] * x[n - k];
      }
      for (var k = 1; k < a.length; k++) {
        if (n - k >= 0) sum -= a[k] * y[n - k];
      }
      y[n] = sum;
    }
    return y;
  }

  function computeSpectrum(x, nfft) {
    nfft = nfft || 256;
    var mag = new Float64Array(nfft / 2);
    for (var k = 0; k < nfft / 2; k++) {
      var re = 0, im = 0;
      for (var n = 0; n < Math.min(x.length, nfft); n++) {
        var angle = -2 * Math.PI * k * n / nfft;
        re += x[n] * Math.cos(angle);
        im += x[n] * Math.sin(angle);
      }
      mag[k] = 20 * Math.log10(Math.max(Math.sqrt(re * re + im * im) / nfft, 1e-12));
    }
    return mag;
  }

  function loop() {
    if (!anim) return;
    var x = generateBlock(bufferSize);
    var filt = designFilter();
    var y = applyFilter(x, filt.b, filt.a);

    // Shift buffers
    inputBuf = x;
    outputBuf = y;

    drawFrame();
    requestAnimationFrame(loop);
  }

  function drawFrame() {
    ctx.save();
    PlotUtils.clearCanvas(ctx, w, h);
    var pad = { l: 40, r: 10, t: 10, b: 10 };
    var halfH = (h - pad.t - pad.b - 20) / 2;

    // Top: waveforms
    var topY = pad.t;
    PlotUtils.drawLabel(ctx, 'Time Domain: input (cyan) → filtered (green)', pad.l, topY + 12, PlotUtils.COLORS.textMuted);
    var wfY = topY + 20;
    var wfH = halfH - 20;
    var mid = wfY + wfH * 0.5;

    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(pad.l, mid); ctx.lineTo(w - pad.r, mid); ctx.stroke();

    var pW = w - pad.l - pad.r;

    // Input waveform
    ctx.strokeStyle = PlotUtils.COLORS.cyan;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var i = 0; i < bufferSize; i++) {
      var x = pad.l + i / (bufferSize - 1) * pW;
      var y = mid - inputBuf[i] * wfH * 0.4;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Output waveform
    ctx.strokeStyle = PlotUtils.COLORS.green;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (var i = 0; i < bufferSize; i++) {
      var xp = pad.l + i / (bufferSize - 1) * pW;
      var yp = mid - Math.max(-1.5, Math.min(1.5, outputBuf[i])) * wfH * 0.4;
      if (i === 0) ctx.moveTo(xp, yp); else ctx.lineTo(xp, yp);
    }
    ctx.stroke();

    // Bottom: spectra
    var botY = topY + halfH + 15;
    PlotUtils.drawLabel(ctx, 'Spectrum: input (cyan) vs filtered (green)', pad.l, botY + 12, PlotUtils.COLORS.textMuted);
    var spY = botY + 20;
    var spH = halfH - 20;

    var specIn = computeSpectrum(inputBuf, 256);
    var specOut = computeSpectrum(outputBuf, 256);
    var dbMin = -60, dbMax = 20;

    // Grid
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 0.3;
    for (var db = dbMin; db <= dbMax; db += 20) {
      var gy = spY + spH - (db - dbMin) / (dbMax - dbMin) * spH;
      ctx.beginPath(); ctx.moveTo(pad.l, gy); ctx.lineTo(pad.l + pW, gy); ctx.stroke();
    }

    // Cutoff indicator
    var cutX = pad.l + cutoff * pW;
    ctx.strokeStyle = 'rgba(255,202,40,0.4)';
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cutX, spY); ctx.lineTo(cutX, spY + spH); ctx.stroke();
    ctx.setLineDash([]);

    function plotSpec(spec, color, alpha) {
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (var k = 0; k < spec.length; k++) {
        var xp = pad.l + k / (spec.length - 1) * pW;
        var db = Math.max(dbMin, Math.min(dbMax, spec[k]));
        var yp = spY + spH - (db - dbMin) / (dbMax - dbMin) * spH;
        if (k === 0) ctx.moveTo(xp, yp); else ctx.lineTo(xp, yp);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    plotSpec(specIn, PlotUtils.COLORS.cyan, 0.4);
    plotSpec(specOut, PlotUtils.COLORS.green, 1);

    PlotUtils.drawScanlines(ctx, w, h);
    ctx.restore();
  }

  function bindControls() {
    var sigEl = document.getElementById('pgSig');
    if (sigEl) sigEl.addEventListener('change', function () { sigType = this.value; });
    var filtEl = document.getElementById('pgFilter');
    if (filtEl) filtEl.addEventListener('change', function () { filterType = this.value; });
    var methEl = document.getElementById('pgMethod');
    if (methEl) methEl.addEventListener('change', function () { method = this.value; });
    var cutEl = document.getElementById('pgCutoff');
    if (cutEl) cutEl.addEventListener('input', function () {
      cutoff = parseFloat(this.value);
      document.getElementById('pgCutoffVal').textContent = cutoff.toFixed(2);
    });
    var ordEl = document.getElementById('pgOrder');
    if (ordEl) ordEl.addEventListener('input', function () {
      filterOrder = parseInt(this.value);
      document.getElementById('pgOrderVal').textContent = filterOrder;
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
