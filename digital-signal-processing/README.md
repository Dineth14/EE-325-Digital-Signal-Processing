# 📡 Digital Signal Processing — Interactive Textbook

[![GitHub Pages](https://img.shields.io/badge/Live_Demo-GitHub_Pages-00e5ff?style=for-the-badge&logo=github)](https://yourusername.github.io/digital-signal-processing/)
[![License: MIT](https://img.shields.io/badge/License-MIT-b388ff?style=for-the-badge)](LICENSE)
[![Pure HTML/CSS/JS](https://img.shields.io/badge/Stack-HTML%2FCSS%2FJS-ffca28?style=for-the-badge)](#)
[![Chapters](https://img.shields.io/badge/Chapters-7-69ff47?style=for-the-badge)](#chapters)

A **complete, visually immersive, interactive web-based textbook** covering Digital Signal Processing from first principles through advanced filter design. Built with zero dependencies — pure HTML, CSS, and JavaScript — deployable directly via GitHub Pages.

---

## ✨ Features

- **7 comprehensive chapters** with full mathematical derivations rendered in KaTeX
- **22+ interactive canvas simulations** — real-time, mouse/touch-driven visualizations
- **Quizzes with instant feedback** at the end of every chapter
- **Flip-card equation reference** grids for quick formula review
- **Progress tracking** via localStorage — checkboxes and quiz scores persist across sessions
- **Dark-mode CRT aesthetic** with animated scanline overlays and glow effects
- **Fully responsive** — desktop three-column layout, tablet two-column, mobile single-column with sidebar drawer
- **Zero build tools** — just open `index.html` in a browser or deploy to any static host

---

## 📖 Chapters

| # | Title | Topics | Simulations |
|---|-------|--------|-------------|
| 1 | **Sampling & Reconstruction** | Sampling theorem, Nyquist rate, aliasing, quantization, SQNR, ZOH reconstruction | Sampling Oscilloscope · Aliasing Explorer · Quantization Lab |
| 2 | **Discrete Signals & LTI Systems** | Elementary sequences, energy/power, system properties, convolution sum, BIBO stability | Signal Builder · Convolution Engine · LTI Properties Tester |
| 3 | **The Z-Transform** | Definition & ROC, common pairs, properties, transfer function, inverse methods | Pole-Zero Plot · Z-Plane Explorer · Inverse Z Visualizer |
| 4 | **DTFT, DFT, DFS & FFT** | DTFT, DFT, DFS, Cooley-Tukey FFT, spectral leakage, windowing | DTFT Explorer · DFT Engine · DFS Visualizer · FFT Butterfly |
| 5 | **FIR Filter Design** | Windowed-sinc method, window comparison, linear phase types, Kaiser formula | FIR Designer · Windowing Lab · Linear Phase Explorer |
| 6 | **IIR Filter Design** | Analog prototypes, bilinear transform, pre-warping, realization structures, stability | IIR Designer · Bilinear Transform Visualizer · Stability Explorer |
| 7 | **Filter Design Capstone** | Prototype comparison, multirate DSP, real-time filtering, practical considerations | Analog Prototype Comparison · Multirate Processing · Real-Time Playground |

---

## 🚀 Quick Start

### Option 1: Open Locally
```
git clone https://github.com/yourusername/digital-signal-processing.git
cd digital-signal-processing
```
Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari). No server needed — everything works via `file://` protocol.

### Option 2: GitHub Pages
Push to a GitHub repository and enable Pages from Settings → Pages → Source: `main` branch, root `/`. The included GitHub Actions workflow handles deployment automatically.

### Option 3: Any Static Host
Upload the entire folder to Netlify, Vercel, Cloudflare Pages, or any static file server. No build step required.

---

## 🏗️ Repository Structure

```
digital-signal-processing/
├── index.html                    # Landing page with spectrum analyzer hero
├── README.md
├── assets/
│   ├── css/
│   │   ├── main.css              # Primary layout, sidebar, responsive grid
│   │   ├── math.css              # Equation boxes, flip cards, derivation steps
│   │   ├── animations.css        # CRT scanlines, accordions, scroll effects
│   │   └── components.css        # Landing page hero, chapter cards, progress
│   └── js/
│       ├── theme.js              # Dark theme IIFE
│       ├── nav.js                # Sidebar tree, accordions, quiz handler
│       ├── katex-render.js       # Auto-render KaTeX with $ and $$ delimiters
│       ├── plot-utils.js         # Canvas 2D drawing helpers (grid, axes, stems)
│       └── dsp-core.js           # DSP math library: FFT, filters, windows, etc.
├── chapters/
│   ├── 01-sampling-reconstruction/
│   │   ├── index.html
│   │   └── sim/
│   │       ├── sampler.js        # SIM 1.1: Sampling Oscilloscope
│   │       ├── aliasing.js       # SIM 1.2: Aliasing Frequency Explorer
│   │       └── reconstruction.js # SIM 1.3: Quantization Noise Lab
│   ├── 02-discrete-signals-lti/
│   │   ├── index.html
│   │   └── sim/
│   │       ├── signal-builder.js     # SIM 2.1: Interactive Signal Builder
│   │       ├── convolution-engine.js # SIM 2.2: Graphical Convolution Engine
│   │       └── lti-properties.js     # SIM 2.3: LTI Properties Tester
│   ├── 03-z-transform/
│   │   ├── index.html
│   │   └── sim/
│   │       ├── pole-zero-plot.js     # SIM 3.1: Pole-Zero Plot
│   │       ├── z-plane-explorer.js   # SIM 3.2: Z-Plane Explorer
│   │       └── inverse-z.js          # SIM 3.3: Inverse Z Visualizer
│   ├── 04-frequency-analysis/
│   │   ├── index.html
│   │   └── sim/
│   │       ├── dtft-explorer.js  # SIM 4.1: DTFT Explorer
│   │       ├── dft-engine.js     # SIM 4.2: DFT Engine
│   │       ├── dfs-visualizer.js # SIM 4.3: DFS Visualizer
│   │       └── fft-butterfly.js  # SIM 4.4: FFT Butterfly Visualizer
│   ├── 05-fir-filters/
│   │   ├── index.html
│   │   └── sim/
│   │       ├── fir-designer.js   # SIM 5.1: FIR Filter Designer
│   │       ├── windowing.js      # SIM 5.2: Windowing Lab
│   │       └── linear-phase.js   # SIM 5.3: Linear Phase Explorer
│   ├── 06-iir-filters/
│   │   ├── index.html
│   │   └── sim/
│   │       ├── iir-designer.js        # SIM 6.1: IIR Filter Designer
│   │       ├── bilinear-transform.js  # SIM 6.2: Bilinear Transform Visualizer
│   │       └── stability-explorer.js  # SIM 6.3: Stability Explorer
│   └── 07-filter-design/
│       ├── index.html
│       └── sim/
│           ├── analog-prototype.js    # SIM 7.1: Analog Prototype Comparison
│           ├── multirate.js           # SIM 7.2: Multirate Processing
│           └── adaptive-filter.js     # SIM 7.3: Real-Time Filter Playground
└── .github/
    └── workflows/
        └── deploy.yml            # GitHub Pages deployment
```

---

## 🎨 Design System

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-root` | `#060b18` | Page background |
| `--surface-1` | `#0d1526` | Sidebar, cards |
| `--surface-2` | `#111e36` | Hover states, accordion bodies |
| `--accent-cyan` | `#00e5ff` | Links, primary signals |
| `--accent-violet` | `#b388ff` | Secondary signals, Chebyshev |
| `--accent-amber` | `#ffca28` | Warnings, poles, highlights |
| `--accent-green` | `#69ff47` | Success, stable indicators |

**Typography**: Inter (body), JetBrains Mono (code/equations), Space Grotesk (display headings)

---

## 🧮 Math Notation

All equations use [KaTeX](https://katex.org/) v0.16.9 loaded from CDN. Inline math uses `$...$` delimiters, display math uses `$$...$$`.

Examples rendered in the textbook:
- Sampling theorem: $x(t) = \sum_{n=-\infty}^{\infty} x[n]\,\text{sinc}\left(\frac{t-nT_s}{T_s}\right)$
- DFT: $X[k] = \sum_{n=0}^{N-1} x[n]\, e^{-j2\pi kn/N}$
- Bilinear transform: $s = \frac{2}{T}\frac{1-z^{-1}}{1+z^{-1}}$

---

## 🛠️ Technology

- **HTML5 Canvas 2D API** — all visualizations use `requestAnimationFrame` for smooth 60fps rendering
- **Pointer Events API** — unified mouse and touch interaction for all simulations
- **localStorage** — persistent progress tracking (checkboxes, quiz scores)
- **KaTeX 0.16.9** (CDN) — server-side-quality math rendering in the browser
- **Google Fonts** (CDN) — Inter, JetBrains Mono, Space Grotesk
- **Custom DSP Library** (`dsp-core.js`) — 350+ lines implementing FFT, IFFT, DTFT, convolution, filter design, window functions, and more

---

## 📜 License

MIT License. See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **Alan V. Oppenheim & Ronald W. Schafer** — *Discrete-Time Signal Processing* (Pearson)
- **John G. Proakis & Dimitris G. Manolakis** — *Digital Signal Processing: Principles, Algorithms, and Applications*
- **Steven W. Smith** — *The Scientist and Engineer's Guide to Digital Signal Processing*
- [KaTeX](https://katex.org/) for beautiful math rendering
- [Google Fonts](https://fonts.google.com/) for Inter, JetBrains Mono, and Space Grotesk
