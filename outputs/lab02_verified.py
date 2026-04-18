import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import scipy.signal as signal
import math
import os

def run_lab2():
    out_dir = '.' # Working in outputs directory
    
    # Filter constraints
    wp_analog = 114.22 # rad/s
    ws_analog = 176.76 # rad/s
    delta_s = 0.1
    delta_p = 0.9
    Fs = 1000
    
    # Pre-warping for IIR digital bounds
    Op = 2 * Fs * math.tan(wp_analog / (2 * Fs))
    Os = 2 * Fs * math.tan(ws_analog / (2 * Fs))
    
    ep = math.sqrt(1.0/(delta_p**2) - 1)
    es = math.sqrt(1.0/(delta_s**2) - 1)
    O_ratio = Os / Op
    
    N_butter_calc = math.log10(es / ep) / math.log10(O_ratio)
    N_butter = math.ceil(N_butter_calc)
    
    N_cheb_calc = math.acosh(es / ep) / math.acosh(O_ratio)
    N_cheby1 = math.ceil(N_cheb_calc)
    N_cheby2 = math.ceil(N_cheb_calc)
    
    print(f"IIR Orders: Butter={N_butter}, Cheby1={N_cheby1}, Cheby2={N_cheby2}")
    
    # FIR calculations
    dw_analog = ws_analog - wp_analog # 62.54 rad/s
    dw_norm = dw_analog / Fs # radians/sample
    
    N_boxcar = math.ceil(4 * math.pi / dw_norm) - 1
    N_bartlett = math.ceil(8 * math.pi / dw_norm) - 1
    N_hann = math.ceil(8 * math.pi / dw_norm) - 1
    N_hamming = math.ceil(8 * math.pi / dw_norm) - 1
    N_blackman = math.ceil(12 * math.pi / dw_norm) - 1
    
    # ensure symmetric odd lengths for type I linear phase (so order N must be even)
    # Harris filter order N is the number of taps - 1. 
    # FIR filters with N taps have order N-1. `firwin` takes numtaps which is N+1 if N is order.
    # The prompt formulas are for N (filter order). Thus numtaps = N + 1. 
    # Let's ensure order is even -> Type 1 FIR -> numtaps is odd.
    if N_boxcar % 2 != 0: N_boxcar += 1
    if N_bartlett % 2 != 0: N_bartlett += 1
    if N_hann % 2 != 0: N_hann += 1
    if N_hamming % 2 != 0: N_hamming += 1
    if N_blackman % 2 != 0: N_blackman += 1

    print(f"FIR Orders: Boxcar={N_boxcar}, Bartlett={N_bartlett}, Hann={N_hann}, Hamming={N_hamming}, Blackman={N_blackman}")
    
    # Generate Filters
    # IIR filters use direct frequencies for buttord/butter since they implicitly prewarp if analog=False
    # But we already computed N, so we just calculate natural frequencies.
    # For digital filters, cutoff requires normalization by Fs/2
    fp_norm = (wp_analog / (2 * math.pi)) / (Fs / 2)
    fs_norm = (ws_analog / (2 * math.pi)) / (Fs / 2)
    
    # Wn for butterworth can be calculated by buttord or set near passband
    N_butt_sp, Wn_butt = signal.buttord(fp_norm, fs_norm, -20*math.log10(delta_p), -20*math.log10(delta_s))
    N_c1_sp, Wn_c1 = signal.cheb1ord(fp_norm, fs_norm, -20*math.log10(delta_p), -20*math.log10(delta_s))
    N_c2_sp, Wn_c2 = signal.cheb2ord(fp_norm, fs_norm, -20*math.log10(delta_p), -20*math.log10(delta_s))

    filters = {
        'butter': signal.butter(N_butter, Wn_butt, btype='low', analog=False),
        'cheby1': signal.cheby1(N_cheby1, -20*math.log10(delta_p), Wn_c1, btype='low', analog=False),
        'cheby2': signal.cheby2(N_cheby2, -20*math.log10(delta_s), Wn_c2, btype='low', analog=False),
        'boxcar': (signal.firwin(N_boxcar + 1, (fp_norm+fs_norm)/2, window='boxcar'), [1.0]),
        'bartlett': (signal.firwin(N_bartlett + 1, (fp_norm+fs_norm)/2, window='bartlett'), [1.0]),
        'hann': (signal.firwin(N_hann + 1, (fp_norm+fs_norm)/2, window='hann'), [1.0]),
        'hamming': (signal.firwin(N_hamming + 1, (fp_norm+fs_norm)/2, window='hamming'), [1.0]),
        'blackman': (signal.firwin(N_blackman + 1, (fp_norm+fs_norm)/2, window='blackman'), [1.0])
    }
    
    # 5 base plots per filter + 2 input tasks
    for name, (b, a) in filters.items():
        w, h = signal.freqz(b, a, worN=8000, fs=Fs)
        z, p, k = signal.tf2zpk(b, a)
        
        # (a) Pole zero
        plt.figure(figsize=(6, 6))
        plt.scatter(np.real(z), np.imag(z), marker='o', color='blue', label='Zeros')
        plt.scatter(np.real(p), np.imag(p), marker='x', color='red', label='Poles')
        plt.gca().add_patch(plt.Circle((0,0), 1, color='gray', fill=False, linestyle='--'))
        plt.title(f"{name} Pole-Zero Plot")
        plt.xlabel("Real")
        plt.ylabel("Imaginary")
        plt.xlim([-1.5, 1.5])
        plt.ylim([-1.5, 1.5])
        plt.grid(True)
        plt.legend()
        plt.savefig(os.path.join(out_dir, f'lab02_fig_pz_{name}.png'), dpi=150, bbox_inches='tight')
        plt.close('all')
        
        # (b) Impulse response
        n_impulse = 60 if len(p) > 0 else len(b) + 10
        impulse = np.zeros(n_impulse)
        impulse[0] = 1
        h_imp = signal.lfilter(b, a, impulse)
        
        plt.figure(figsize=(8, 4))
        plt.stem(np.arange(n_impulse), h_imp)
        plt.title(f"{name} Impulse Response")
        plt.xlabel("n")
        plt.ylabel("h[n]")
        plt.grid(True)
        plt.savefig(os.path.join(out_dir, f'lab02_fig_impulse_{name}.png'), dpi=150, bbox_inches='tight')
        plt.close('all')
        
        # (c) Gain response
        plt.figure(figsize=(10, 8))
        plt.subplot(2, 1, 1)
        plt.plot(w, np.abs(h))
        plt.axvline(wp_analog/(2*math.pi), color='g', linestyle='--', label='fp')
        plt.axvline(ws_analog/(2*math.pi), color='r', linestyle='--', label='fs')
        plt.title(f"{name} Gain Response (Linear)")
        plt.xlabel("Frequency (Hz)")
        plt.ylabel("Magnitude")
        plt.grid(True)
        plt.legend()
        
        plt.subplot(2, 1, 2)
        plt.plot(w, 20*np.log10(np.abs(h)+1e-12))
        plt.axvline(wp_analog/(2*math.pi), color='g', linestyle='--')
        plt.axvline(ws_analog/(2*math.pi), color='r', linestyle='--')
        plt.axhline(20*math.log10(delta_p), color='g', linestyle=':')
        plt.axhline(20*math.log10(delta_s), color='r', linestyle=':')
        plt.title(f"{name} Gain Response (dB)")
        plt.xlabel("Frequency (Hz)")
        plt.ylabel("Magnitude (dB)")
        plt.grid(True)
        plt.tight_layout()
        plt.savefig(os.path.join(out_dir, f'lab02_fig_gain_{name}.png'), dpi=150, bbox_inches='tight')
        plt.close('all')
        
        # (d) Phase response
        plt.figure(figsize=(8, 4))
        plt.plot(w, np.unwrap(np.angle(h)))
        plt.title(f"{name} Phase Response")
        plt.xlabel("Frequency (Hz)")
        plt.ylabel("Phase (radians)")
        plt.grid(True)
        plt.savefig(os.path.join(out_dir, f'lab02_fig_phase_{name}.png'), dpi=150, bbox_inches='tight')
        plt.close('all')
        
        # (e) Group delay
        w_gd, gd = signal.group_delay((b, a), w=8000, fs=Fs)
        plt.figure(figsize=(8, 4))
        plt.plot(w_gd, gd)
        plt.title(f"{name} Group Delay")
        plt.xlabel("Frequency (Hz)")
        plt.ylabel("Group Delay (samples)")
        plt.grid(True)
        plt.savefig(os.path.join(out_dir, f'lab02_fig_gd_{name}.png'), dpi=150, bbox_inches='tight')
        plt.close('all')
        
        # Input Tasks
        # Noise
        np.random.seed(42)
        x_noise = np.random.randn(1000)
        y_noise = signal.lfilter(b, a, x_noise)
        
        Y_noise = np.fft.fft(y_noise)
        f_noise = np.fft.fftfreq(len(y_noise), 1/Fs)
        pos = f_noise >= 0
        
        # PSD = fft(xcorr(y, y))
        rxx_y = signal.correlate(y_noise, y_noise, mode='full')
        psd_y = np.abs(np.fft.fft(np.fft.ifftshift(rxx_y/len(y_noise))))
        f_psd = np.fft.fftfreq(len(rxx_y), 1/Fs)
        pos_psd = f_psd >= 0
        
        plt.figure(figsize=(10, 8))
        plt.subplot(3, 1, 1)
        plt.plot(np.arange(1000)/Fs, y_noise)
        plt.title(f"{name} Filtered Noise (Time)")
        plt.subplot(3, 1, 2)
        plt.plot(f_noise[pos], np.abs(Y_noise[pos]))
        plt.title(f"{name} Filtered Noise (DFT Magnitude)")
        plt.subplot(3, 1, 3)
        plt.semilogy(f_psd[pos_psd], psd_y[pos_psd])
        plt.title(f"{name} Filtered Noise (Power Spectrum)")
        plt.tight_layout()
        plt.savefig(os.path.join(out_dir, f'lab02_noise_{name}.png'), dpi=150, bbox_inches='tight')
        plt.close('all')
        
        # Chirp
        t_chirp = np.arange(0, 100*Fs) / Fs
        # 0 to 100s, freq goes 0 to 2Hz, correctly mapped linearly using instantaneous frequency = t/50
        x_chirp = np.sin(2 * np.pi * t_chirp**2 / 100)
        y_chirp = signal.lfilter(b, a, x_chirp)
        
        freqs, times, Sxx = signal.spectrogram(y_chirp, fs=Fs, nperseg=256)
        
        plt.figure(figsize=(10, 8))
        plt.subplot(2, 1, 1)
        plt.plot(t_chirp, y_chirp)
        plt.title(f"{name} Filtered Chirp (Time)")
        plt.subplot(2, 1, 2)
        plt.pcolormesh(times, freqs, 10 * np.log10(Sxx + 1e-10), shading='gouraud')
        plt.title(f"{name} Filtered Chirp (Spectrogram)")
        plt.ylabel('Frequency (Hz)')
        plt.xlabel('Time (s)')
        # Limit axis to focus on low freq band up to 10Hz
        plt.ylim([0, 10])
        plt.tight_layout()
        plt.savefig(os.path.join(out_dir, f'lab02_chirp_{name}.png'), dpi=150, bbox_inches='tight')
        plt.close('all')

if __name__ == '__main__':
    run_lab2()
