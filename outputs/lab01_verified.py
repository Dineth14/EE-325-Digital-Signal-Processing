import numpy as np
import matplotlib.pyplot as plt
import scipy.signal as signal
from scipy.linalg import toeplitz, eigh
import os
import math

def run_lab1():
    if not os.path.exists('plots'):
        os.makedirs('plots')

    # Seed for reproducibility
    np.random.seed(42)

    # Paramters
    # E/21/291 -> a=2, b=9, c=1
    a, b, c = 2, 9, 1
    f1, f2, f3 = 10 + a, 30 + b, 70 + c
    print(f"Frequencies (Hz): f1={f1}, f2={f2}, f3={f3}")

    Fs = 200 # Hz
    T_end = 100 # seconds
    # Number of points is 100*Fs
    t = np.arange(0, int(T_end*Fs)) / Fs # 0 to 99.995, length 20000

    nu = np.random.normal(0, 1, len(t))

    # --- Task 1: Construct Signals ---
    x1 = np.sin(2 * np.pi * f1 * t) + np.cos(2 * np.pi * f2 * t) + np.sin(2 * np.pi * f3 * t) + nu
    x2 = np.sin(20 * np.pi * t + 2 * np.pi * (t**2 / 150)) + nu

    # --- Task 2: Plot time domain & histograms ---
    plt.figure(figsize=(12, 8))
    
    plt.subplot(2, 2, 1)
    # Plotting only first 1 second so it's visible
    plt.plot(t[:200], x1[:200])
    plt.title("Signal 1 - Time Domain (First 1s)")
    plt.xlabel("Time (s)")
    plt.ylabel("Amplitude")

    plt.subplot(2, 2, 2)
    plt.hist(x1, bins=50, color='skyblue', edgecolor='black')
    plt.title("Signal 1 - Histogram")
    plt.xlabel("Amplitude")
    plt.ylabel("Count")

    plt.subplot(2, 2, 3)
    plt.plot(t[:200], x2[:200])
    plt.title("Signal 2 - Time Domain (First 1s)")
    plt.xlabel("Time (s)")
    plt.ylabel("Amplitude")

    plt.subplot(2, 2, 4)
    plt.hist(x2, bins=50, color='lightgreen', edgecolor='black')
    plt.title("Signal 2 - Histogram")
    plt.xlabel("Amplitude")
    plt.ylabel("Count")

    plt.tight_layout()
    plt.savefig('plots/task2.png')
    plt.close()

    # --- Task 3: DFT Spectra ---
    X1 = np.fft.fft(x1)
    X2 = np.fft.fft(x2)
    f_xf = np.fft.fftfreq(len(t), d=1/Fs)
    
    # Consider only positive frequencies
    pos_idx = np.where(f_xf >= 0)
    
    plt.figure(figsize=(10, 6))
    plt.subplot(2, 1, 1)
    plt.plot(f_xf[pos_idx], np.abs(X1[pos_idx]))
    plt.title("DFT Spectrum of Signal 1")
    plt.ylabel("Magnitude")
    plt.grid(True)
    
    plt.subplot(2, 1, 2)
    plt.plot(f_xf[pos_idx], np.abs(X2[pos_idx]))
    plt.title("DFT Spectrum of Signal 2")
    plt.xlabel("Frequency (Hz)")
    plt.ylabel("Magnitude")
    plt.grid(True)
    
    plt.tight_layout()
    plt.savefig('plots/task3.png')
    plt.close()

    # Find peaks for Signal 1
    peaks_idx, _ = signal.find_peaks(np.abs(X1[pos_idx]), height=len(t)/4)
    freqs_dft = f_xf[pos_idx][peaks_idx]
    print(f"Task 3 - Estimated Frequencies for Signal 1 from DFT: {freqs_dft} Hz")

    # --- Task 4: Spectrograms ---
    f_stft1, t_stft1, Zxx1 = signal.spectrogram(x1, fs=Fs, nperseg=256)
    f_stft2, t_stft2, Zxx2 = signal.spectrogram(x2, fs=Fs, nperseg=256)

    plt.figure(figsize=(10, 8))
    plt.subplot(2, 1, 1)
    plt.pcolormesh(t_stft1, f_stft1, 10 * np.log10(Zxx1), shading='gouraud')
    plt.title("Spectrogram of Signal 1")
    plt.ylabel("Frequency (Hz)")
    
    plt.subplot(2, 1, 2)
    plt.pcolormesh(t_stft2, f_stft2, 10 * np.log10(Zxx2), shading='gouraud')
    plt.title("Spectrogram of Signal 2 (Chirp)")
    plt.ylabel("Frequency (Hz)")
    plt.xlabel("Time (sec)")
    
    plt.tight_layout()
    plt.savefig('plots/task4.png')
    plt.close()

    # --- Task 5: Autocorrelation of Signal 1 ---
    # Implement both Built-in (biased implicitly if directly used) and Power-Signal (unbiased formula)
    rxx1_raw = signal.correlate(x1, x1, mode='full')
    lags = signal.correlation_lags(len(x1), len(x1))
    
    N = len(x1)
    # The Power-Signal Approximation formula (Unbiased estimator) is division by (N - |l|)
    rxx1_unbiased = rxx1_raw / (N - np.abs(lags))
    # Built-in equivalent estimator (usually Biased estimator is divide by N)
    rxx1_biased = rxx1_raw / N
    
    center = len(rxx1_biased) // 2
    max_lag = int(3 * Fs) # Up to 3 seconds for fundamental period lookup
    
    plt.figure(figsize=(10, 6))
    plt.subplot(2, 1, 1)
    plt.plot(lags[center:center+max_lag]/Fs, rxx1_biased[center:center+max_lag])
    plt.title("Autocorrelation of Signal 1 (Biased)")
    plt.ylabel("R_xx")
    plt.grid(True)
    
    plt.subplot(2, 1, 2)
    plt.plot(lags[center:center+max_lag]/Fs, rxx1_unbiased[center:center+max_lag])
    plt.title("Autocorrelation of Signal 1 (Unbiased Power-Signal Approx)")
    plt.xlabel("Lag (s)")
    plt.ylabel("R_xx")
    plt.grid(True)
    plt.tight_layout()
    plt.savefig('plots/task5.png')
    plt.close()
    
    print("Task 5 - Based on GCD(12, 39, 71)=1 Hz, expected fundamental period is 1 second.")

    # --- Task 6: Autocorrelation of Signal 2 ---
    rxx2_raw = signal.correlate(x2, x2, mode='full')
    rxx2_unbiased = rxx2_raw / (len(x2) - np.abs(lags))
    
    plt.figure(figsize=(10, 4))
    plt.plot(lags[center:center+max_lag]/Fs, rxx2_unbiased[center:center+max_lag])
    plt.title("Autocorrelation of Signal 2 (Unbiased)")
    plt.xlabel("Lag (s)")
    plt.ylabel("R_xx")
    plt.grid(True)
    plt.tight_layout()
    plt.savefig('plots/task6.png')
    plt.close()

    # --- Task 7: Periodograms ---
    # Instruction specifies implementation as "DFT of xcorr result"
    # To compute DFT of the full symmetric ACF (biased estimator) properly centered:
    Pxx_den1_custom = np.abs(np.fft.fft(np.fft.ifftshift(rxx1_biased)))
    f_p1_custom = np.fft.fftfreq(len(rxx1_biased), 1/Fs)
    # Filter positive frequencies
    pos_p1 = f_p1_custom >= 0

    rxx2_biased = rxx2_raw / len(x2)
    Pxx_den2_custom = np.abs(np.fft.fft(np.fft.ifftshift(rxx2_biased)))
    
    plt.figure(figsize=(10, 6))
    plt.subplot(2, 1, 1)
    # Using linear scale, not dB as requested
    plt.plot(f_p1_custom[pos_p1], Pxx_den1_custom[pos_p1])
    plt.title("Periodogram of Signal 1 (From DFT of ACF)")
    plt.ylabel("PSD (Linear Scale)")
    plt.grid(True)
    
    plt.subplot(2, 1, 2)
    plt.plot(f_p1_custom[pos_p1], Pxx_den2_custom[pos_p1])
    plt.title("Periodogram of Signal 2 (From DFT of ACF)")
    plt.xlabel("Frequency (Hz)")
    plt.ylabel("PSD (Linear Scale)")
    plt.grid(True)
    plt.tight_layout()
    plt.savefig('plots/task7.png')
    plt.close()

    # Find peaks for reporting
    pg_peaks, _ = signal.find_peaks(Pxx_den1_custom[pos_p1], height=np.max(Pxx_den1_custom[pos_p1])/4)
    print(f"Task 7 - Estimated Frequencies for Signal 1 from Periodogram: {f_p1_custom[pos_p1][pg_peaks]} Hz")

    # --- Task 8 & 9: Pisarenko/MUSIC ---
    print("Task 8 - PHD / MUSIC Decomposition")
    print("Signal has K=3 tones, so p=2K=6 frequency components. ACM size must be 7x7 for PHD.")
    M = 7
    # Unbiased ACF segment for the matrix
    r = rxx1_unbiased[center:center+M] 
    R = toeplitz(r)
    
    eigenvalues, eigenvectors = eigh(R)
    # Eigenvalues are sorted in ascending order.
    # For PHD with p=6 and M=7, the noise subspace has dimension 1 (corresponding to min eigenvalue)
    E_min = eigenvectors[:, 0]
    
    # Pseudo-spectrum is evaluated as |1 / V(e^jw)|^2
    w_phd, h_phd = signal.freqz(E_min, 1, worN=1000, fs=Fs)
    P_phd = 1.0 / (np.abs(h_phd)**2 + 1e-12)

    plt.figure(figsize=(10, 4))
    plt.plot(w_phd, 10*np.log10(P_phd))
    plt.title("PHD Pseudo-spectrum of Signal 1 (M=7)")
    plt.xlabel("Frequency (Hz)")
    plt.ylabel("Pseudo-power (dB)")
    plt.grid(True)
    plt.tight_layout()
    plt.savefig('plots/task9.png')
    plt.close()
    
    phd_peaks, _ = signal.find_peaks(10*np.log10(P_phd), height=np.max(10*np.log10(P_phd))-30)
    print(f"Task 9 - Estimated Frequencies for Signal 1 from PHD: {w_phd[phd_peaks]} Hz")

    # --- Task 10: AR Model ---
    # Least-squares solution implicitly solving Theta = (A^T A)^-1 A^T b
    p_ar = 10 # Order chosen suitably high
    N_samples = len(x1)
    
    # Constructing data matrix A and observation vector b
    A = np.zeros((N_samples - p_ar, p_ar))
    b_vec = x1[p_ar:]
    
    for i in range(p_ar):
        A[:, i] = x1[p_ar - 1 - i : N_samples - 1 - i]
        
    # Solve properly via Standard Least Squares Normal Equations
    # Theta = inv(A^T @ A) @ A^T @ b
    Theta = np.linalg.solve(A.T @ A, A.T @ b_vec)
    
    # The estimated AR filter coefficients V(z)
    a_ar = np.concatenate(([1], -Theta))
    
    w_ar, h_ar = signal.freqz(1, a_ar, worN=1000, fs=Fs)
    P_ar = np.abs(h_ar)**2
    
    plt.figure(figsize=(10, 4))
    plt.plot(w_ar, 10*np.log10(P_ar))
    plt.title(f"AR Model Spectrum of Signal 1 (Least Squares, p={p_ar})")
    plt.xlabel("Frequency (Hz)")
    plt.ylabel("Magnitude (dB)")
    plt.grid(True)
    plt.tight_layout()
    plt.savefig('plots/task10.png')
    plt.close()
    
    ar_peaks, _ = signal.find_peaks(10*np.log10(P_ar), height=np.max(10*np.log10(P_ar))-20)
    print(f"Task 10 - Estimated Frequencies for Signal 1 from AR model: {w_ar[ar_peaks]} Hz")

if __name__ == '__main__':
    run_lab1()
