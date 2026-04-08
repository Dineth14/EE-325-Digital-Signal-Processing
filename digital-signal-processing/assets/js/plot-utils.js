/* ═══════════════════════════════════════════════════════
   plot-utils.js — Canvas 2D plotting helpers (DSP style)
   ═══════════════════════════════════════════════════════ */
var PlotUtils = (function () {
  'use strict';

  var COLORS = {
    bg: '#060b18',
    grid: '#1e3055',
    gridFaint: 'rgba(30,48,85,0.3)',
    cyan: '#00e5ff',
    violet: '#b388ff',
    amber: '#ffca28',
    green: '#69ff47',
    red: '#ff5252',
    textPrimary: '#e8f0fe',
    textMuted: '#7b9cbf',
    textDim: '#3d5a7a'
  };

  function clearCanvas(ctx, w, h) {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);
  }

  function drawGrid(ctx, w, h, xDiv, yDiv) {
    ctx.strokeStyle = COLORS.gridFaint;
    ctx.lineWidth = 0.5;
    for (var i = 0; i <= xDiv; i++) {
      var x = (w / xDiv) * i;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (var j = 0; j <= yDiv; j++) {
      var y = (h / yDiv) * j;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
  }

  function drawAxes(ctx, ox, oy, w, h) {
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(w, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, h); ctx.stroke();
  }

  function drawLine(ctx, data, xMap, yMap, color, lineWidth) {
    ctx.save();
    ctx.strokeStyle = color || COLORS.cyan;
    ctx.lineWidth = lineWidth || 2;
    ctx.shadowColor = color || COLORS.cyan;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    for (var i = 0; i < data.length; i++) {
      var x = xMap(i, data[i]);
      var y = yMap(i, data[i]);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawStems(ctx, values, x0, dx, oy, scale, color) {
    ctx.save();
    ctx.strokeStyle = color || COLORS.cyan;
    ctx.fillStyle = color || COLORS.cyan;
    ctx.lineWidth = 2;
    for (var i = 0; i < values.length; i++) {
      var x = x0 + i * dx;
      var y = oy - values[i] * scale;
      ctx.beginPath(); ctx.moveTo(x, oy); ctx.lineTo(x, y); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 3, 0, 2 * Math.PI); ctx.fill();
    }
    ctx.restore();
  }

  function drawBars(ctx, values, x0, barW, oy, scale, color1, color2) {
    for (var i = 0; i < values.length; i++) {
      var x = x0 + i * barW;
      var h = Math.abs(values[i]) * scale;
      var grad = ctx.createLinearGradient(0, oy - h, 0, oy);
      grad.addColorStop(0, color1 || COLORS.cyan);
      grad.addColorStop(1, color2 || COLORS.violet);
      ctx.fillStyle = grad;
      ctx.fillRect(x, oy - h, barW - 1, h);
    }
  }

  function drawLabel(ctx, text, x, y, color, font) {
    ctx.save();
    ctx.fillStyle = color || COLORS.textMuted;
    ctx.font = font || '11px "JetBrains Mono", monospace';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function mapRange(val, in0, in1, out0, out1) {
    return out0 + (val - in0) / (in1 - in0) * (out1 - out0);
  }

  function drawScanlines(ctx, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.03)';
    for (var y = 0; y < h; y += 4) {
      ctx.fillRect(0, y + 2, w, 2);
    }
    ctx.restore();
  }

  return {
    COLORS: COLORS,
    clearCanvas: clearCanvas,
    drawGrid: drawGrid,
    drawAxes: drawAxes,
    drawLine: drawLine,
    drawStems: drawStems,
    drawBars: drawBars,
    drawLabel: drawLabel,
    drawScanlines: drawScanlines,
    mapRange: mapRange
  };
})();
