import numpy as np
import scipy.signal as signal
import matplotlib.pyplot as plt
import os

def run_assignment13():
    if not os.path.exists('plots'):
        os.makedirs('plots')

    # Low-pass FIR via window
    N = 21
    M = 10
    wc = 0.4 * np.pi
    n = np.arange(N)
    
    # Handle singularity at n = M
    hd = np.zeros(N)
    for i in range(N):
        if i == M:
            hd[i] = wc / np.pi
        else:
            hd[i] = np.sin(wc * (i - M)) / (np.pi * (i - M))
            
    w_hamming = 0.54 - 0.46 * np.cos(2 * np.pi * n / (N - 1))
    hlp = hd * w_hamming

    # High-pass FIR via frequency sampling
    N_hp = 16
    Hk = np.zeros(N_hp, dtype=complex)
    
    # 0.4pi * 16 / 2pi = 3.2 -> Cutoff bin is ~3.2. 
    # Zero out bins 0, 1, 2, 3. Set bins 4, 5, 6, 7, 8 to 1.
    Hk[4:9] = 1.0
    # Mirror for real symmetry
    Hk[9:13] = 1.0 # 16-7=9, 16-6=10, 16-5=11, 16-4=12
    # Hk[13,14,15] = 0 corresponds to k=3,2,1
    
    # IFFT creates circularly symmetric h[n] centered at 0
    hhp = np.real(np.fft.ifft(Hk))
    
    # Shift to center to make causal linear phase
    hhp_causal = np.fft.fftshift(hhp)

    w_lp, H_lp = signal.freqz(hlp, worN=1000)
    w_hp, H_hp = signal.freqz(hhp_causal, worN=1000)

    plt.figure(figsize=(10, 8))
    plt.subplot(2, 1, 1)
    plt.plot(w_lp / np.pi, 20 * np.log10(np.abs(H_lp) + 1e-12))
    plt.axvline(0.4, color='r', linestyle='--')
    plt.title('Low-Pass FIR (Window Method, N=21) Magnitude Response')
    plt.ylabel('Magnitude (dB)')
    plt.grid(True)
    plt.ylim(-100, 10)

    plt.subplot(2, 1, 2)
    plt.plot(w_hp / np.pi, 20 * np.log10(np.abs(H_hp) + 1e-12))
    plt.axvline(0.4, color='r', linestyle='--')
    plt.title('High-Pass FIR (Frequency Sampling, N=16) Magnitude Response')
    plt.xlabel('Frequency ($\times \pi$ rad/sample)')
    plt.ylabel('Magnitude (dB)')
    plt.ylim(-100, 10)
    plt.grid(True)

    plt.tight_layout()
    plt.savefig('plots/fir_comparison.png')
    print("Assignment 13 plot saved.")

if __name__ == '__main__':
    run_assignment13()
