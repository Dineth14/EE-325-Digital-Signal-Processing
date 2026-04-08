/* ═══════════════════════════════════════════════════════
   Chapter 1 — SIM 1.1: Real-Time Sampling Oscilloscope
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var canvas, ctx, w, h;
  var playing = true, animId = null;
  var sigFreq = 3, sigType = 'sine', sampFreq = 20, showAlias = true;
  var time = 0;

  function init() {
    canvas = document.getElementById('samplerCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    bindControls();
    tick();
  }

  function resize() {
    var wrap = canvas.parentElement;
    w = canvas.width = wrap.clientWidth || 700;
    h = canvas.height = 300;
  }

  function getSignalValue(t) {
    var f = sigFreq;
    switch (sigType) {
      case 'square': return Math.sign(Math.sin(2 * Math.PI * f * t));
      case 'triangle':
        var p = (f * t) % 1;
        return 4 * Math.abs(p - 0.5) - 1;
      case 'chirp':
        return Math.sin(2 * Math.PI * (f * t + 2 * t * t));
      default: return Math.sin(2 * Math.PI * f * t);
    }
  }

  function draw() {
    ctx.save();
    PlotUtils.clearCanvas(ctx, w, h);
    PlotUtils.drawGrid(ctx, w, h, 20, 8);

    var topH = h * 0.48, botH = h * 0.48, gap = h * 0.04;
    var ox = 40, oy1 = topH / 2, oy2 = topH + gap + botH / 2;
    var duration = 2; // seconds shown
    var plotW = w - ox - 10;

    // Axes
    ctx.strokeStyle = PlotUtils.COLORS.grid;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ox, oy1); ctx.lineTo(w - 10, oy1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oy2); ctx.lineTo(w - 10, oy2); ctx.stroke();

    PlotUtils.drawLabel(ctx, 'Continuous + Samples', ox, 14, PlotUtils.COLORS.textDim);
    PlotUtils.drawLabel(ctx, 'Reconstructed', ox, topH + gap + 14, PlotUtils.COLORS.textDim);

    var amp = topH * 0.4;

    // Draw continuous signal (top)
    ctx.strokeStyle = PlotUtils.COLORS.green;
    ctx.lineWidth = 2;
    ctx.shadowColor = PlotUtils.COLORS.green;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    for (var i = 0; i <= plotW; i++) {
      var t = time + (i / plotW) * duration;
      var val = getSignalValue(t);
      var x = ox + i;
      var y = oy1 - val * amp;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw sample impulses
    var Ts = 1 / sampFreq;
    var tStart = time;
    var tEnd = time + duration;
    var firstSample = Math.ceil(tStart / Ts);
    var samples = [], sampleTimes = [];

    ctx.strokeStyle = PlotUtils.COLORS.cyan;
    ctx.fillStyle = PlotUtils.COLORS.cyan;
    ctx.lineWidth = 2;

    for (var n = firstSample; n * Ts <= tEnd; n++) {
      var st = n * Ts;
      var sv = getSignalValue(st);
      samples.push(sv);
      sampleTimes.push(st);
      var sx = ox + ((st - tStart) / duration) * plotW;
      var sy = oy1 - sv * amp;

      ctx.beginPath();
      ctx.moveTo(sx, oy1);
      ctx.lineTo(sx, sy);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx, sy, 3, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Reconstructed signal via sinc interpolation (bottom)
    ctx.strokeStyle = PlotUtils.COLORS.violet;
    ctx.lineWidth = 2;
    ctx.shadowColor = PlotUtils.COLORS.violet;
    ctx.shadowBlur = 3;
    ctx.beginPath();
    for (var j = 0; j <= plotW; j++) {
      var tr = time + (j / plotW) * duration;
      var recon = 0;
      for (var k = 0; k < samples.length; k++) {
        var arg = (tr - sampleTimes[k]) / Ts;
        var sinc = arg === 0 ? 1 : Math.sin(Math.PI * arg) / (Math.PI * arg);
        recon += samples[k] * sinc;
      }
      var rx = ox + j;
      var ry = oy2 - recon * amp;
      if (j === 0) ctx.moveTo(rx, ry); else ctx.lineTo(rx, ry);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Original on bottom for comparison (dim)
    ctx.strokeStyle = 'rgba(105,255,71,0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (var m = 0; m <= plotW; m++) {
      var to = time + (m / plotW) * duration;
      var vo = getSignalValue(to);
      var xo = ox + m;
      var yo = oy2 - vo * amp;
      if (m === 0) ctx.moveTo(xo, yo); else ctx.lineTo(xo, yo);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Scanlines
    PlotUtils.drawScanlines(ctx, w, h);
    ctx.restore();

    // Update readouts
    var nyquistMet = sampFreq >= 2 * sigFreq;
    var aliasFreq = Math.abs(sigFreq - Math.round(sigFreq / sampFreq) * sampFreq);
    var ratioVal = (sampFreq / sigFreq).toFixed(2);

    var nyqEl = document.getElementById('nyquistStatus');
    if (nyqEl) {
      nyqEl.textContent = nyquistMet ? '✓ MET' : '✗ VIOLATED';
      nyqEl.className = 'metric-value ' + (nyquistMet ? 'metric-pass' : 'metric-fail');
    }
    var aliasEl = document.getElementById('aliasFreqVal');
    if (aliasEl) aliasEl.textContent = aliasFreq.toFixed(2) + ' Hz';
    var ratioEl = document.getElementById('sampRatioVal');
    if (ratioEl) ratioEl.textContent = ratioVal + '×';
  }

  function tick() {
    if (playing) {
      time += 1 / 60;
      draw();
    }
    animId = requestAnimationFrame(tick);
  }

  function bindControls() {
    var freqSlider = document.getElementById('sigFreqSlider');
    var typeSelect = document.getElementById('sigTypeSelect');
    var sampSlider = document.getElementById('sampFreqSlider');
    var aliasToggle = document.getElementById('aliasToggle');
    var playBtn = document.getElementById('samplerPlay');
    var resetBtn = document.getElementById('samplerReset');

    if (freqSlider) {
      freqSlider.addEventListener('input', function () {
        sigFreq = parseFloat(this.value);
        document.getElementById('sigFreqVal').textContent = sigFreq.toFixed(1) + ' Hz';
      });
    }
    if (typeSelect) {
      typeSelect.addEventListener('change', function () { sigType = this.value; });
    }
    if (sampSlider) {
      sampSlider.addEventListener('input', function () {
        sampFreq = parseFloat(this.value);
        document.getElementById('sampFreqVal').textContent = sampFreq.toFixed(0) + ' Hz';
      });
    }
    if (aliasToggle) {
      aliasToggle.addEventListener('click', function () {
        showAlias = !showAlias;
        this.classList.toggle('active');
      });
    }
    if (playBtn) {
      playBtn.addEventListener('click', function () {
        playing = !playing;
        this.textContent = playing ? '⏸ Pause' : '▶ Play';
        if (playing && !animId) tick();
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        time = 0;
        sigFreq = 3;
        sampFreq = 20;
        sigType = 'sine';
        playing = true;
        if (document.getElementById('sigFreqSlider')) document.getElementById('sigFreqSlider').value = 3;
        if (document.getElementById('sampFreqSlider')) document.getElementById('sampFreqSlider').value = 20;
        if (document.getElementById('sigTypeSelect')) document.getElementById('sigTypeSelect').value = 'sine';
        document.getElementById('sigFreqVal').textContent = '3.0 Hz';
        document.getElementById('sampFreqVal').textContent = '20 Hz';
        playBtn.textContent = '⏸ Pause';
        draw();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
