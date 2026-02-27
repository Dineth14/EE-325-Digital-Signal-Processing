import numpy as np
import matplotlib.pyplot as plt
import os

def run_dtft_simulation():
    # Ensure plots directory exists
    if not os.path.exists('plots'):
        os.makedirs('plots')

    # Parameters
    N = 8
    
    # Define frequency range [-pi, pi]
    w = np.linspace(-np.pi, np.pi, 1000)
    
    # Compute DTFT analytically using the derived formula (Part 1b)
    # X(e^jw) = e^{-jw(N-1)/2} * sin(wN/2) / sin(w/2)
    # Handle w=0 case separately to avoid division by zero
    
    # Numerator: sin(wN/2)
    num = np.sin(w * N / 2)
    # Denominator: sin(w/2)
    den = np.sin(w / 2)
    
    # Magnitude |X(e^jw)| = |sin(wN/2) / sin(w/2)|
    # At w=0, limit is N.
    
    X_mag = np.abs(num / den)
    
    # Fix NaN at w=0 (and +/- 2pi if in range, but range is [-pi, pi])
    # Find indices close to 0
    zero_indices = np.where(np.isclose(den, 0))
    X_mag[zero_indices] = N

    # Plotting
    plt.figure(figsize=(10, 6))
    plt.plot(w, X_mag, linewidth=2, label='|X(e^{j\omega})|')
    
    # Mark zeros
    # Zeros at 2*pi*k/N within [-pi, pi]
    # k = -3, -2, -1, 1, 2, 3 (k=0 is peak, k=4 is pi which is usually 0 but border case)
    # For N=8, zeros at +/- pi/4, +/- pi/2, +/- 3pi/4.
    zeros = [
        -3*np.pi/4, -np.pi/2, -np.pi/4,
        np.pi/4, np.pi/2, 3*np.pi/4
    ]
    
    plt.scatter(zeros, np.zeros_like(zeros), color='red', zorder=5, label='Zeros')
    
    # Annotate zeros
    for z in zeros:
        plt.annotate(f'{z/np.pi:.2f}$\pi$', (z, 0), xytext=(0, 10), 
                     textcoords='offset points', ha='center', fontsize=10)

    plt.title(f'DTFT Magnitude of Rectangular Pulse (N={N})')
    plt.xlabel('Frequency $\omega$ (radians)')
    plt.ylabel('Magnitude |X($e^{j\omega}$)|')
    plt.xlim([-np.pi, np.pi])
    plt.grid(True)
    plt.legend()
    
    # Custom ticks
    plt.xticks(
        [-np.pi, -3*np.pi/4, -np.pi/2, -np.pi/4, 0, np.pi/4, np.pi/2, 3*np.pi/4, np.pi],
        ['$-\pi$', '$-3\pi/4$', '$-\pi/2$', '$-\pi/4$', '0', '$\pi/4$', '$\pi/2$', '$3\pi/4$', '$\pi$']
    )

    plt.tight_layout()
    
    # Save plot
    output_path = os.path.join('plots', 'dtft_magnitude.png')
    plt.savefig(output_path)
    print(f"Plot saved to {output_path}")

if __name__ == "__main__":
    run_dtft_simulation()
