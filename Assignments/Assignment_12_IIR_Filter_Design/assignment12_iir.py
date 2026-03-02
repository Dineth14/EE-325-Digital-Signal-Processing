import numpy as np
import matplotlib.pyplot as plt
import os

def run_assignment12():
    if not os.path.exists('plots'):
        os.makedirs('plots')

    # Analog Filter
    W = np.linspace(0, 3, 1000)
    H_a = 1 / (1j * W + 1)
    mag_Ha = np.abs(H_a)

    # Digital Filters (mapped directly onto W axis since T=1 -> w=W)
    w = np.linspace(0, np.pi, 1000) # pi ~ 3.14
    
    # Impulse Invariance
    H_imp = 1 / (1 - np.exp(-1) * np.exp(-1j * w))
    mag_Himp = np.abs(H_imp)

    # Bilinear Transform
    H_bilin = (1 + np.exp(-1j * w)) / (3 - np.exp(-1j * w))
    mag_Hbilin = np.abs(H_bilin)

    plt.figure(figsize=(10, 6))
    plt.plot(W, mag_Ha, label='Analog Filter $|H_a(j\Omega)|$')
    plt.plot(w, mag_Himp, label='Impulse Invariance $|H_{imp}(e^{j\omega})|$', linestyle='--')
    plt.plot(w, mag_Hbilin, label='Bilinear Transform $|H_{bilin}(e^{j\omega})|$', linestyle='-.')
    
    plt.title('Frequency Response Comparison (Analog vs. Digital)')
    plt.xlabel('Frequency $\omega$ or $\Omega$ (rad/s)')
    plt.ylabel('Magnitude')
    plt.xlim(0, 3)
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.savefig('plots/filter_comparison.png')
    print("Assignment 12 plot saved.")

if __name__ == '__main__':
    run_assignment12()
