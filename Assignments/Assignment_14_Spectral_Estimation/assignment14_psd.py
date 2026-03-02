import numpy as np
import scipy.signal as signal
import matplotlib.pyplot as plt
import os

def run_assignment14():
    if not os.path.exists('plots'):
        os.makedirs('plots')

    N = 2048
    Fs = 500
    n = np.arange(N)
    np.random.seed(42)
    
    v = np.random.randn(N)
    x = np.sin(2 * np.pi * 50 * n / Fs) + np.sin(2 * np.pi * 120 * n / Fs) + 0.5 * v

    # Periodogram
    f_p, Pxx_p = signal.periodogram(x, fs=Fs)

    # Welch's method (256 segment, 50% overlap, Hamming)
    f_w, Pxx_w = signal.welch(x, fs=Fs, window='hamming', nperseg=256, noverlap=128)

    plt.figure(figsize=(10, 6))
    plt.plot(f_p, 10 * np.log10(Pxx_p + 1e-12), label='Raw Periodogram', alpha=0.5, color='orange')
    plt.plot(f_w, 10 * np.log10(Pxx_w + 1e-12), label='Welch PSD (256 segment)', color='blue', linewidth=2)
    plt.axvline(50, color='r', linestyle='--', label='50 Hz Tone')
    plt.axvline(120, color='g', linestyle='--', label='120 Hz Tone')
    
    plt.title('PSD Estimation: Periodogram vs Welch')
    plt.xlabel('Frequency (Hz)')
    plt.ylabel('Power/Frequency (dB/Hz)')
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.savefig('plots/psd_comparison.png')
    print("Assignment 14 plot saved.")

if __name__ == '__main__':
    run_assignment14()
