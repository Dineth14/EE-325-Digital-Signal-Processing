import numpy as np
import matplotlib.pyplot as plt
import os

def run_dft_convolution():
    # Ensure plots directory exists
    if not os.path.exists('plots'):
        os.makedirs('plots')

    # Given sequences
    x = np.array([1, 2, 3])
    h = np.array([1, 1, 1])

    print("--- (a) Linear Convolution ---")
    y_lin = np.convolve(x, h)
    print(f"y_lin[n] = {y_lin}")

    print("\n--- (b) 3-Point DFT Circular Convolution ---")
    N3 = 3
    # Compute 3-point DFTs
    X3 = np.fft.fft(x, n=N3)
    H3 = np.fft.fft(h, n=N3)
    
    # Multiply and IDFT
    Y3 = X3 * H3
    y_circ3 = np.fft.ifft(Y3)
    
    # The result of IDFT may have a tiny imaginary part due to floating point precision
    y_circ3 = np.real(y_circ3).round(decimals=5)
    print(f"y_circ3[n] = {y_circ3}")
    print("Comparison: y_circ3[n] does not match y_lin[n] due to time-domain aliasing.")

    print("\n--- (c) 5-Point Zero-Padded DFT Circular Convolution ---")
    # Linear convolution length = L_x + L_h - 1 = 3 + 3 - 1 = 5
    N5 = 5
    X5 = np.fft.fft(x, n=N5)
    H5 = np.fft.fft(h, n=N5)
    
    Y5 = X5 * H5
    y_circ5 = np.fft.ifft(Y5)
    
    y_circ5 = np.real(y_circ5).round(decimals=5)
    print(f"y_circ5[n] = {y_circ5}")
    print("Comparison: y_circ5[n] matches y_lin[n] exactly since N >= L_x + L_h - 1.")

    # Plotting to visualize the differences
    plt.figure(figsize=(12, 8))

    n_lin = np.arange(len(y_lin))
    n_circ3 = np.arange(len(y_circ3))
    n_circ5 = np.arange(len(y_circ5))

    plt.subplot(3, 1, 1)
    plt.stem(n_lin, y_lin)
    plt.title('Linear Convolution (N=5)')
    plt.ylabel('Amplitude')
    plt.grid(True)
    plt.xticks(np.arange(0, 6))

    plt.subplot(3, 1, 2)
    plt.stem(n_circ3, y_circ3)
    plt.title('Circular Convolution via 3-point DFT (N=3)')
    plt.ylabel('Amplitude')
    plt.grid(True)
    plt.xticks(np.arange(0, 6))

    plt.subplot(3, 1, 3)
    plt.stem(n_circ5, y_circ5)
    plt.title('Circular Convolution via 5-point DFT (N=5) - Matches Linear')
    plt.xlabel('n')
    plt.ylabel('Amplitude')
    plt.grid(True)
    plt.xticks(np.arange(0, 6))

    plt.tight_layout()
    
    output_path = os.path.join('plots', 'convolution_comparison.png')
    plt.savefig(output_path)
    print(f"\nPlot saved to {output_path}")

if __name__ == "__main__":
    run_dft_convolution()
