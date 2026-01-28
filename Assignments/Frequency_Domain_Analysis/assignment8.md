# Assignment 8: Frequency-Domain Analysis – DTFT and DFS

## 1. DTFT of a Finite-Duration Signal

The signal is a rectangular pulse of length $N$:
$$ x[n] = \begin{cases} 1 & 0 \le n \le N-1 \\ 0 & \text{otherwise} \end{cases} $$

### (a) Closed Form Derivation
The DTFT is defined as:
$$ X(e^{j\omega}) = \sum_{n=-\infty}^{\infty} x[n]e^{-j\omega n} = \sum_{n=0}^{N-1} e^{-j\omega n} $$
This is a geometric series with ratio $r = e^{-j\omega}$ and first term $a=1$:
$$ X(e^{j\omega}) = \frac{1 - (e^{-j\omega})^N}{1 - e^{-j\omega}} = \frac{1 - e^{-j\omega N}}{1 - e^{-j\omega}} $$

### (b) Form involving sine functions and zero locations
To express in terms of sine, we pull out half-angle exponential factors:
$$ X(e^{j\omega}) = \frac{e^{-j\omega N/2} (e^{j\omega N/2} - e^{-j\omega N/2})}{e^{-j\omega/2} (e^{j\omega/2} - e^{-j\omega/2})} $$
Using the Euler identity $\sin(\theta) = \frac{e^{j\theta} - e^{-j\theta}}{2j}$:
$$ X(e^{j\omega}) = \frac{e^{-j\omega N/2} \cdot 2j \sin(\omega N/2)}{e^{-j\omega/2} \cdot 2j \sin(\omega/2)} = e^{-j\omega(N-1)/2} \frac{\sin(\omega N/2)}{\sin(\omega/2)} $$
This function is often called the "Dirichlet kernel" (scaled).

**Zero Locations:**
Zeros occur when the numerator is zero but the denominator is not.
$$ \sin(\omega N/2) = 0 \Rightarrow \frac{\omega N}{2} = k\pi \Rightarrow \omega = \frac{2\pi k}{N}, \quad k \in \mathbb{Z} $$
Exceptions: When $\sin(\omega/2) = 0$ (i.e., $\omega = 2\pi m$), the value is $N$ (using L'Hopital's rule), so these are not zeros.
Thus, zeros are at $\omega = \frac{2\pi k}{N}$ for $k \ne mN$.

For $N=8$, zeros in $[-\pi, \pi]$ are at:
$$ \omega = \pm \frac{2\pi}{8}, \pm \frac{4\pi}{8}, \pm \frac{6\pi}{8} \Rightarrow \pm \frac{\pi}{4}, \pm \frac{\pi}{2}, \pm \frac{3\pi}{4} $$

### (c) Main-lobe and Side-lobe Structure
- **Main Lobe:** Centered at $\omega = 0$. Extends from the first negative zero ($-\frac{2\pi}{N}$) to the first positive zero ($+\frac{2\pi}{N}$).
  - Width = $\frac{4\pi}{N}$.
  - Peak amplitude = $N$ at $\omega = 0$.
- **Side Lobes:** Located between subsequent zeros. The amplitude of side lobes decreases as $\omega$ moves away from 0.
  - The width of each side lobe is $\frac{2\pi}{N}$.

---

## 2. Discrete Fourier Series (DFS)

Periodic signal with $N=4$:
$$ x[n] = \{1, 2, 3, 4\} \quad \text{for } n=0,1,2,3 $$

### (a) Compute DFS Coefficients
The DFS definition is:
$$ \tilde{X}[k] = \sum_{n=0}^{N-1} \tilde{x}[n] e^{-j\frac{2\pi}{N}kn} = \sum_{n=0}^{3} x[n] e^{-j\frac{\pi}{2}kn} $$

**For k=0:**
$$ X[0] = \sum_{n=0}^{3} x[n] = 1 + 2 + 3 + 4 = 10 $$

**For k=1:**
$$ X[1] = 1(e^0) + 2(e^{-j\pi/2}) + 3(e^{-j\pi}) + 4(e^{-j3\pi/2}) $$
$$ X[1] = 1 + 2(-j) + 3(-1) + 4(j) $$
$$ X[1] = 1 - 3 + j(4-2) = -2 + 2j $$

**For k=2:**
$$ X[2] = 1(e^0) + 2(e^{-j\pi}) + 3(e^{-j2\pi}) + 4(e^{-j3\pi}) $$
$$ X[2] = 1 + 2(-1) + 3(1) + 4(-1) $$
$$ X[2] = 1 - 2 + 3 - 4 = -2 $$

**For k=3:**
$$ X[3] = 1(e^0) + 2(e^{-j3\pi/2}) + 3(e^{-j3\pi}) + 4(e^{-j9\pi/2}) $$
Note $e^{-j3\pi/2} = j$, $e^{-j3\pi} = -1$, $e^{-j9\pi/2} = e^{-j\pi/2} = -j$.
$$ X[3] = 1(1) + 2(j) + 3(-1) + 4(-j) $$
$$ X[3] = 1 - 3 + j(2-4) = -2 - 2j $$

**Result:**
$$ X[k] = \{10, -2+2j, -2, -2-2j\} $$

### (b) Real vs Complex and Symmetry
- $X[0]$ and $X[2]$ are real.
- $X[1]$ and $X[3]$ are complex.
- **Reason:** For a real-valued sequence $x[n]$, the DFT/DFS is conjugate symmetric:
  $$ X[k] = X^*[N-k] $$
  - $X[1] = -2+2j$
  - $X[4-1] = X[3] = -2-2j$
  - indeed, $(-2+2j)^* = -2-2j$.
  - $X[0]$ and $X[N/2]=X[2]$ are their own conjugates, so they must be real.

---

## 3. Python Simulation Verification

### (c) Verification
The Python script computes the DTFT for $N=8$.
- **Expected Zero Locations:** $\omega = \pm \pi/4 \approx \pm 0.785$, $\pm \pi/2 \approx \pm 1.57$, $\pm 3\pi/4 \approx \pm 2.356$.
- **Expected Main Lobe Width:** $4\pi/8 = \pi/2 \approx 1.57$ (half-width from 0 to first zero is $\pi/4$).
*Note: Full width is distance between first nulls = $\pi/4 - (-\pi/4) = \pi/2$. Analytical result in 1(c) said $4\pi/N$, which is for $N=8 \rightarrow 4\pi/8 = \pi/2$. Correct.*

The plot `plots/dtft_magnitude.png` confirms these zero locations and the shape of the sinc-like function.
