import numpy as np
import matplotlib.pyplot as plt
from scipy.signal import lfilter
import os

def run_simulation():
    # Ensure plots directory exists
    if not os.path.exists('plots'):
        os.makedirs('plots')

    # Time vector 0 <= n <= 50
    n = np.arange(0, 51)
    
    # Input x[n] = u[n] (Unit Step)
    x = np.ones_like(n)

    # System A: y[n] - 0.5y[n-1] = x[n]
    # Transfer Function H(z) = 1 / (1 - 0.5z^-1)
    # b = [1], a = [1, -0.5]
    b_A = [1.0]
    a_A = [1.0, -0.5]
    y_A = lfilter(b_A, a_A, x)

    # System B: y[n] - 1.2y[n-1] = x[n]
    # Transfer Function H(z) = 1 / (1 - 1.2z^-1)
    # b = [1], a = [1, -1.2]
    b_B = [1.0]
    a_B = [1.0, -1.2]
    y_B = lfilter(b_B, a_B, x)

    # Plotting
    plt.figure(figsize=(12, 6))

    # Plot System A
    plt.subplot(1, 2, 1)
    plt.stem(n, y_A)
    plt.title('System A Response: Pole = 0.5 (Stable)')
    plt.xlabel('n')
    plt.ylabel('y_A[n]')
    plt.grid(True)

    # Plot System B
    plt.subplot(1, 2, 2)
    plt.stem(n, y_B)
    plt.title('System B Response: Pole = 1.2 (Unstable)')
    plt.xlabel('n')
    plt.ylabel('y_B[n]')
    plt.grid(True)

    plt.suptitle('Response to Step Input x[n] = u[n]')
    plt.tight_layout()
    
    # Save plot
    output_path = os.path.join('plots', 'system_responses.png')
    plt.savefig(output_path)
    print(f"Plot saved to {output_path}")

if __name__ == "__main__":
    run_simulation()
