import json
import math
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from scipy import signal


OUTPUT_DIR = Path("plots")
OUTPUT_DIR.mkdir(exist_ok=True)
RESULTS_PATH = Path(".")


def save_figure(filename: str) -> None:
    plt.savefig(OUTPUT_DIR / filename, dpi=150, bbox_inches="tight")
    plt.close("all")


def impulse_response(b: np.ndarray, a: np.ndarray, length: int) -> np.ndarray:
    impulse = np.zeros(length)
    impulse[0] = 1.0
    return signal.lfilter(b, a, impulse)


def noise_power_spectrum(y: np.ndarray, fs: float) -> tuple[np.ndarray, np.ndarray]:
    corr = signal.correlate(y, y, mode="full", method="fft")
    power = np.abs(np.fft.fft(np.fft.ifftshift(corr)))
    freqs = np.fft.fftfreq(len(corr), d=1.0 / fs)
    mask = freqs >= 0.0
    return freqs[mask], power[mask]


def response_metrics(freqs_hz: np.ndarray, magnitude: np.ndarray, fp_hz: float, fs_hz: float) -> dict:
    passband_mask = freqs_hz <= fp_hz
    stopband_mask = freqs_hz >= fs_hz
    return {
        "min_passband_gain": float(np.min(magnitude[passband_mask])),
        "max_stopband_gain": float(np.max(magnitude[stopband_mask])),
    }


def iir_transfer_summary(sos: np.ndarray) -> list[list[float]]:
    return [[float(value) for value in row] for row in sos]


def main() -> None:
    a, b, c, d = 2, 9, 1, 3
    fs = 1000.0
    delta_s = 0.1
    delta_p = 0.9
    delta_t = 0.1

    wp = 100.0 + math.sqrt(1.1 * a + 11.0 * b + 101.0 * c)
    ws = wp * (1.0 + math.sqrt(d / 10.0))
    fp_hz = wp / (2.0 * math.pi)
    fs_hz = ws / (2.0 * math.pi)
    wc = 0.5 * (wp + ws)
    fc_hz = wc / (2.0 * math.pi)

    omega_p = 2.0 * fs * math.tan(wp / (2.0 * fs))
    omega_s = 2.0 * fs * math.tan(ws / (2.0 * fs))
    epsilon_p = math.sqrt(1.0 / (delta_p**2) - 1.0)
    epsilon_s = math.sqrt(1.0 / (delta_s**2) - 1.0)
    omega_ratio = omega_s / omega_p

    butter_order_manual = math.ceil(math.log(epsilon_s / epsilon_p) / math.log(omega_ratio))
    cheby_order_manual = math.ceil(math.acosh(epsilon_s / epsilon_p) / math.acosh(omega_ratio))

    rp_db = -20.0 * math.log10(delta_p)
    rs_db = -20.0 * math.log10(delta_s)
    butter_order_scipy, butter_wn = signal.buttord(omega_p, omega_s, rp_db, rs_db, analog=True)
    cheby1_order_scipy, cheby1_wn = signal.cheb1ord(omega_p, omega_s, rp_db, rs_db, analog=True)
    cheby2_order_scipy, cheby2_wn = signal.cheb2ord(omega_p, omega_s, rp_db, rs_db, analog=True)

    delta_omega_normalized = (ws - wp) / fs
    fir_orders = {
        "boxcar": math.ceil(4.0 * math.pi / delta_omega_normalized) - 1,
        "bartlett": math.ceil(8.0 * math.pi / delta_omega_normalized) - 1,
        "hann": math.ceil(8.0 * math.pi / delta_omega_normalized) - 1,
        "hamming": math.ceil(8.0 * math.pi / delta_omega_normalized) - 1,
        "blackman": math.ceil(12.0 * math.pi / delta_omega_normalized) - 1,
    }
    for key, order in list(fir_orders.items()):
        if order % 2 != 0:
            fir_orders[key] = order + 1

    butter_ba_analog = signal.butter(butter_order_scipy, butter_wn, btype="low", analog=True, output="ba")
    cheby1_ba_analog = signal.cheby1(
        cheby1_order_scipy, rp_db, cheby1_wn, btype="low", analog=True, output="ba"
    )
    cheby2_ba_analog = signal.cheby2(
        cheby2_order_scipy, rs_db, cheby2_wn, btype="low", analog=True, output="ba"
    )

    butter_bz = signal.bilinear(*butter_ba_analog, fs=fs)
    cheby1_bz = signal.bilinear(*cheby1_ba_analog, fs=fs)
    cheby2_bz = signal.bilinear(*cheby2_ba_analog, fs=fs)

    filters = {
        "butter": {
            "display": "Butterworth",
            "kind": "IIR",
            "b": np.asarray(butter_bz[0], dtype=float),
            "a": np.asarray(butter_bz[1], dtype=float),
            "sos": signal.tf2sos(*butter_bz),
            "order": int(butter_order_scipy),
        },
        "cheby1": {
            "display": "Chebyshev Type I",
            "kind": "IIR",
            "b": np.asarray(cheby1_bz[0], dtype=float),
            "a": np.asarray(cheby1_bz[1], dtype=float),
            "sos": signal.tf2sos(*cheby1_bz),
            "order": int(cheby1_order_scipy),
        },
        "cheby2": {
            "display": "Chebyshev Type II",
            "kind": "IIR",
            "b": np.asarray(cheby2_bz[0], dtype=float),
            "a": np.asarray(cheby2_bz[1], dtype=float),
            "sos": signal.tf2sos(*cheby2_bz),
            "order": int(cheby2_order_scipy),
        },
    }

    for name, order in fir_orders.items():
        numtaps = order + 1
        filters[name] = {
            "display": name.capitalize() if name != "boxcar" else "Boxcar",
            "kind": "FIR",
            "b": signal.firwin(numtaps, fc_hz, window=name, fs=fs),
            "a": np.array([1.0]),
            "sos": [],
            "order": int(order),
        }

    noise_input = np.random.default_rng(291).standard_normal(1000)
    t_noise = np.arange(noise_input.size) / fs
    t_chirp = np.linspace(0.0, 100.0, int(100.0 * fs) + 1)
    chirp_input = np.sin(2.0 * np.pi * t_chirp**2 / 100.0)

    results = {
        "student": {"e_number": "E/21/291", "a": a, "b": b, "c": c, "d": d},
        "specifications": {
            "wp_rad_per_s": wp,
            "ws_rad_per_s": ws,
            "fp_hz": fp_hz,
            "fs_hz": fs_hz,
            "wc_rad_per_s": wc,
            "fc_hz": fc_hz,
            "omega_p_prewarped": omega_p,
            "omega_s_prewarped": omega_s,
            "epsilon_p": epsilon_p,
            "epsilon_s": epsilon_s,
            "omega_ratio": omega_ratio,
            "delta_omega_normalized": delta_omega_normalized,
            "delta_t": delta_t,
        },
        "orders": {
            "manual": {
                "butterworth": butter_order_manual,
                "chebyshev_type_i": cheby_order_manual,
                "chebyshev_type_ii": cheby_order_manual,
                "boxcar": fir_orders["boxcar"],
                "bartlett": fir_orders["bartlett"],
                "hann": fir_orders["hann"],
                "hamming": fir_orders["hamming"],
                "blackman": fir_orders["blackman"],
            },
            "scipy": {
                "butterworth": int(butter_order_scipy),
                "chebyshev_type_i": int(cheby1_order_scipy),
                "chebyshev_type_ii": int(cheby2_order_scipy),
            },
        },
        "filters": {},
    }

    short_name_to_display = {
        "butter": "Butterworth",
        "cheby1": "Chebyshev Type I",
        "cheby2": "Chebyshev Type II",
        "boxcar": "Boxcar",
        "bartlett": "Bartlett",
        "hann": "Hann",
        "hamming": "Hamming",
        "blackman": "Blackman",
    }

    for short_name, config in filters.items():
        b_coeff = np.asarray(config["b"], dtype=float)
        a_coeff = np.asarray(config["a"], dtype=float)

        z, p, _ = signal.tf2zpk(b_coeff, a_coeff)
        freq_axis, response = signal.freqz(b_coeff, a_coeff, worN=4096, fs=fs)
        magnitude = np.abs(response)
        magnitude_db = 20.0 * np.log10(magnitude + 1e-12)
        phase = np.unwrap(np.angle(response))
        gd_freqs, gd_values = signal.group_delay((b_coeff, a_coeff), w=2048, fs=fs)
        metrics = response_metrics(freq_axis, magnitude, fp_hz, fs_hz)

        plt.figure(figsize=(6, 6))
        plt.scatter(np.real(z), np.imag(z), s=28, facecolors="none", edgecolors="tab:blue", label="Zeros")
        plt.scatter(np.real(p), np.imag(p), s=32, marker="x", color="tab:red", label="Poles")
        circle = plt.Circle((0.0, 0.0), 1.0, fill=False, linestyle="--", color="gray")
        plt.gca().add_patch(circle)
        plt.axhline(0.0, color="black", linewidth=0.5)
        plt.axvline(0.0, color="black", linewidth=0.5)
        plt.title(f"{short_name_to_display[short_name]} Pole-Zero Plot")
        plt.xlabel("Real")
        plt.ylabel("Imaginary")
        plt.axis("equal")
        plt.grid(True, alpha=0.3)
        plt.legend(loc="upper right")
        plt.tight_layout()
        save_figure(f"lab02_fig02_{short_name}_pz.png")

        impulse_len = 220 if config["kind"] == "IIR" else len(b_coeff)
        h = impulse_response(b_coeff, a_coeff, impulse_len)
        plt.figure(figsize=(9, 4))
        plt.stem(np.arange(impulse_len), h, basefmt=" ")
        plt.title(f"{short_name_to_display[short_name]} Impulse Response")
        plt.xlabel("n")
        plt.ylabel("h[n]")
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        save_figure(f"lab02_fig03_{short_name}_impulse.png")

        plt.figure(figsize=(10, 7))
        plt.subplot(2, 1, 1)
        plt.plot(freq_axis, magnitude, linewidth=1.0)
        plt.axvline(fp_hz, color="tab:green", linestyle="--", label=r"$\omega_p$")
        plt.axvline(fs_hz, color="tab:red", linestyle="--", label=r"$\omega_s$")
        plt.axhline(delta_p, color="tab:green", linestyle=":", label=r"$\delta_p$")
        plt.axhline(delta_s, color="tab:red", linestyle=":", label=r"$\delta_s$")
        plt.title(f"{short_name_to_display[short_name]} Gain Response")
        plt.xlabel("Frequency (Hz)")
        plt.ylabel(r"$|H(e^{j\omega})|$")
        plt.grid(True, alpha=0.3)
        plt.legend(loc="upper right")
        plt.subplot(2, 1, 2)
        plt.plot(freq_axis, magnitude_db, linewidth=1.0)
        plt.axvline(fp_hz, color="tab:green", linestyle="--")
        plt.axvline(fs_hz, color="tab:red", linestyle="--")
        plt.axhline(20.0 * math.log10(delta_p), color="tab:green", linestyle=":")
        plt.axhline(20.0 * math.log10(delta_s), color="tab:red", linestyle=":")
        plt.xlabel("Frequency (Hz)")
        plt.ylabel("Magnitude (dB)")
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        save_figure(f"lab02_fig04_{short_name}_gain.png")

        plt.figure(figsize=(9, 4))
        plt.plot(freq_axis, phase, linewidth=1.0)
        plt.title(f"{short_name_to_display[short_name]} Phase Response")
        plt.xlabel("Frequency (Hz)")
        plt.ylabel("Phase (rad)")
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        save_figure(f"lab02_fig05_{short_name}_phase.png")

        plt.figure(figsize=(9, 4))
        plt.plot(gd_freqs, gd_values, linewidth=1.0)
        plt.title(f"{short_name_to_display[short_name]} Group Delay")
        plt.xlabel("Frequency (Hz)")
        plt.ylabel("Samples")
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        save_figure(f"lab02_fig06_{short_name}_gd.png")

        noise_output = signal.lfilter(b_coeff, a_coeff, noise_input)
        noise_fft = np.fft.fft(noise_output)
        noise_freqs = np.fft.fftfreq(noise_output.size, d=1.0 / fs)
        noise_mask = noise_freqs >= 0.0
        psd_freqs, psd_values = noise_power_spectrum(noise_output, fs)

        plt.figure(figsize=(10, 8))
        plt.subplot(3, 1, 1)
        plt.plot(t_noise, noise_output, linewidth=0.8)
        plt.title(f"{short_name_to_display[short_name]} Output for White Gaussian Noise")
        plt.xlabel("Time (s)")
        plt.ylabel("Amplitude")
        plt.grid(True, alpha=0.3)
        plt.subplot(3, 1, 2)
        plt.plot(noise_freqs[noise_mask], np.abs(noise_fft[noise_mask]), linewidth=0.8)
        plt.title("One-Sided DFT Magnitude")
        plt.xlabel("Frequency (Hz)")
        plt.ylabel(r"$|Y[k]|$")
        plt.grid(True, alpha=0.3)
        plt.subplot(3, 1, 3)
        plt.plot(psd_freqs, psd_values, linewidth=0.8)
        plt.title("Power Spectrum from the FFT of the Autocorrelation")
        plt.xlabel("Frequency (Hz)")
        plt.ylabel("Power")
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        save_figure(f"lab02_noise_{short_name}.png")

        chirp_output = signal.lfilter(b_coeff, a_coeff, chirp_input)
        chirp_spec_f, chirp_spec_t, chirp_spec = signal.spectrogram(
            chirp_output, fs=fs, nperseg=4096, noverlap=3072, scaling="density"
        )

        plt.figure(figsize=(10, 8))
        plt.subplot(2, 1, 1)
        plt.plot(t_chirp, chirp_output, linewidth=0.7)
        plt.title(f"{short_name_to_display[short_name]} Output for the Chirp Input")
        plt.xlabel("Time (s)")
        plt.ylabel("Amplitude")
        plt.grid(True, alpha=0.3)
        plt.subplot(2, 1, 2)
        plt.pcolormesh(
            chirp_spec_t,
            chirp_spec_f,
            10.0 * np.log10(chirp_spec + 1e-12),
            shading="auto",
        )
        plt.ylim(0.0, 30.0)
        plt.title("Output Spectrogram")
        plt.xlabel("Time (s)")
        plt.ylabel("Frequency (Hz)")
        plt.colorbar(label="Power/Frequency (dB/Hz)")
        plt.tight_layout()
        save_figure(f"lab02_chirp_{short_name}.png")

        results["filters"][short_name] = {
            "display_name": short_name_to_display[short_name],
            "type": config["kind"],
            "order": config["order"],
            "num_degree": len(b_coeff) - 1,
            "den_degree": len(a_coeff) - 1,
            "numerator": [float(value) for value in b_coeff],
            "denominator": [float(value) for value in a_coeff],
            "sos": iir_transfer_summary(config["sos"]) if config["kind"] == "IIR" else [],
            "min_passband_gain": metrics["min_passband_gain"],
            "max_stopband_gain": metrics["max_stopband_gain"],
            "max_pole_radius": float(np.max(np.abs(p))) if p.size else 0.0,
        }

    with open(RESULTS_PATH / "lab02_results.json", "w", encoding="utf-8") as file:
        json.dump(results, file, indent=2)

    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
