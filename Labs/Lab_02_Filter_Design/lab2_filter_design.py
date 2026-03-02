import numpy as np
import matplotlib.pyplot as plt
import scipy.signal as signal
import os

def run_lab2():
    if not os.path.exists('plots'):
        os.makedirs('plots')
    
    # E/21/291 -> a=2, b=9, c=1
    a, b, c = 2, 9, 1
    d_sum = 12
    d = 3
    
    # Frequencies are given in rad/s, let's derive them
    w_p = 100 + np.sqrt(1.1 * a + 11 * b + 101 * c)
    w_s = w_p * (1 + np.sqrt(d / 10.0))
    
    Fs = 1000 # Hz
    f_p = w_p / (2 * np.pi)
    f_s = w_s / (2 * np.pi)
    
    delta_s = 0.1
    delta_p = 0.9
    
    Rs = -20 * np.log10(delta_s) # 20 dB
    Rp = -20 * np.log10(delta_p) # ~0.915 dB
    
    print("--- Filter Specifications ---")
    print(f"Passband cutoff w_p = {w_p:.2f} rad/s")
    print(f"Stopband cutoff w_s = {w_s:.2f} rad/s")
    print(f"Passband cutoff f_p = {f_p:.2f} Hz")
    print(f"Stopband cutoff f_s = {f_s:.2f} Hz")
    print(f"Max stopband gain delta_s = {delta_s} (Rs = {Rs:.2f} dB)")
    print(f"Min passband gain delta_p = {delta_p} (Rp = {Rp:.2f} dB)")
    
    # 1. IIR Order Calculation
    print("\n--- IIR Filter Orders ---")
    N_butt, Wn_butt = signal.buttord(f_p, f_s, Rp, Rs, fs=Fs)
    print(f"Butterworth Order: {N_butt}")
    
    N_cheb1, Wn_cheb1 = signal.cheb1ord(f_p, f_s, Rp, Rs, fs=Fs)
    print(f"Chebyshev Type I Order: {N_cheb1}")
    
    N_cheb2, Wn_cheb2 = signal.cheb2ord(f_p, f_s, Rp, Rs, fs=Fs)
    print(f"Chebyshev Type II Order: {N_cheb2}")
    
    # FIR Order Calculation
    # Transition width in normalized frequency (cycles/sample)
    delta_f = (f_s - f_p) / Fs
    # delta_w in radians/sample
    delta_w = 2 * np.pi * delta_f
    
    # Using general approximation N = C / delta_f
    # C depends on the window. 
    # Rectangular: N = 0.9 / delta_f * 2 roughly? Or standard formulas:
    # N = 4*pi / delta_w for Rect
    # N = 8*pi / delta_w for Bartlett, Hann, Hamming
    # N = 12*pi / delta_w for Blackman
    
    N_rect = int(np.ceil(4 * np.pi / delta_w))
    N_bart = int(np.ceil(8 * np.pi / delta_w))
    N_hann = int(np.ceil(8 * np.pi / delta_w))
    N_hamm = int(np.ceil(8 * np.pi / delta_w))
    N_blck = int(np.ceil(12 * np.pi / delta_w))
    
    # Needs to be odd for Type I FIR filter
    if N_rect % 2 == 0: N_rect += 1
    if N_bart % 2 == 0: N_bart += 1
    if N_hann % 2 == 0: N_hann += 1
    if N_hamm % 2 == 0: N_hamm += 1
    if N_blck % 2 == 0: N_blck += 1

    print("\n--- FIR Filter Orders ---")
    print(f"Boxcar (Rectangular) Order: {N_rect}")
    print(f"Bartlett (Triangular) Order: {N_bart}")
    print(f"Hann Order: {N_hann}")
    print(f"Hamming Order: {N_hamm}")
    print(f"Blackman Order: {N_blck}")
    
    # Define generic plotting functions
    def plot_filter_responses(b, a, name, filename_prefix):
        w, h = signal.freqz(b, a, worN=8000, fs=Fs)
        mag = 20 * np.log10(np.abs(h) + 1e-12)
        phase = np.unwrap(np.angle(h))
        
        # 1. Pole Zero
        z, p, k = signal.tf2zpk(b, a)
        plt.figure(figsize=(10, 4))
        plt.subplot(1, 2, 1)
        plt.scatter(np.real(z), np.imag(z), marker='o', color='blue', label='Zeros')
        plt.scatter(np.real(p), np.imag(p), marker='x', color='red', label='Poles')
        circle = plt.Circle((0, 0), 1, color='black', fill=False, linestyle='--')
        plt.gca().add_patch(circle)
        plt.title(f'{name} Pole-Zero')
        plt.xlabel('Real')
        plt.ylabel('Imaginary')
        plt.axis('equal')
        plt.grid()
        plt.legend()
        
        # 2. Impulse response
        n_impulse = 50 if len(p) > 0 else len(b) + 10
        impulse = np.zeros(n_impulse)
        impulse[0] = 1
        h_imp = signal.lfilter(b, a, impulse)
        
        plt.subplot(1, 2, 2)
        plt.stem(np.arange(n_impulse), h_imp)
        plt.title(f'{name} Impulse Response')
        plt.grid()
        plt.tight_layout()
        plt.savefig(f'plots/{filename_prefix}_pz_imp.png')
        plt.close()
        
        # 3. Frequency responses
        plt.figure(figsize=(10, 8))
        
        plt.subplot(3, 1, 1)
        plt.plot(w, mag)
        plt.title(f'{name} Gain Response')
        plt.ylabel('Magnitude (dB)')
        plt.grid()
        
        plt.subplot(3, 1, 2)
        plt.plot(w, phase)
        plt.title(f'{name} Phase Response')
        plt.ylabel('Phase (radians)')
        plt.grid()
        
        plt.subplot(3, 1, 3)
        w_gd, gd = signal.group_delay((b, a), w=8000, fs=Fs)
        plt.plot(w_gd, gd)
        plt.title(f'{name} Group Delay')
        plt.xlabel('Frequency (Hz)')
        plt.ylabel('Samples')
        plt.grid()
        
        plt.tight_layout()
        plt.savefig(f'plots/{filename_prefix}_freq.png')
        plt.close()

    # Create Filters
    filters = {}
    
    # IIR
    filters['Butterworth'] = signal.butter(N_butt, Wn_butt, btype='low', analog=False, fs=Fs)
    filters['Chebyshev_I'] = signal.cheby1(N_cheb1, Rp, Wn_cheb1, btype='low', analog=False, fs=Fs)
    filters['Chebyshev_II'] = signal.cheby2(N_cheb2, Rs, Wn_cheb2, btype='low', analog=False, fs=Fs)
    
    # FIR cutoff frequency for firwin is usually average of fp and fs
    f_c = (f_p + f_s) / 2
    
    filters['Boxcar'] = (signal.firwin(N_rect, f_c, window='boxcar', fs=Fs), [1.0])
    filters['Bartlett'] = (signal.firwin(N_bart, f_c, window='bartlett', fs=Fs), [1.0])
    filters['Hann'] = (signal.firwin(N_hann, f_c, window='hann', fs=Fs), [1.0])
    filters['Hamming'] = (signal.firwin(N_hamm, f_c, window='hamming', fs=Fs), [1.0])
    filters['Blackman'] = (signal.firwin(N_blck, f_c, window='blackman', fs=Fs), [1.0])
    
    # Plot Filter Characteristics
    for name, (b, a) in filters.items():
        plot_filter_responses(b, a, name.replace('_', ' '), name.lower())
        
    print("\nGenerated filter plots.")
        
    # Signals
    np.random.seed(42)
    t = np.arange(0, 1000) / Fs # 1 second
    noise = np.random.randn(len(t)) # Unit power
    
    # Chirp: x(t) = sin(2*pi*t^2 / 100) -> 0 to 100s
    t_chirp = np.arange(0, 100*Fs) / Fs
    chirp = np.sin(2 * np.pi * t_chirp**2 / 100)
    
    # Simulate for each filter
    for name, (b, a) in filters.items():
        # Noise
        y_noise = signal.lfilter(b, a, noise)
        
        Y_noise = np.fft.fft(y_noise)
        f_noise = np.fft.fftfreq(len(y_noise), 1/Fs)
        pos = f_noise >= 0
        
        f_psd, Pxx = signal.periodogram(y_noise, Fs)
        
        plt.figure(figsize=(10, 8))
        plt.subplot(3, 1, 1)
        plt.plot(t, y_noise)
        plt.title(f'{name.replace("_", " ")} Filtered White Noise')
        
        plt.subplot(3, 1, 2)
        plt.plot(f_noise[pos], np.abs(Y_noise[pos]))
        plt.title('DFT Spectrum')
        
        plt.subplot(3, 1, 3)
        plt.semilogy(f_psd, Pxx)
        plt.title('Power Spectrum')
        plt.xlabel('Frequency (Hz)')
        
        plt.tight_layout()
        plt.savefig(f'plots/{name.lower()}_noise.png')
        plt.close()
        
        # Chirp
        y_chirp = signal.lfilter(b, a, chirp)
        f_sft, t_sft, Zxx = signal.spectrogram(y_chirp, fs=Fs, nperseg=256)
        
        plt.figure(figsize=(10, 8))
        plt.subplot(2, 1, 1)
        # Plot only first 50 seconds to see details
        plt.plot(t_chirp[:50000], y_chirp[:50000])
        plt.title(f'{name.replace("_", " ")} Filtered Chirp (First 50s)')
        
        plt.subplot(2, 1, 2)
        plt.pcolormesh(t_sft, f_sft, 10 * np.log10(np.abs(Zxx)+1e-10), shading='gouraud')
        plt.title('Spectrogram')
        plt.xlabel('Time (s)')
        plt.ylabel('Frequency (Hz)')
        
        plt.tight_layout()
        plt.savefig(f'plots/{name.lower()}_chirp.png')
        plt.close()
        
    print("Generated noise and chirp plots.")

if __name__ == '__main__':
    run_lab2()
