import numpy as np
import matplotlib.pyplot as plt
from scipy.signal import lfilter

def manual_filter(b, a, x):
    """
    Implement LCCDE manually: 
    a[0]y[n] = b[0]x[n] + b[1]x[n-1] + ... - a[1]y[n-1] - a[2]y[n-2] - ...
    Assumes a[0] = 1.
    """
    y = np.zeros_like(x)
    M = len(b)
    N = len(a)
    
    for n in range(len(x)):
        # Feedforward part (b coefficients)
        for i in range(M):
            if n - i >= 0:
                y[n] += b[i] * x[n - i]
        
        # Feedback part (a coefficients)
        for j in range(1, N): # start from 1 because a[0]y[n] is on LHS
            if n - j >= 0:
                y[n] -= a[j] * y[n - j]
                
    return y

def main():
    # System: y[n] - 1.1y[n-1] + 0.3y[n-2] = x[n] + 0.5x[n-1]
    # H(z) = (1 + 0.5z^-1) / (1 - 1.1z^-1 + 0.3z^-2)
    b = [1, 0.5]
    a = [1, -1.1, 0.3]
    
    # Input signal: Sum of sinusoids + noise
    fs = 100
    t = np.arange(0, 1, 1/fs)
    x = np.sin(2 * np.pi * 5 * t) + 0.5 * np.sin(2 * np.pi * 20 * t) + 0.1 * np.random.randn(len(t))
    
    # 1. Manual Implementation
    y_manual = manual_filter(b, a, x)
    
    # 2. Scipy Implementation
    y_lfilter = lfilter(b, a, x)
    
    # 3. Comparison
    difference = y_manual - y_lfilter
    max_diff = np.max(np.abs(difference))
    print(f"Max difference between Manual and Lfilter: {max_diff:.5e}")
    
    # Plotting
    plt.figure(figsize=(10, 6))
    
    plt.subplot(2, 1, 1)
    plt.plot(t, x, label='Input x[n]', alpha=0.7)
    plt.plot(t, y_manual, label='Output y[n] (Manual)', linestyle='--')
    plt.title('Filter Implementation Verification')
    plt.legend()
    plt.grid(True)
    plt.ylabel('Amplitude')
    
    plt.subplot(2, 1, 2)
    plt.plot(t, difference, label='Difference (Manual - Lfilter)', color='r')
    plt.title(f'Numerical Difference (Max Error: {max_diff:.2e})')
    plt.xlabel('Time (s)')
    plt.ylabel('Error')
    plt.grid(True)
    plt.legend()
    
    plt.tight_layout()
    plt.savefig('filter_comparison.png')
    print("Plot saved to filter_comparison.png")

if __name__ == "__main__":
    main()
