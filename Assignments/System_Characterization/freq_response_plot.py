import numpy as np
import matplotlib.pyplot as plt
from scipy import signal

def analyze_system():
    # System Equation:
    # y[n] - 1.1y[n-1] + 0.3y[n-2] = x[n] + 0.5x[n-1]
    # Transfer Function H(z) = (1 + 0.5z^-1) / (1 - 1.1z^-1 + 0.3z^-2)
    
    # Coefficients using standard form: a[0]y[n] + a[1]y[n-1] + ... = b[0]x[n] + b[1]x[n-1] + ...
    # a coeffs (denominator): [1, -1.1, 0.3]
    # b coeffs (numerator): [1, 0.5]
    
    b = [1, 0.5]
    a = [1, -1.1, 0.3]
    
    # Q2: Pole-Zero Analysis
    z, p, k = signal.tf2zpk(b, a)
    
    print("--- Pole-Zero Analysis ---")
    print(f"Zeros: {z}")
    print(f"Poles: {p}")
    
    # Stability Check
    is_stable = np.all(np.abs(p) < 1)
    print(f"System Stable? {is_stable} (Max pole magnitude: {np.max(np.abs(p)):.4f})")
    
    # Q3: Frequency Response
    # Compute for 0 <= omega <= pi
    w, h = signal.freqz(b, a)
    
    # Magnitude and Phase
    mag = 20 * np.log10(np.abs(h))
    phase = np.angle(h)
    
    # DC Gain (w=0) and Nyquist Gain (w=pi)
    dc_gain = np.abs(h[0])
    nyquist_gain = np.abs(h[-1])
    
    print("\n--- Frequency Response Analysis ---")
    print(f"DC Gain (w=0): {dc_gain:.4f} ({20*np.log10(dc_gain):.4f} dB)")
    print(f"Nyquist Gain (w=pi): {nyquist_gain:.4f} ({20*np.log10(nyquist_gain):.4f} dB)")
    
    # Plotting
    plt.figure(figsize=(12, 5))
    
    # Magnitude Plot
    plt.subplot(1, 2, 1)
    plt.plot(w, mag)
    plt.title('Digital Filter Frequency Response')
    plt.ylabel('Amplitude [dB]')
    plt.xlabel('Frequency [rad/sample]')
    plt.grid(True)
    plt.axvline(0, color='g', linestyle='--', alpha=0.5)
    plt.axvline(np.pi, color='g', linestyle='--', alpha=0.5)
    
    # Poles/Zeros Visualization (Complex Plane) - Optional but good for report
    # plt.figure(figsize=(6, 6))
    # plt.scatter(np.real(z), np.imag(z), marker='o', edgecolors='b', label='Zeros')
    # plt.scatter(np.real(p), np.imag(p), marker='x', color='r', label='Poles')
    # circle = plt.Circle((0,0),1, fill=False, linestyle='dotted')
    # plt.gca().add_patch(circle)
    # plt.grid(True)
    # plt.title('Pole-Zero Plot')
    # plt.xlabel('Real')
    # plt.ylabel('Imaginary')
    # plt.legend()
    # plt.axis('equal')
    
    # Phase Plot
    plt.subplot(1, 2, 2)
    plt.plot(w, phase)
    plt.title('Phase Response')
    plt.ylabel('Phase [radians]')
    plt.xlabel('Frequency [rad/sample]')
    plt.grid(True)
    
    plt.tight_layout()
    plt.savefig('frequency_response.png')
    print("Plot saved to frequency_response.png")
    
    # Generating Pole-Zero Plot specifically for Q2b if needed
    plt.figure(figsize=(6, 6))
    plt.scatter(np.real(z), np.imag(z), s=50, marker='o', edgecolors='b', facecolors='none', label='Zeros')
    plt.scatter(np.real(p), np.imag(p), s=50, marker='x', color='r', label='Poles')
    circle = plt.Circle((0,0),1, fill=False, linestyle='dotted', color='k')
    plt.gca().add_patch(circle)
    plt.axhline(0, color='k', alpha=0.3)
    plt.axvline(0, color='k', alpha=0.3)
    plt.grid(True, linestyle=':', alpha=0.6)
    plt.title('Pole-Zero Plot')
    plt.xlabel('Real Part')
    plt.ylabel('Imaginary Part')
    plt.legend()
    plt.axis('equal')
    plt.xlim([-1.5, 1.5])
    plt.ylim([-1.5, 1.5])
    plt.savefig('pole_zero_plot.png')
    print("Plot saved to pole_zero_plot.png")

if __name__ == "__main__":
    analyze_system()
