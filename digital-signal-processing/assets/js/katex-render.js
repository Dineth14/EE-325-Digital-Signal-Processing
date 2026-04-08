/* ═══════════════════════════════════════════════════════
   katex-render.js — Auto-render KaTeX equations
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';
  function renderMath() {
    if (typeof renderMathInElement === 'function') {
      renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false,
        trust: true
      });
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(renderMath, 100);
    });
  } else {
    setTimeout(renderMath, 100);
  }
})();
