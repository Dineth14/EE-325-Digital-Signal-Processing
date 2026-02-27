import numpy as np
import time
import matplotlib.pyplot as plt
import os

def naive_dft(x):
    """Compute the Discrete Fourier Transform of the 1D array x."""
    N = len(x)
    n = np.arange(N)
    k = n.reshape((N, 1))
    e = np.exp(-2j * np.pi * k * n / N)
    return np.dot(e, x)

def run_timing():
    if not os.path.exists('plots'):
        os.makedirs('plots')
        
    N = 512
    # Generate random complex sequence: x[n] = a + jb, where a, b ~ U[0, 1]
    np.random.seed(42)
    x = np.random.rand(N) + 1j * np.random.rand(N)
    
    # 1. Warm-up and Time Naive DFT
    _ = naive_dft(x[:10]) 
    
    start_time = time.perf_counter()
    X_dft = naive_dft(x)
    dft_time = time.perf_counter() - start_time
    
    # 2. Warm-up and Time NumPy FFT
    _ = np.fft.fft(x[:10])
    
    start_time = time.perf_counter()
    X_fft = np.fft.fft(x)
    fft_time = time.perf_counter() - start_time
    
    # Verification
    diff = np.max(np.abs(X_dft - X_fft))
    
    speed_up = dft_time / fft_time if fft_time > 0 else float('inf')
    
    print(f"--- Timing Results for N={N} ---")
    print(f"Naive DFT time: {dft_time*1000:.4f} ms")
    print(f"NumPy FFT time: {fft_time*1000:.4f} ms")
    print(f"Max absolute difference: {diff:.2e}")
    print(f"Measured Speed-up factor (DFT/FFT): {speed_up:.2f}x")
    
    # Theoretical operation ratio:
    # DFT is O(N^2), FFT is O(N log2 N)
    # Ratio ≈ N / log2(N)
    theoretical_ratio = N / np.log2(N)
    print(f"Theoretical Ratio (N/log2(N)): {theoretical_ratio:.2f}")

    # Plot
    plt.figure(figsize=(8, 6))
    methods = ['Naive DFT', 'NumPy FFT']
    times = [dft_time * 1000, fft_time * 1000]
    
    plt.bar(methods, times, color=['#E24A33', '#348ABD'])
    plt.ylabel('Execution Time (ms)')
    plt.yscale('log') # Use logarithmic scale because difference is huge
    plt.title(f'DFT vs FFT Execution Time for N={N} (Log Scale)')
    
    for i, v in enumerate(times):
        plt.text(i, v*1.1, f"{v:.4f} ms", ha='center', fontweight='bold')
        
    plt.tight_layout()
    output_path = os.path.join('plots', 'timing_comparison.png')
    plt.savefig(output_path)
    print(f"Plot saved to {output_path}")

if __name__ == '__main__':
    run_timing()
