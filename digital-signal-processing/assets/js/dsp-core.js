/* ═══════════════════════════════════════════════════════
   dsp-core.js — Shared DSP math library
   Implements: FFT, IFFT, DTFT, convolution, filter design,
   frequency response, pole-zero analysis
   ═══════════════════════════════════════════════════════ */
var DSP = (function () {
  'use strict';

  /* ── Complex number helpers ── */
  function Complex(re, im) { return { re: re || 0, im: im || 0 }; }
  function cAdd(a, b) { return { re: a.re + b.re, im: a.im + b.im }; }
  function cSub(a, b) { return { re: a.re - b.re, im: a.im - b.im }; }
  function cMul(a, b) { return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }; }
  function cDiv(a, b) {
    var d = b.re * b.re + b.im * b.im;
    if (d === 0) return Complex(0, 0);
    return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
  }
  function cExp(theta) { return { re: Math.cos(theta), im: Math.sin(theta) }; }
  function cAbs(z) { return Math.sqrt(z.re * z.re + z.im * z.im); }
  function cArg(z) { return Math.atan2(z.im, z.re); }
  function cConj(z) { return { re: z.re, im: -z.im }; }
  function cScale(z, s) { return { re: z.re * s, im: z.im * s }; }

  /* ── Bit-reversal permutation ── */
  function bitReverse(n, bits) {
    var rev = 0;
    for (var i = 0; i < bits; i++) {
      rev = (rev << 1) | (n & 1);
      n >>= 1;
    }
    return rev;
  }

  /* ── FFT — Cooley-Tukey radix-2 DIT in-place ── */
  function fft(x) {
    var N = x.length;
    if (N === 0) return [];
    // Ensure power of 2
    var bits = Math.round(Math.log2(N));
    if ((1 << bits) !== N) {
      // Zero-pad to next power of 2
      var N2 = 1 << Math.ceil(Math.log2(N));
      while (x.length < N2) x.push(Complex(0, 0));
      N = N2;
      bits = Math.round(Math.log2(N));
    }

    // Bit-reversal permutation
    var X = new Array(N);
    for (var i = 0; i < N; i++) {
      var j = bitReverse(i, bits);
      X[j] = x[i] ? { re: x[i].re || 0, im: x[i].im || 0 } : Complex(0, 0);
    }

    // Butterfly computation
    for (var s = 1; s <= bits; s++) {
      var m = 1 << s;
      var halfM = m >> 1;
      var wm = cExp(-2 * Math.PI / m);
      for (var k = 0; k < N; k += m) {
        var w = Complex(1, 0);
        for (var jj = 0; jj < halfM; jj++) {
          var t = cMul(w, X[k + jj + halfM]);
          var u = X[k + jj];
          X[k + jj] = cAdd(u, t);
          X[k + jj + halfM] = cSub(u, t);
          w = cMul(w, wm);
        }
      }
    }
    return X;
  }

  /* ── IFFT via conjugate trick ── */
  function ifft(X) {
    var N = X.length;
    var conj = X.map(cConj);
    var Y = fft(conj);
    return Y.map(function (v) { return { re: v.re / N, im: -v.im / N }; });
  }

  /* ── DTFT — evaluate at array of omega values ── */
  function dtft(x, omegas) {
    var results = [];
    for (var k = 0; k < omegas.length; k++) {
      var w = omegas[k];
      var sum = Complex(0, 0);
      for (var n = 0; n < x.length; n++) {
        var val = (typeof x[n] === 'number') ? Complex(x[n], 0) : x[n];
        var e = cExp(-w * n);
        sum = cAdd(sum, cMul(val, e));
      }
      results.push(sum);
    }
    return results;
  }

  /* ── Linear convolution ── */
  function convLinear(x, h) {
    var M = x.length, N = h.length;
    var L = M + N - 1;
    var y = new Array(L);
    for (var n = 0; n < L; n++) {
      var sum = 0;
      for (var k = 0; k < M; k++) {
        if (n - k >= 0 && n - k < N) {
          sum += x[k] * h[n - k];
        }
      }
      y[n] = sum;
    }
    return y;
  }

  /* ── Circular convolution (N-point) ── */
  function convCircular(x, h, N) {
    var xp = new Array(N), hp = new Array(N);
    for (var i = 0; i < N; i++) {
      xp[i] = Complex(i < x.length ? x[i] : 0, 0);
      hp[i] = Complex(i < h.length ? h[i] : 0, 0);
    }
    var X = fft(xp), H = fft(hp);
    var Y = new Array(N);
    for (var k = 0; k < N; k++) { Y[k] = cMul(X[k], H[k]); }
    var y = ifft(Y);
    return y.map(function (v) { return v.re; });
  }

  /* ── Frequency response H(e^jω) from b,a coefficients ── */
  function freqz(b, a, N) {
    N = N || 512;
    var mag = new Array(N), phase = new Array(N), omega = new Array(N);
    for (var k = 0; k < N; k++) {
      var w = Math.PI * k / (N - 1);
      omega[k] = w;
      var num = Complex(0, 0), den = Complex(0, 0);
      for (var i = 0; i < b.length; i++) {
        num = cAdd(num, cScale(cExp(-w * i), b[i]));
      }
      for (var j = 0; j < a.length; j++) {
        den = cAdd(den, cScale(cExp(-w * j), a[j]));
      }
      var H = cDiv(num, den);
      mag[k] = cAbs(H);
      phase[k] = cArg(H);
    }
    return { omega: omega, magnitude: mag, phase: phase };
  }

  /* ── Group delay ── */
  function grpdelay(b, a, N) {
    N = N || 512;
    var resp = freqz(b, a, N);
    var gd = new Array(N);
    gd[0] = 0;
    for (var k = 1; k < N; k++) {
      var dw = resp.omega[k] - resp.omega[k - 1];
      var dp = resp.phase[k] - resp.phase[k - 1];
      // Unwrap
      while (dp > Math.PI) dp -= 2 * Math.PI;
      while (dp < -Math.PI) dp += 2 * Math.PI;
      gd[k] = -dp / dw;
    }
    gd[0] = gd[1];
    return { omega: resp.omega, delay: gd };
  }

  /* ── Poles and zeros from (b, a) ── */
  function zplane(b, a) {
    return { zeros: polyRoots(b), poles: polyRoots(a) };
  }

  /* ── Polynomial root finder (companion matrix eigenvalues, Durand-Kerner) ── */
  function polyRoots(coeffs) {
    if (coeffs.length <= 1) return [];
    // Normalize
    var c0 = coeffs[0];
    if (c0 === 0) return [];
    var p = coeffs.map(function (v) { return v / c0; });
    var n = p.length - 1;
    if (n === 0) return [];
    if (n === 1) return [Complex(-p[1], 0)];
    if (n === 2) {
      var disc = p[1] * p[1] - 4 * p[2];
      if (disc >= 0) {
        return [
          Complex((-p[1] + Math.sqrt(disc)) / 2, 0),
          Complex((-p[1] - Math.sqrt(disc)) / 2, 0)
        ];
      } else {
        return [
          Complex(-p[1] / 2, Math.sqrt(-disc) / 2),
          Complex(-p[1] / 2, -Math.sqrt(-disc) / 2)
        ];
      }
    }

    // Durand-Kerner method for higher order
    var roots = [];
    for (var i = 0; i < n; i++) {
      var angle = (2 * Math.PI * i) / n + 0.4;
      roots.push(Complex(0.7 * Math.cos(angle), 0.7 * Math.sin(angle)));
    }

    for (var iter = 0; iter < 100; iter++) {
      var maxShift = 0;
      for (var ii = 0; ii < n; ii++) {
        var z = roots[ii];
        // Evaluate polynomial at z
        var val = Complex(1, 0);
        for (var j = 1; j <= n; j++) {
          val = cAdd(cMul(val, z), Complex(p[j], 0));
        }
        // Product of (z - z_j) for j != i
        var denom = Complex(1, 0);
        for (var k = 0; k < n; k++) {
          if (k !== ii) denom = cMul(denom, cSub(z, roots[k]));
        }
        var shift = cDiv(val, denom);
        roots[ii] = cSub(roots[ii], shift);
        maxShift = Math.max(maxShift, cAbs(shift));
      }
      if (maxShift < 1e-10) break;
    }
    return roots;
  }

  /* ── Bilinear transform: analog (b_s, a_s) → digital (b_z, a_z) ── */
  function bilinear(bs, as, fs) {
    var T = 1 / fs;
    var Na = as.length - 1;
    var Nb = bs.length - 1;
    var N = Math.max(Na, Nb);

    // Pad to same length
    while (bs.length <= N) bs.push(0);
    while (as.length <= N) as.push(0);

    var bz = new Array(N + 1).fill(0);
    var az = new Array(N + 1).fill(0);

    // Compute via polynomial operations: s = (2/T)(1-z^{-1})/(1+z^{-1})
    // This is a simplified implementation for low-order systems
    // For proper implementation, expand (2/T)^k * (1-z^{-1})^k * (1+z^{-1})^{N-k}
    for (var k = 0; k <= N; k++) {
      for (var j = 0; j <= N; j++) {
        var binom = 1;
        var sign = 1;
        var coeff = 0;
        // Compute C(k,j) * C(N-k, N-j) * (2/T)^k
        var c1 = binomial(k, Math.min(j, k));
        var c2 = binomial(N - k, Math.max(0, Math.min(N - j, N - k)));
        if (j > k || (N - j) > (N - k)) { sign = 0; } else {
          sign = ((k - j) % 2 === 0) ? 1 : -1;
        }
        bz[N - j] += bs[N - k] * c1 * c2 * sign * Math.pow(2 / T, k);
        az[N - j] += as[N - k] * c1 * c2 * sign * Math.pow(2 / T, k);
      }
    }

    // Normalize
    var a0 = az[0];
    if (a0 !== 0) {
      for (var m = 0; m <= N; m++) { bz[m] /= a0; az[m] /= a0; }
    }
    return { b: bz, a: az };
  }

  function binomial(n, k) {
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;
    var r = 1;
    for (var i = 0; i < k; i++) {
      r = r * (n - i) / (i + 1);
    }
    return Math.round(r);
  }

  /* ── Butterworth poles ── */
  function butterworthPoles(N, Omegac) {
    var poles = [];
    for (var k = 0; k < N; k++) {
      var angle = Math.PI * (2 * k + N + 1) / (2 * N);
      poles.push(Complex(Omegac * Math.cos(angle), Omegac * Math.sin(angle)));
    }
    return poles;
  }

  /* ── Butterworth analog prototype H(s) ── */
  function butterworthAnalog(N, Omegac) {
    var poles = butterworthPoles(N, Omegac);
    // Build polynomial from poles (keeping only left-half-plane)
    var a = [Complex(1, 0)];
    for (var i = 0; i < poles.length; i++) {
      if (poles[i].re < 0 || (poles[i].re === 0 && poles[i].im >= 0)) {
        // Multiply a by (s - pole)
        // For real coefficients, pair complex conjugates
      }
    }
    // Simplified: return poles and gain
    var gain = Math.pow(Omegac, N);
    return { poles: poles, gain: gain };
  }

  /* ── Partial fraction expansion (simple poles) ── */
  function partialFractions(b, a) {
    var poles = polyRoots(a);
    var residues = [];
    for (var i = 0; i < poles.length; i++) {
      var z = poles[i];
      // Evaluate B(z) at this pole
      var numVal = Complex(0, 0);
      for (var k = 0; k < b.length; k++) {
        var zk = Complex(1, 0);
        for (var p = 0; p < k; p++) zk = cMul(zk, z);
        numVal = cAdd(numVal, cScale(zk, b[b.length - 1 - k]));
      }
      // Evaluate A'(z) at this pole
      var denom = Complex(1, 0);
      for (var j = 0; j < poles.length; j++) {
        if (j !== i) {
          denom = cMul(denom, cSub(z, poles[j]));
        }
      }
      residues.push(cDiv(numVal, denom));
    }
    return { residues: residues, poles: poles };
  }

  /* ── Window functions ── */
  function windowRect(N) {
    var w = new Array(N);
    for (var i = 0; i < N; i++) w[i] = 1;
    return w;
  }

  function windowHanning(N) {
    var w = new Array(N);
    for (var i = 0; i < N; i++) {
      w[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1)));
    }
    return w;
  }

  function windowHamming(N) {
    var w = new Array(N);
    for (var i = 0; i < N; i++) {
      w[i] = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (N - 1));
    }
    return w;
  }

  function windowBlackman(N) {
    var w = new Array(N);
    for (var i = 0; i < N; i++) {
      w[i] = 0.42 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1)) + 0.08 * Math.cos(4 * Math.PI * i / (N - 1));
    }
    return w;
  }

  function windowKaiser(N, beta) {
    var w = new Array(N);
    var I0b = besselI0(beta);
    for (var i = 0; i < N; i++) {
      var x = 2 * i / (N - 1) - 1;
      w[i] = besselI0(beta * Math.sqrt(1 - x * x)) / I0b;
    }
    return w;
  }

  function besselI0(x) {
    var sum = 1, term = 1;
    for (var k = 1; k < 30; k++) {
      term *= (x / 2 / k) * (x / 2 / k);
      sum += term;
      if (term < 1e-12 * sum) break;
    }
    return sum;
  }

  /* ── FIR lowpass design via windowed sinc ── */
  function firLowpass(M, wc, windowType, beta) {
    var h = new Array(M + 1);
    var mid = M / 2;
    for (var n = 0; n <= M; n++) {
      if (n === mid) {
        h[n] = wc / Math.PI;
      } else {
        h[n] = Math.sin(wc * (n - mid)) / (Math.PI * (n - mid));
      }
    }
    var win;
    switch (windowType) {
      case 'hanning': win = windowHanning(M + 1); break;
      case 'hamming': win = windowHamming(M + 1); break;
      case 'blackman': win = windowBlackman(M + 1); break;
      case 'kaiser': win = windowKaiser(M + 1, beta || 5); break;
      default: win = windowRect(M + 1);
    }
    for (var i = 0; i <= M; i++) h[i] *= win[i];
    return h;
  }

  /* ── FIR highpass via spectral inversion ── */
  function firHighpass(M, wc, windowType, beta) {
    var lp = firLowpass(M, wc, windowType, beta);
    var hp = lp.map(function (v) { return -v; });
    hp[Math.floor(M / 2)] += 1;
    return hp;
  }

  /* ── FIR bandpass ── */
  function firBandpass(M, wl, wh, windowType, beta) {
    var lp1 = firLowpass(M, wh, windowType, beta);
    var lp2 = firLowpass(M, wl, windowType, beta);
    return lp1.map(function (v, i) { return v - lp2[i]; });
  }

  /* ── Generate test signals ── */
  function generateSine(N, freq, fs, amplitude, phase) {
    var x = new Array(N);
    amplitude = amplitude || 1;
    phase = phase || 0;
    for (var n = 0; n < N; n++) {
      x[n] = amplitude * Math.sin(2 * Math.PI * freq * n / fs + phase);
    }
    return x;
  }

  function generateSquare(N, freq, fs, amplitude) {
    var x = new Array(N);
    amplitude = amplitude || 1;
    for (var n = 0; n < N; n++) {
      x[n] = Math.sin(2 * Math.PI * freq * n / fs) >= 0 ? amplitude : -amplitude;
    }
    return x;
  }

  function generateTriangle(N, freq, fs, amplitude) {
    var x = new Array(N);
    amplitude = amplitude || 1;
    for (var n = 0; n < N; n++) {
      var t = (freq * n / fs) % 1;
      x[n] = amplitude * (4 * Math.abs(t - 0.5) - 1);
    }
    return x;
  }

  function generateChirp(N, f0, f1, fs) {
    var x = new Array(N);
    var T = N / fs;
    for (var n = 0; n < N; n++) {
      var t = n / fs;
      var f = f0 + (f1 - f0) * t / T;
      x[n] = Math.sin(2 * Math.PI * (f0 * t + (f1 - f0) * t * t / (2 * T)));
    }
    return x;
  }

  function generateNoise(N, amplitude) {
    var x = new Array(N);
    amplitude = amplitude || 1;
    for (var n = 0; n < N; n++) {
      x[n] = (Math.random() * 2 - 1) * amplitude;
    }
    return x;
  }

  /* ── Sinc interpolation for reconstruction ── */
  function sincInterp(samples, sampleIndices, t, Ts) {
    var val = 0;
    for (var i = 0; i < samples.length; i++) {
      var arg = (t - sampleIndices[i] * Ts) / Ts;
      var s = arg === 0 ? 1 : Math.sin(Math.PI * arg) / (Math.PI * arg);
      val += samples[i] * s;
    }
    return val;
  }

  /* ── Magnitude to dB ── */
  function magToDb(mag) {
    return 20 * Math.log10(Math.max(mag, 1e-12));
  }

  /* ── Public API ── */
  return {
    Complex: Complex, cAdd: cAdd, cSub: cSub, cMul: cMul, cDiv: cDiv,
    cExp: cExp, cAbs: cAbs, cArg: cArg, cConj: cConj, cScale: cScale,
    fft: fft,
    ifft: ifft,
    dtft: dtft,
    convLinear: convLinear,
    convCircular: convCircular,
    freqz: freqz,
    grpdelay: grpdelay,
    zplane: zplane,
    polyRoots: polyRoots,
    bilinear: bilinear,
    butterworthPoles: butterworthPoles,
    butterworthAnalog: butterworthAnalog,
    partialFractions: partialFractions,
    windowRect: windowRect,
    windowHanning: windowHanning,
    windowHamming: windowHamming,
    windowBlackman: windowBlackman,
    windowKaiser: windowKaiser,
    besselI0: besselI0,
    firLowpass: firLowpass,
    firHighpass: firHighpass,
    firBandpass: firBandpass,
    generateSine: generateSine,
    generateSquare: generateSquare,
    generateTriangle: generateTriangle,
    generateChirp: generateChirp,
    generateNoise: generateNoise,
    sincInterp: sincInterp,
    magToDb: magToDb,
    binomial: binomial
  };
})();
