import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import scipy.signal as signal
from scipy.linalg import toeplitz, eigh, lstsq
import os

def run_lab1():
    out_dir = '.' # Working in outputs directory
    
    np.random.seed(42)
    # Student parameters: a=2, b=9, c=1
    f1, f2, f3 = 12, 39, 71
    Fs = 200
    # duration 0 <= t <= 100. Fs=200 -> N = 20000 or 20001
    t = np.arange(0, int(100*Fs)) / Fs
    N = len(t)
    
    nu = np.random.randn(N) # N(0, 1)

    # --- Signal Construction ---
    x1 = np.sin(2 * np.pi * f1 * t) + np.cos(2 * np.pi * f2 * t) + np.sin(2 * np.pi * f3 * t) + nu
    x2 = np.sin(20 * np.pi * t + 2 * np.pi * (t**2 / 150)) + nu

    # --- Task 1: Time domain plots ---
    plt.figure(figsize=(10, 6))
    plt.subplot(2, 1, 1)
    # 2 seconds = 400 samples
    idx2s = 400
    plt.plot(t[:idx2s], x1[:idx2s])
    plt.title("Signal 1 - Time Domain (First 2s)")
    plt.xlabel("Time (s)")
    plt.ylabel("Amplitude")
    plt.grid(True)
    
    plt.subplot(2, 1, 2)
    plt.plot(t[:idx2s], x2[:idx2s])
    plt.title("Signal 2 - Time Domain (First 2s)")
    plt.xlabel("Time (s)")
    plt.ylabel("Amplitude")
    plt.grid(True)
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, 'lab01_fig01_signals.png'), dpi=150, bbox_inches='tight')
    plt.close('all')

    # Histograms
    plt.figure(figsize=(10, 6))
    plt.subplot(2, 1, 1)
    plt.hist(x1, bins=50, color='skyblue', edgecolor='black')
    plt.title("Signal 1 - Histogram")
    plt.xlabel("Amplitude")
    plt.ylabel("Count")
    
    plt.subplot(2, 1, 2)
    plt.hist(x2, bins=50, color='lightgreen', edgecolor='black')
    plt.title("Signal 2 - Histogram")
    plt.xlabel("Amplitude")
    plt.ylabel("Count")
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, 'lab01_fig02_histograms.png'), dpi=150, bbox_inches='tight')
    plt.close('all')

    # --- Task 2/3: DFT ---
    from scipy.fft import fft, fftfreq
    X1 = fft(x1)
    X2 = fft(x2)
    f_xf = fftfreq(N, d=1/Fs)
    pos_idx = f_xf >= 0
    
    plt.figure(figsize=(10, 8))
    plt.subplot(2, 1, 1)
    plt.plot(f_xf[pos_idx], np.abs(X1[pos_idx]))
    plt.title("DFT Magnitude Spectrum of Signal 1")
    plt.xlabel("Frequency (Hz)")
    plt.ylabel("|X1[k]|")
    plt.grid(True)
    
    plt.subplot(2, 1, 2)
    plt.plot(f_xf[pos_idx], np.abs(X2[pos_idx]))
    plt.title("DFT Magnitude Spectrum of Signal 2")
    plt.xlabel("Frequency (Hz)")
    plt.ylabel("|X2[k]|")
    plt.grid(True)
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, 'lab01_fig03_dft.png'), dpi=150, bbox_inches='tight')
    plt.close('all')

    # --- Task 3/4: Spectrogram ---
    f_stft1, t_stft1, Zxx1 = signal.spectrogram(x1, fs=Fs, nperseg=512, noverlap=256)
    f_stft2, t_stft2, Zxx2 = signal.spectrogram(x2, fs=Fs, nperseg=512, noverlap=256)

    plt.figure(figsize=(10, 8))
    plt.subplot(2, 1, 1)
    plt.pcolormesh(t_stft1, f_stft1, 10 * np.log10(Zxx1 + 1e-10), shading='gouraud')
    plt.title("Spectrogram of Signal 1")
    plt.ylabel("Frequency (Hz)")
    
    plt.subplot(2, 1, 2)
    plt.pcolormesh(t_stft2, f_stft2, 10 * np.log10(Zxx2 + 1e-10), shading='gouraud')
    plt.title("Spectrogram of Signal 2")
    plt.ylabel("Frequency (Hz)")
    plt.xlabel("Time (sec)")
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, 'lab01_fig04_spectrogram.png'), dpi=150, bbox_inches='tight')
    plt.close('all')

    # --- Task 5: Autocorrelation Signal 1 ---
    # Built-in
    rxx1_raw = signal.correlate(x1, x1, mode='full')
    lags = signal.correlation_lags(N, N)
    rxx1_builtin = rxx1_raw / N
    
    # Power signal approximation
    R = np.zeros(N)
    for ell in range(N):
        R[ell] = (1.0/(N-ell)) * np.sum(x1[0:N-ell] * x1[ell:N])
    rxx1_power = np.concatenate((np.flip(R[1:]), R))
    
    center = len(rxx1_builtin) // 2
    max_lag = int(3 * Fs) # look at roughly 3 seconds
    
    plt.figure(figsize=(10, 8))
    plt.subplot(2, 1, 1)
    plt.plot(lags[center:center+max_lag]/Fs, rxx1_builtin[center:center+max_lag])
    plt.title("Autocorrelation of Signal 1 (Built-in, length-N normalization)")
    plt.xlabel("Lag (s)")
    plt.ylabel("R_xx")
    plt.grid(True)
    
    plt.subplot(2, 1, 2)
    plt.plot(lags[center:center+max_lag]/Fs, rxx1_power[center:center+max_lag])
    plt.title("Autocorrelation of Signal 1 (Power-Signal Approximation)")
    plt.xlabel("Lag (s)")
    plt.ylabel("R_xx")
    plt.grid(True)
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, 'lab01_fig05_autocorr_s1.png'), dpi=150, bbox_inches='tight')
    plt.close('all')

    # --- Task 6: Autocorrelation Signal 2 ---
    rxx2_raw = signal.correlate(x2, x2, mode='full')
    rxx2_builtin = rxx2_raw / N
    
    R2 = np.zeros(N)
    for ell in range(N):
        R2[ell] = (1.0/(N-ell)) * np.sum(x2[0:N-ell] * x2[ell:N])
    rxx2_power = np.concatenate((np.flip(R2[1:]), R2))
    
    plt.figure(figsize=(10, 8))
    plt.subplot(2, 1, 1)
    plt.plot(lags[center:center+max_lag]/Fs, rxx2_builtin[center:center+max_lag])
    plt.title("Autocorrelation of Signal 2 (Built-in)")
    plt.xlabel("Lag (s)")
    plt.ylabel("R_xx")
    plt.grid(True)
    
    plt.subplot(2, 1, 2)
    plt.plot(lags[center:center+max_lag]/Fs, rxx2_power[center:center+max_lag])
    plt.title("Autocorrelation of Signal 2 (Power-Signal Approximation)")
    plt.xlabel("Lag (s)")
    plt.ylabel("R_xx")
    plt.grid(True)
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, 'lab01_fig06_autocorr_s2.png'), dpi=150, bbox_inches='tight')
    plt.close('all')

    # --- Task 7: Periodogram ---
    Pxx1 = np.abs(fft(np.fft.ifftshift(rxx1_builtin)))
    Pxx2 = np.abs(fft(np.fft.ifftshift(rxx2_builtin)))
    f_p = fftfreq(len(rxx1_builtin), d=1/Fs)
    pos_p = f_p >= 0
    
    plt.figure(figsize=(10, 8))
    plt.subplot(2, 1, 1)
    plt.plot(f_p[pos_p], Pxx1[pos_p]) # linear scale
    plt.title("Periodogram of Signal 1 (from DFT of xcorr)")
    plt.xlabel("Frequency (Hz)")
    plt.ylabel("Power")
    plt.grid(True)
    
    plt.subplot(2, 1, 2)
    plt.plot(f_p[pos_p], Pxx2[pos_p])
    plt.title("Periodogram of Signal 2 (from DFT of xcorr)")
    plt.xlabel("Frequency (Hz)")
    plt.ylabel("Power")
    plt.grid(True)
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, 'lab01_fig07_periodogram.png'), dpi=150, bbox_inches='tight')
    plt.close('all')

    # --- Task 8: ACM Eigenvalues ---
    p = 6
    M = p + 1 # 7
    r = rxx1_power[center:center+M]
    R_mat = toeplitz(r)
    eigenvalues, eigenvectors = eigh(R_mat)
    
    plt.figure(figsize=(8, 6))
    plt.plot(np.arange(1, M+1), eigenvalues, 'o-')
    plt.title("Eigenvalues of the 7x7 Autocorrelation Matrix (Signal 1)")
    plt.xlabel("Index")
    plt.ylabel("Eigenvalue Magnitude")
    plt.grid(True)
    plt.savefig(os.path.join(out_dir, 'lab01_fig08_acm_eigenvalues.png'), dpi=150, bbox_inches='tight')
    plt.close('all')

    # --- Task 9: MUSIC Pseudo-Spectrum ---
    # Signal subspace has dimension 6, noise subspace has dimension 1 (N-p = 7-6 = 1)
    E_noise = eigenvectors[:, 0] # smallest eigenvalue corresponds to noise subspace
    
    f_search = np.linspace(0, Fs/2, 2000)
    P_music = np.zeros(len(f_search))
    
    for i, f_hz in enumerate(f_search):
        omega = 2 * np.pi * f_hz / Fs
        e_vec = np.exp(-1j * omega * np.arange(M))
        P_music[i] = 1.0 / np.abs(np.vdot(E_noise, e_vec))**2

    plt.figure(figsize=(10, 6))
    plt.plot(f_search, P_music)
    plt.title("MUSIC Pseudo-Spectrum (Signal 1)")
    plt.xlabel("Frequency (Hz)")
    plt.ylabel("Pseudo-Power (Linear)")
    plt.grid(True)
    plt.savefig(os.path.join(out_dir, 'lab01_fig09_music.png'), dpi=150, bbox_inches='tight')
    plt.close('all')

    # --- Task 10: AR Model ---
    p_ar = 10
    A = np.zeros((N - p_ar, p_ar))
    b = x1[p_ar:]
    for i in range(p_ar):
        A[:, i] = x1[p_ar - 1 - i : N - 1 - i]
    
    Theta, _, _, _ = lstsq(A, b, rcond=None)
    a_ar = np.concatenate(([1], -Theta))
    
    w_ar, h_ar = signal.freqz(1, a_ar, worN=2000, fs=Fs)
    P_ar = np.abs(h_ar)**2
    
    plt.figure(figsize=(10, 6))
    plt.plot(w_ar, P_ar)
    plt.title(f"AR Model Spectrum (Signal 1, Order N={p_ar})")
    plt.xlabel("Frequency (Hz)")
    plt.ylabel("Power (Linear)")
    plt.grid(True)
    plt.savefig(os.path.join(out_dir, 'lab01_fig10_ar.png'), dpi=150, bbox_inches='tight')
    plt.close('all')

if __name__ == '__main__':
    run_lab1()
