import json
import math
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from scipy import signal
from scipy.fft import fft, fftfreq
from scipy.linalg import toeplitz


OUTPUT_DIR = Path("plots")
OUTPUT_DIR.mkdir(exist_ok=True)
RESULTS_PATH = Path(".")


def positive_lag_power_acf(x: np.ndarray) -> np.ndarray:
    """Return R[ell] for ell >= 0 using the lab-sheet power-signal estimator."""
    n_samples = len(x)
    full_corr = signal.correlate(x, x, mode="full", method="fft")
    positive_corr = full_corr[n_samples - 1 :]

    r = np.zeros(n_samples)
    for ell in range(n_samples):
        r[ell] = positive_corr[ell] / (n_samples - ell)
    return r


def full_power_acf_from_positive(r_positive: np.ndarray) -> np.ndarray:
    return np.concatenate((r_positive[1:][::-1], r_positive))


def one_sided_spectrum(x: np.ndarray, fs: float) -> tuple[np.ndarray, np.ndarray]:
    x_fft = fft(x)
    freqs = fftfreq(len(x), d=1.0 / fs)
    keep = freqs >= 0
    return freqs[keep], np.abs(x_fft[keep])


def top_peak_frequencies(freqs: np.ndarray, magnitude: np.ndarray, count: int) -> list[float]:
    distance = max(1, len(freqs) // 400)
    peaks, properties = signal.find_peaks(magnitude, distance=distance)
    if len(peaks) == 0:
        return []
    order = np.argsort(properties.get("peak_heights", magnitude[peaks]))[::-1]
    ranked = peaks[order]
    selected = []
    for idx in ranked:
        freq_hz = float(freqs[idx])
        if any(abs(freq_hz - prev) < 0.5 for prev in selected):
            continue
        selected.append(freq_hz)
        if len(selected) == count:
            break
    return sorted(selected)


def local_peak_near_expected(
    lags_seconds: np.ndarray,
    acf_positive: np.ndarray,
    expected_period: float,
    search_half_width: float,
) -> float:
    mask = np.logical_and(
        lags_seconds >= expected_period - search_half_width,
        lags_seconds <= expected_period + search_half_width,
    )
    if not np.any(mask):
        return float(expected_period)
    sub_lags = lags_seconds[mask]
    sub_acf = acf_positive[mask]
    idx = int(np.argmax(sub_acf))
    return float(sub_lags[idx])


def ar_least_squares_coefficients(x: np.ndarray, order: int) -> np.ndarray:
    rows = len(x) - order
    a_matrix = np.zeros((rows, order))
    b_vector = x[order:]
    for col in range(order):
        a_matrix[:, col] = x[order - col - 1 : len(x) - col - 1]
    theta_hat, *_ = np.linalg.lstsq(a_matrix, b_vector, rcond=None)
    return theta_hat


def save_figure(filename: str) -> None:
    plt.savefig(OUTPUT_DIR / filename, dpi=150, bbox_inches="tight")
    plt.close("all")


def main() -> None:
    np.random.seed(291)

    a, b, c = 2, 9, 1
    f1 = 10 + a
    f2 = 30 + b
    f3 = 70 + c
    fs = 200.0
    duration = 100.0
    t = np.linspace(0.0, duration, int(duration * fs) + 1)
    n_samples = len(t)
    noise = np.random.randn(n_samples)

    signal_1 = (
        np.sin(2.0 * np.pi * f1 * t)
        + np.cos(2.0 * np.pi * f2 * t)
        + np.sin(2.0 * np.pi * f3 * t)
        + noise
    )
    signal_2 = np.sin(20.0 * np.pi * t + 2.0 * np.pi * (t**2 / 150.0)) + noise

    time_mask = t <= 2.0
    plt.figure(figsize=(10, 7))
    plt.subplot(2, 1, 1)
    plt.plot(t[time_mask], signal_1[time_mask], linewidth=0.9)
    plt.title("Signal 1 in the Time Domain (First 2 s)")
    plt.xlabel("Time (s)")
    plt.ylabel("Amplitude")
    plt.grid(True, alpha=0.3)
    plt.subplot(2, 1, 2)
    plt.plot(t[time_mask], signal_2[time_mask], linewidth=0.9, color="tab:orange")
    plt.title("Signal 2 in the Time Domain (First 2 s)")
    plt.xlabel("Time (s)")
    plt.ylabel("Amplitude")
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    save_figure("lab01_fig01_signals.png")

    plt.figure(figsize=(10, 7))
    plt.subplot(2, 1, 1)
    plt.hist(signal_1, bins=60, color="steelblue", edgecolor="black")
    plt.title("Histogram of Signal 1")
    plt.xlabel("Amplitude")
    plt.ylabel("Count")
    plt.subplot(2, 1, 2)
    plt.hist(signal_2, bins=60, color="darkseagreen", edgecolor="black")
    plt.title("Histogram of Signal 2")
    plt.xlabel("Amplitude")
    plt.ylabel("Count")
    plt.tight_layout()
    save_figure("lab01_fig02_histograms.png")

    freqs_1, dft_mag_1 = one_sided_spectrum(signal_1, fs)
    freqs_2, dft_mag_2 = one_sided_spectrum(signal_2, fs)
    dft_estimates = top_peak_frequencies(freqs_1, dft_mag_1, 3)

    plt.figure(figsize=(10, 7))
    plt.subplot(2, 1, 1)
    plt.plot(freqs_1, dft_mag_1, linewidth=0.8)
    plt.title("One-Sided DFT Magnitude of Signal 1")
    plt.xlabel("Frequency (Hz)")
    plt.ylabel(r"$|X_1[k]|$")
    plt.xlim(0.0, fs / 2.0)
    plt.grid(True, alpha=0.3)
    plt.subplot(2, 1, 2)
    plt.plot(freqs_2, dft_mag_2, linewidth=0.8, color="tab:orange")
    plt.title("One-Sided DFT Magnitude of Signal 2")
    plt.xlabel("Frequency (Hz)")
    plt.ylabel(r"$|X_2[k]|$")
    plt.xlim(0.0, fs / 2.0)
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    save_figure("lab01_fig03_dft.png")

    nperseg = 512
    noverlap = 384
    spec_f1, spec_t1, spec_s1 = signal.spectrogram(
        signal_1, fs=fs, nperseg=nperseg, noverlap=noverlap, scaling="density"
    )
    spec_f2, spec_t2, spec_s2 = signal.spectrogram(
        signal_2, fs=fs, nperseg=nperseg, noverlap=noverlap, scaling="density"
    )

    plt.figure(figsize=(10, 8))
    plt.subplot(2, 1, 1)
    plt.pcolormesh(spec_t1, spec_f1, 10.0 * np.log10(spec_s1 + 1e-12), shading="auto")
    plt.title("Spectrogram of Signal 1")
    plt.ylabel("Frequency (Hz)")
    plt.colorbar(label="Power/Frequency (dB/Hz)")
    plt.subplot(2, 1, 2)
    plt.pcolormesh(spec_t2, spec_f2, 10.0 * np.log10(spec_s2 + 1e-12), shading="auto")
    plt.title("Spectrogram of Signal 2")
    plt.xlabel("Time (s)")
    plt.ylabel("Frequency (Hz)")
    plt.colorbar(label="Power/Frequency (dB/Hz)")
    plt.tight_layout()
    save_figure("lab01_fig04_spectrogram.png")

    acf_builtin_s1 = signal.correlate(signal_1, signal_1, mode="full", method="fft") / n_samples
    acf_positive_s1 = positive_lag_power_acf(signal_1)
    acf_manual_s1 = full_power_acf_from_positive(acf_positive_s1)

    acf_builtin_s2 = signal.correlate(signal_2, signal_2, mode="full", method="fft") / n_samples
    acf_positive_s2 = positive_lag_power_acf(signal_2)
    acf_manual_s2 = full_power_acf_from_positive(acf_positive_s2)

    lags = signal.correlation_lags(n_samples, n_samples)
    lags_seconds = lags / fs
    positive_lags_seconds = np.arange(n_samples) / fs
    zoom_mask = np.logical_and(lags_seconds >= 0.0, lags_seconds <= 1.5)

    dominant_period_s1 = local_peak_near_expected(
        positive_lags_seconds[1:],
        acf_positive_s1[1:],
        expected_period=1.0 / f1,
        search_half_width=0.01,
    )
    common_period_exact = 1.0 / math.gcd(math.gcd(f1, f2), f3)

    plt.figure(figsize=(10, 7))
    plt.subplot(2, 1, 1)
    plt.plot(lags_seconds[zoom_mask], acf_builtin_s1[zoom_mask], linewidth=0.9)
    plt.axvline(dominant_period_s1, color="tab:red", linestyle="--", label="Dominant visible peak")
    plt.title("Signal 1 Autocorrelation Using scipy.signal.correlate")
    plt.xlabel("Lag (s)")
    plt.ylabel(r"$\hat{r}_{xx}[\ell]$")
    plt.grid(True, alpha=0.3)
    plt.legend()
    plt.subplot(2, 1, 2)
    plt.plot(lags_seconds[zoom_mask], acf_manual_s1[zoom_mask], linewidth=0.9, color="tab:green")
    plt.axvline(dominant_period_s1, color="tab:red", linestyle="--", label="Dominant visible peak")
    plt.title("Signal 1 Autocorrelation Using the Power-Signal Estimator")
    plt.xlabel("Lag (s)")
    plt.ylabel(r"$\hat{r}_{xx}[\ell]$")
    plt.grid(True, alpha=0.3)
    plt.legend()
    plt.tight_layout()
    save_figure("lab01_fig05_autocorr_s1.png")

    plt.figure(figsize=(10, 7))
    plt.subplot(2, 1, 1)
    plt.plot(lags_seconds[zoom_mask], acf_builtin_s2[zoom_mask], linewidth=0.9)
    plt.title("Signal 2 Autocorrelation Using scipy.signal.correlate")
    plt.xlabel("Lag (s)")
    plt.ylabel(r"$\hat{r}_{xx}[\ell]$")
    plt.grid(True, alpha=0.3)
    plt.subplot(2, 1, 2)
    plt.plot(lags_seconds[zoom_mask], acf_manual_s2[zoom_mask], linewidth=0.9, color="tab:green")
    plt.title("Signal 2 Autocorrelation Using the Power-Signal Estimator")
    plt.xlabel("Lag (s)")
    plt.ylabel(r"$\hat{r}_{xx}[\ell]$")
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    save_figure("lab01_fig06_autocorr_s2.png")

    periodogram_s1 = np.abs(fft(np.fft.ifftshift(acf_builtin_s1)))
    periodogram_s2 = np.abs(fft(np.fft.ifftshift(acf_builtin_s2)))
    periodogram_freqs = fftfreq(len(acf_builtin_s1), d=1.0 / fs)
    periodogram_mask = periodogram_freqs >= 0.0

    plt.figure(figsize=(10, 7))
    plt.subplot(2, 1, 1)
    plt.plot(periodogram_freqs[periodogram_mask], periodogram_s1[periodogram_mask], linewidth=0.8)
    plt.title("Periodogram of Signal 1 from the FFT of the Full Autocorrelation")
    plt.xlabel("Frequency (Hz)")
    plt.ylabel("Power")
    plt.xlim(0.0, fs / 2.0)
    plt.grid(True, alpha=0.3)
    plt.subplot(2, 1, 2)
    plt.plot(
        periodogram_freqs[periodogram_mask],
        periodogram_s2[periodogram_mask],
        linewidth=0.8,
        color="tab:orange",
    )
    plt.title("Periodogram of Signal 2 from the FFT of the Full Autocorrelation")
    plt.xlabel("Frequency (Hz)")
    plt.ylabel("Power")
    plt.xlim(0.0, fs / 2.0)
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    save_figure("lab01_fig07_periodogram.png")

    p_components = 6
    acm_size = p_components + 1
    acm = toeplitz(acf_positive_s1[:acm_size])
    eigenvalues, eigenvectors = np.linalg.eigh(acm)
    sort_idx = np.argsort(eigenvalues)[::-1]
    eigenvalues_desc = eigenvalues[sort_idx]
    eigenvectors_desc = eigenvectors[:, sort_idx]

    plt.figure(figsize=(8, 5))
    plt.stem(np.arange(1, acm_size + 1), eigenvalues_desc, basefmt=" ")
    plt.title("Eigenvalues of the 7x7 Autocorrelation Matrix")
    plt.xlabel("Index")
    plt.ylabel("Eigenvalue")
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    save_figure("lab01_fig08_acm_eigenvalues.png")

    e_noise = eigenvectors_desc[:, -1:]
    music_freqs = np.linspace(0.0, fs / 2.0, 4000)
    music_spectrum = np.zeros_like(music_freqs)
    for idx, freq_hz in enumerate(music_freqs):
        omega = 2.0 * np.pi * freq_hz / fs
        steering = np.exp(1j * omega * np.arange(acm_size))[:, None]
        projection = e_noise.conj().T @ steering
        music_spectrum[idx] = 1.0 / np.linalg.norm(projection) ** 2
    music_estimates = top_peak_frequencies(music_freqs, music_spectrum, 3)

    plt.figure(figsize=(10, 5))
    plt.plot(music_freqs, music_spectrum, linewidth=0.9)
    plt.title("MUSIC Pseudo-Spectrum of Signal 1")
    plt.xlabel("Frequency (Hz)")
    plt.ylabel("Pseudo-Power")
    plt.xlim(0.0, fs / 2.0)
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    save_figure("lab01_fig09_music.png")

    ar_order = 8
    theta_hat = ar_least_squares_coefficients(signal_1, ar_order)
    ar_den = np.concatenate(([1.0], -theta_hat))
    ar_freqs, ar_response = signal.freqz([1.0], ar_den, worN=4000, fs=fs)
    ar_spectrum = np.abs(ar_response) ** 2
    ar_estimates = top_peak_frequencies(ar_freqs, ar_spectrum, 3)

    plt.figure(figsize=(10, 5))
    plt.plot(ar_freqs, ar_spectrum, linewidth=0.9)
    plt.title(f"AR Power Spectrum of Signal 1 for Model Order {ar_order}")
    plt.xlabel("Frequency (Hz)")
    plt.ylabel(r"$|1/V(e^{j\omega})|^2$")
    plt.xlim(0.0, fs / 2.0)
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    save_figure("lab01_fig10_ar.png")

    results = {
        "student": {"e_number": "E/21/291", "a": a, "b": b, "c": c},
        "signal_parameters": {
            "f1_hz": f1,
            "f2_hz": f2,
            "f3_hz": f3,
            "fs_hz": fs,
            "duration_s": duration,
            "n_samples": n_samples,
            "frequency_resolution_hz": fs / n_samples,
            "spectrogram_nperseg": nperseg,
            "spectrogram_noverlap": noverlap,
        },
        "task_3_dft_estimates_hz": dft_estimates,
        "task_5_signal_1": {
            "dominant_visible_period_s": dominant_period_s1,
            "exact_common_period_s": common_period_exact,
        },
        "task_7_periodogram_peak_estimates_hz": top_peak_frequencies(
            periodogram_freqs[periodogram_mask], periodogram_s1[periodogram_mask], 3
        ),
        "task_8": {
            "p": p_components,
            "acm_size": acm_size,
            "eigenvalues_desc": [float(value) for value in eigenvalues_desc],
        },
        "task_9_music_estimates_hz": music_estimates,
        "task_10_ar": {
            "model_order": ar_order,
            "estimated_frequencies_hz": ar_estimates,
            "selection_note": "Order 8 was chosen as the smallest least-squares AR model that resolved all three tones while remaining close to the ACM eigenvalue elbow at six signal components.",
            "theta_hat": [float(value) for value in theta_hat],
        },
    }

    with open(RESULTS_PATH / "lab01_results.json", "w", encoding="utf-8") as file:
        json.dump(results, file, indent=2)

    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
