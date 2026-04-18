import numpy as np
import matplotlib.pyplot as plt
import scipy.signal as signal
import os
import math

def run_lab2():
    if not os.path.exists('plots'):
        os.makedirs('plots')
    
    # E/21/291 -> a=2, b=9, c=1
    a, b, c = 2, 9, 1
    d_sum = 12
    d = 3
    
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
    
    # 1. IIR Order Calculation using Analytical Formulas
    print("\n--- IIR Filter Orders (Analytically Computed) ---")
    term_s = (1.0 / delta_s**2) - 1.0
    term_p = (1.0 / delta_p**2) - 1.0
    ratio_w = w_s / w_p
    
    N_butt_calc = math.log10(math.sqrt(term_s / term_p)) / math.log10(ratio_w)
    N_butt = math.ceil(N_butt_calc)
    print(f"Butterworth Order: {N_butt} (computed: {N_butt_calc:.4f})")
    
    N_cheb_calc = math.acosh(math.sqrt(term_s / term_p)) / math.acosh(ratio_w)
    N_cheb1 = math.ceil(N_cheb_calc)
    N_cheb2 = math.ceil(N_cheb_calc)
    print(f"Chebyshev Type I Order: {N_cheb1} (computed: {N_cheb_calc:.4f})")
    print(f"Chebyshev Type II Order: {N_cheb2} (computed: {N_cheb_calc:.4f})")
    
    # We still need the appropriate matching Wn frequencies to feed into scipy functions.
    # Scipy expects the digital pre-warped cutoff naturally matching the -3dB or passband points respectively.
    _, Wn_butt = signal.buttord(f_p, f_s, Rp, Rs, fs=Fs)
    _, Wn_cheb1 = signal.cheb1ord(f_p, f_s, Rp, Rs, fs=Fs)
    _, Wn_cheb2 = signal.cheb2ord(f_p, f_s, Rp, Rs, fs=Fs)
    
    # FIR Order Calculation
    delta_f = (f_s - f_p) / Fs
    delta_w = 2 * np.pi * delta_f
    
    N_rect = math.ceil(4 * np.pi / delta_w)
    N_bart = math.ceil(8 * np.pi / delta_w)
    N_hann = math.ceil(8 * np.pi / delta_w)
    N_hamm = math.ceil(8 * np.pi / delta_w)
    N_blck = math.ceil(12 * np.pi / delta_w)
    
    # Type I FIR needs odd order (even order parameter in firwin)
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
        circle = plt.Circle((0, 0), 1, color='gray', fill=False, linestyle='--')
        plt.gca().add_patch(circle)
        plt.title(f'{name} Pole-Zero')
        plt.xlabel('Real')
        plt.ylabel('Imaginary')
        plt.axis('equal')
        plt.xlim([-1.5, 1.5])
        plt.ylim([-1.5, 1.5])
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
    
    # FIR cutoff frequency
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
        
    np.random.seed(42)
    t = np.arange(0, 1000) / Fs # 1 second
    noise = np.random.randn(len(t)) # Unit power
    
    # Chirp: x(t) = sin(2*pi*t^2 / 100) -> 0 to 100s
    t_chirp = np.arange(0, 100*Fs) / Fs
    chirp = np.sin(2 * np.pi * t_chirp**2 / 100)
    
    for name, (b, a) in filters.items():
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
        plt.plot(t_chirp[:5000], y_chirp[:5000]) # Zoomed in
        plt.title(f'{name.replace("_", " ")} Filtered Chirp (First 5s)')
        
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
