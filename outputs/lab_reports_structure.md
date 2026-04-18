# EE 325: Digital Signal Processing - Lab Reports Structure

This document outlines the strict IEEE conference format structure mapping the contents of both finalized Lab 01 and Lab 02 reports. These represent the finalized outputs compiled within the `outputs` directory.

---

## 1. Lab 01 Report: Frequency Estimation (`lab01_report.tex` / `lab01_report.pdf`)

This report explores parametric and non-parametric spectral density analysis, testing the precision of different estimators.

**Header Section**
* **Title:** EE 325 Digital Signal Processing: Lab 01 Frequency Estimation
* **Author Block:** Student Name, E/21/291, Dept. of Electrical & Electronic Engineering, University of Peradeniya

**I. Abstract and Keywords**
* **Abstract:** A 150-word bounds-compliant summary detailing the objectives (frequency estimation on tones + chirp) and validation of methods (Periodogram, PHD, AR Models).
* **Keywords:** Discrete Fourier Transform, Periodogram, Pisarenko Harmonic Decomposition, Autoregressive Modeling, Power Spectral Density.

**II. Introduction**
* Discusses the overarching motivation behind frequency analysis and outlines the trade-offs between traditional Discrete Fourier bounds and sophisticated Subspace optimizations.

**III. Methodology**
* **Signal Construction:** Defines explicitly the multi-tone baseline stochastic signal using parameters $f_1=12$, $f_2=39$, $f_3=71$ Hz and the dynamically varying chirp bounds.
* **Parameter Estimations:** Briefly highlights the mechanisms applied to analyze these structures (DFT, Un-biased ACF vectors, and recursive Auto-Regressive optimizations).

**IV. Results and Discussion**
* **Task 1 & 2 (Distributions):** Analyzes histogram profiles and time-domain signals identifying Gaussian normality.
* **Task 3 & 4 (Spectra & Spectrograms):** Locates peaks precisely matching signal inputs using DFTs and explores broadband signal sweeps within the chirp.
* **Task 5 & 6 (Autocorrelation):** Compares biased standard ACF sequences organically against power-signal un-biased estimates enforcing the mathematical $1 / (N - |lags|)$ behavior.
* **Task 7 (Periodograms):** Maps explicit periodograms natively computed strictly as the direct DFT bounds sequence mapping the full symmetrical correlation.
* **Task 8, 9, 10 (Subspace & AR Analysis):** Concludes structural evaluations implementing $7 \times 7$ bounding matrices utilizing minimum Pisarenko formulations against Least Squares regressive filters accurately finding base harmonics.

**V. Conclusion**
* Summarizes the efficacy of standard non-parametric bounds vs recursive subspace derivations operating optimally around sparse noise constraints explicitly.

**VI. References**
* Formatted IEEE style citations covering textbooks by Oppenheim, Proakis, and papers by Welch, Schmidt, Pisarenko, and Akaike natively.

**VII. Appendix (Python Code)**
* Structured using `\lstlisting`.
* **A.** Data Generation
* **B.** Periodograms Mapping
* **C.** Pisarenko Harmonic Configurations
* **D.** AR Least Squares Optimization Limits.

---

## 2. Lab 02 Report: Filter Design (`lab02_report.tex` / `lab02_report.pdf`)

This report covers theoretically derived continuous recursive filters explicitly mapping towards optimized discrete sequence implementations analyzing bounded transition states.

**Header Section**
* **Title:** EE 325 Digital Signal Processing: Lab 02 Filter Design
* **Author Block:** Student Name, E/21/291, Dept. of Electrical & Electronic Engineering, University of Peradeniya

**I. Abstract and Keywords**
* **Abstract:** Validates synthesis mapping between theoretically bounded constraints isolating infinite response models uniformly juxtaposed dynamically against varying constrained finite window characteristics natively. 
* **Keywords:** Bilinear Transform, Group Delay, Pole-Zero Mapping, Spectrogram, Infinite Impulse Response.

**II. Methodology**
* **Parameter Scaling:** Explicitly evaluates calculations targeting specific boundaries ($\omega_p \approx 114.22$ and $\omega_s \approx 176.76$) utilizing standard bounds ($\delta_s = 0.1$, $\delta_p = 0.9$).
* **Order Approximations:** Validates analog boundaries (e.g. $N \geq \log(\dots)$ equations) explicitly restricting bounds manually mapping Butterworth and Chebyshev configurations natively alongside standardized finite widths ($4\pi/\Delta\omega \dots 12\pi/\Delta\omega$).

**III. Results and Discussion**
* **Filter Configurations:** Contains explicitly the mapped Orders Table summarizing structural constraints matching calculated equations flawlessly natively derived for 3 IIR and 5 FIR variants.
* **Filter Responses:** Analyzes the plotted metrics spanning natively zero-pole stability maps continuously returning bounded internal poles logically checking passbands, phase ripples, and internal group delays.
* **Validation Outputs (Noise / Chirps):** Evaluates outputs running standard white Gaussian distributions validating stop-bands optimally and dynamic chirps verifying exactly sequential attenuations dynamically through structured spectrogram limits.

**IV. Conclusion**
* Reiterates the organic trade-offs involving stability complexity versus sequential ripple variations implicitly verifying derivations effectively dynamically.

**V. References**
* Formatted IEEE style citations aligning towards explicit Filter Theory definitions (Mitra, Antoniou, Parks). 

**VI. Appendix (Python Code)**
* Structured utilizing `\lstlisting`.
* **A.** Mathematical IIR derivations.
* **B.** Discrete FIR widths equations.
* **C.** Pole/Zero and Response generators.
* **D.** Input and validation plotting code.
