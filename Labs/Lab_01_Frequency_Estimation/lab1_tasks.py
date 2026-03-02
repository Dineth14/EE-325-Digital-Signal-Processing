import numpy as np
import matplotlib.pyplot as plt
import scipy.signal as signal
from scipy.linalg import toeplitz, eigh
import os

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
    t = np.arange(0, 100*Fs + 1) / Fs # 0 to 100s

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

    plt.subplot(2, 2, 3)
    plt.plot(t[:200], x2[:200])
    plt.title("Signal 2 - Time Domain (First 1s)")
    plt.xlabel("Time (s)")
    plt.ylabel("Amplitude")

    plt.subplot(2, 2, 4)
    plt.hist(x2, bins=50, color='lightgreen', edgecolor='black')
    plt.title("Signal 2 - Histogram")

    plt.tight_layout()
    plt.savefig('plots/task2.png')

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
    
    plt.subplot(2, 1, 2)
    plt.plot(f_xf[pos_idx], np.abs(X2[pos_idx]))
    plt.title("DFT Spectrum of Signal 2")
    plt.xlabel("Frequency (Hz)")
    plt.ylabel("Magnitude")
    
    plt.tight_layout()
    plt.savefig('plots/task3.png')

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
    plt.title("Spectrogram of Signal 2")
    plt.ylabel("Frequency (Hz)")
    plt.xlabel("Time (sec)")
    
    plt.tight_layout()
    plt.savefig('plots/task4.png')
    
    # Estimate from spectrogram means observing horizontal bands for Signal 1
    freqs_stft = f_stft1[np.argmax(np.mean(Zxx1, axis=1))] # crude peak finder
    # For a list of frequencies, we can extract peaks from the average power over time
    avg_power1 = np.mean(Zxx1, axis=1)
    p_idx, _ = signal.find_peaks(avg_power1, height=np.max(avg_power1)/4)
    print(f"Task 4 - Estimated Frequencies for Signal 1 from STFT: {f_stft1[p_idx]} Hz")

    # --- Task 5: Autocorrelation of Signal 1 ---
    rxx1 = signal.correlate(x1, x1, mode='full')
    lags = signal.correlation_lags(len(x1), len(x1))
    
    # Power signal autocorrelation scaling
    rxx1 = rxx1 / len(x1)
    center = len(rxx1) // 2
    
    # We look up to 3 seconds to find the fundamental period peak
    max_lag = int(3 * Fs)
    
    plt.figure(figsize=(10, 4))
    plt.plot(lags[center:center+max_lag]/Fs, rxx1[center:center+max_lag])
    plt.title("Autocorrelation of Signal 1 (Up to 3s)")
    plt.xlabel("Lag (s)")
    plt.ylabel("R_xx")
    plt.grid(True)
    plt.tight_layout()
    plt.savefig('plots/task5.png')
    
    print("Task 5 - Based on GCD(12, 39, 71)=1 Hz, expected fundamental period is 1 second.")

    # --- Task 6: Autocorrelation of Signal 2 ---
    rxx2 = signal.correlate(x2, x2, mode='full')
    rxx2 = rxx2 / len(x2)
    
    plt.figure(figsize=(10, 4))
    plt.plot(lags[center:center+max_lag]/Fs, rxx2[center:center+max_lag])
    plt.title("Autocorrelation of Signal 2 (Up to 3s)")
    plt.xlabel("Lag (s)")
    plt.ylabel("R_xx")
    plt.grid(True)
    plt.tight_layout()
    plt.savefig('plots/task6.png')

    # --- Task 7: Periodograms ---
    f_p1, Pxx_den1 = signal.periodogram(x1, Fs)
    f_p2, Pxx_den2 = signal.periodogram(x2, Fs)

    plt.figure(figsize=(10, 6))
    plt.subplot(2, 1, 1)
    plt.semilogy(f_p1, Pxx_den1)
    plt.title("Periodogram of Signal 1")
    plt.ylabel("PSD")
    
    plt.subplot(2, 1, 2)
    plt.semilogy(f_p2, Pxx_den2)
    plt.title("Periodogram of Signal 2")
    plt.xlabel("Frequency (Hz)")
    plt.ylabel("PSD")
    plt.tight_layout()
    plt.savefig('plots/task7.png')

    pg_peaks, _ = signal.find_peaks(Pxx_den1, height=np.max(Pxx_den1)/4)
    print(f"Task 7 - Estimated Frequencies for Signal 1 from Periodogram: {f_p1[pg_peaks]} Hz")

    # --- Task 8 & 9: Pisarenko/MUSIC ---
    print("Task 8 - Pisarenko decomposition size: for 3 real sinusoids, 6 complex exponentials. M >= 7.")
    M = 15 # Choosing an appropriate size for MUSIC pseudo-spectrum
    # unbiased ACF segment
    r = rxx1[center:center+M] 
    R = toeplitz(r)
    
    eigenvalues, eigenvectors = eigh(R)
    # p = number of complex sinusoids = 6. 
    # Noise subspace = eigenvectors[:, :M - 6]
    E_n = eigenvectors[:, :-6]

    f_search = np.linspace(0, Fs/2, 1000)
    P_music = np.zeros(len(f_search))

    for i, f in enumerate(f_search):
        omega = 2 * np.pi * f / Fs
        a = np.exp(-1j * omega * np.arange(M))
        P_music[i] = 1.0 / np.abs( a.conj().T @ E_n @ E_n.conj().T @ a )

    plt.figure(figsize=(10, 4))
    plt.plot(f_search, 10*np.log10(P_music))
    plt.title("MUSIC Pseudo-spectrum of Signal 1 (M=15)")
    plt.xlabel("Frequency (Hz)")
    plt.ylabel("Pseudo-power (dB)")
    plt.grid(True)
    plt.tight_layout()
    plt.savefig('plots/task9.png')
    
    music_peaks, _ = signal.find_peaks(10*np.log10(P_music), height=np.max(10*np.log10(P_music))-20)
    print(f"Task 9 - Estimated Frequencies for Signal 1 from MUSIC: {f_search[music_peaks]} Hz")

    # --- Task 10: AR Model ---
    p_ar = 10 # Model order
    r_yw = r[:p_ar+1]
    R_yw = toeplitz(r_yw[:-1])
    r_rhs = r_yw[1:]
    a_ar = np.linalg.solve(R_yw, r_rhs)
    a_ar = np.insert(-a_ar, 0, 1) # Auto-regressive coefficients [1, -a1, -a2, ...]

    w, h = signal.freqz(1, a_ar, worN=1000, fs=Fs)
    
    plt.figure(figsize=(10, 4))
    plt.plot(w, 20*np.log10(np.abs(h)))
    plt.title(f"AR Model Pseudo-spectrum of Signal 1 (Order={p_ar})")
    plt.xlabel("Frequency (Hz)")
    plt.ylabel("Magnitude (dB)")
    plt.grid(True)
    plt.tight_layout()
    plt.savefig('plots/task10.png')
    
    ar_peaks, _ = signal.find_peaks(20*np.log10(np.abs(h)), height=np.max(20*np.log10(np.abs(h)))-20)
    print(f"Task 10 - Estimated Frequencies for Signal 1 from AR model: {w[ar_peaks]} Hz")

if __name__ == '__main__':
    run_lab1()
