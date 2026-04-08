/* ═══════════════════════════════════════════════════════
   nav.js — Sidebar navigation, mobile drawer, ToC
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const chapters = [
    { num: '01', title: 'Sampling & Reconstruction', path: 'chapters/01-sampling-reconstruction/' },
    { num: '02', title: 'Discrete Signals & LTI', path: 'chapters/02-discrete-signals-lti/' },
    { num: '03', title: 'The Z-Transform', path: 'chapters/03-z-transform/' },
    { num: '04', title: 'DTFT, DFT, DFS & FFT', path: 'chapters/04-frequency-analysis/' },
    { num: '05', title: 'FIR Filters', path: 'chapters/05-fir-filters/' },
    { num: '06', title: 'IIR Filters', path: 'chapters/06-iir-filters/' },
    { num: '07', title: 'Filter Design Capstone', path: 'chapters/07-filter-design/' }
  ];

  function getBasePath() {
    const loc = window.location.pathname;
    if (loc.includes('/chapters/')) {
      return '../../';
    }
    return '';
  }

  function buildSidebar() {
    const nav = document.querySelector('.sidebar-nav');
    if (!nav) return;
    const base = getBasePath();
    const current = window.location.pathname;

    chapters.forEach(ch => {
      const div = document.createElement('div');
      div.className = 'nav-chapter';
      const a = document.createElement('a');
      a.className = 'nav-chapter-link';
      a.href = base + ch.path + 'index.html';
      if (current.includes(ch.path) || current.includes('/' + ch.num + '-')) {
        a.classList.add('active');
        div.classList.add('expanded');
      }
      a.innerHTML = '<span class="chapter-num">' + ch.num + '</span><span>' + ch.title + '</span>';
      div.appendChild(a);
      nav.appendChild(div);
    });
  }

  function setupToggle() {
    const btn = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (!btn || !sidebar) return;
    btn.addEventListener('click', function () {
      sidebar.classList.toggle('open');
    });
    document.addEventListener('click', function (e) {
      if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== btn) {
        sidebar.classList.remove('open');
      }
    });
  }

  function setupAccordions() {
    document.querySelectorAll('.accordion-header').forEach(function (header) {
      header.addEventListener('click', function () {
        const acc = header.closest('.accordion');
        acc.classList.toggle('open');
      });
    });
  }

  function setupScrollObserver() {
    const targets = document.querySelectorAll('.fade-in-up');
    if (!targets.length) return;
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });
    targets.forEach(function (t) { observer.observe(t); });
  }

  function setupObjectiveCheckboxes() {
    const items = document.querySelectorAll('.objectives-list li');
    if (!items.length) return;
    const sections = document.querySelectorAll('[data-objective]');
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const idx = parseInt(entry.target.getAttribute('data-objective'), 10);
          const cb = items[idx] && items[idx].querySelector('.checkbox');
          if (cb) cb.classList.add('checked');
        }
      });
    }, { threshold: 0.3 });
    sections.forEach(function (s) { observer.observe(s); });
  }

  function setupQuiz() {
    document.querySelectorAll('.quiz-card').forEach(function (card) {
      const opts = card.querySelectorAll('.quiz-option');
      const correctIdx = parseInt(card.getAttribute('data-correct'), 10);
      const explanation = card.querySelector('.quiz-explanation');
      opts.forEach(function (opt, i) {
        opt.addEventListener('click', function () {
          if (card.classList.contains('answered')) return;
          card.classList.add('answered');
          if (i === correctIdx) {
            opt.classList.add('correct-answer');
            card.classList.add('correct');
            updateQuizScore(true);
          } else {
            opt.classList.add('wrong-answer');
            opts[correctIdx].classList.add('correct-answer');
            card.classList.add('wrong');
            updateQuizScore(false);
          }
          if (explanation) explanation.classList.add('visible');
        });
      });
    });
  }

  function updateQuizScore(correct) {
    const page = window.location.pathname;
    const key = 'dsp_quiz_' + page.replace(/[^a-zA-Z0-9]/g, '_');
    var data = JSON.parse(localStorage.getItem(key) || '{"correct":0,"total":0}');
    data.total++;
    if (correct) data.correct++;
    localStorage.setItem(key, JSON.stringify(data));
  }

  document.addEventListener('DOMContentLoaded', function () {
    buildSidebar();
    setupToggle();
    setupAccordions();
    setupScrollObserver();
    setupObjectiveCheckboxes();
    setupQuiz();
  });

  window.DSPNav = { chapters: chapters, getBasePath: getBasePath };
})();
