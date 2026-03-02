import numpy as np
import scipy.signal as signal
import matplotlib.pyplot as plt
import os

def run_assignment11():
    if not os.path.exists('plots'):
        os.makedirs('plots')

    Fs = 200
    N = 1000
    n = np.arange(N)
    x = np.zeros(N)
    x[:500] = np.sin(2 * np.pi * 5 * n[:500] / Fs)
    x[500:] = np.sin(2 * np.pi * 50 * n[500:] / Fs)

    plt.figure(figsize=(10, 8))

    plt.subplot(2, 1, 1)
    f1, t1, Zxx1 = signal.stft(x, fs=Fs, window='hamming', nperseg=128, noverlap=64)
    plt.pcolormesh(t1, f1, np.abs(Zxx1), shading='gouraud')
    plt.title('STFT Spectrogram - Hamming Window 128 (50% Overlap)')
    plt.ylabel('Frequency (Hz)')

    plt.subplot(2, 1, 2)
    f2, t2, Zxx2 = signal.stft(x, fs=Fs, window='hamming', nperseg=32, noverlap=16)
    plt.pcolormesh(t2, f2, np.abs(Zxx2), shading='gouraud')
    plt.title('STFT Spectrogram - Hamming Window 32 (50% Overlap)')
    plt.xlabel('Time (s)')
    plt.ylabel('Frequency (Hz)')

    plt.tight_layout()
    plt.savefig('plots/spectrograms.png')
    print("Assignment 11 plot saved.")

if __name__ == '__main__':
    run_assignment11()
