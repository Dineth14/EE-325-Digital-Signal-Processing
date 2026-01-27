import numpy as np
import matplotlib.pyplot as plt
import os

def plot_stem(n, y, title, filename):
    plt.figure(figsize=(8, 4))
    plt.stem(n, y, basefmt=" ")
    plt.title(title)
    plt.xlabel('n')
    plt.ylabel('Amplitude')
    plt.grid(True)
    plt.xticks(n)
    path = os.path.join('Convolution', 'plots', filename)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    plt.savefig(path)
    print(f"Saved plot to {path}")
    plt.close()

def main():
    # Q1
    x = np.array([1, 2, 1])
    h = np.array([1, -1, 2])
    nx = np.arange(len(x)) # 0, 1, 2
    nh = np.arange(len(h)) # 0, 1, 2
    
    y1 = np.convolve(x, h)
    ny1 = np.arange(len(y1)) # 0, 1, 2, 3, 4
    
    print("Q1 Result y[n]:", y1)
    plot_stem(ny1, y1, 'Q1: Convolution y[n] = x[n] * h[n]', 'Q1_Output.png')

    # Q2
    h1 = np.array([1, 1])
    h2 = np.array([1, -1, 1])
    # h1 is n=0,1 (len 2)
    # h2 is n=0,1,2 (len 3)
    
    heq = np.convolve(h1, h2)
    nheq = np.arange(len(heq)) # 0 to 4
    
    print("Q2 Result heq[n]:", heq)
    plot_stem(nheq, heq, 'Q2: Cascade Response heq[n]', 'Q2_Output.png')

if __name__ == "__main__":
    main()
