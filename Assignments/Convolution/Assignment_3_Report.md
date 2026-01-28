# Assignment 3: Discrete Time Convolution

## Objective
Verify the calculation of linear convolution for discrete-time sequences using Python.

## Q1: Linear Convolution
**Sequences:**
- $x[n] = [1, 2, 1]$
- $h[n] = [1, -1, 2]$

**Convolution $y[n] = x[n] * h[n]$:**
Using `numpy.convolve`:
- Length of $y$: $L_x + L_h - 1 = 3 + 3 - 1 = 5$.
- Result:
    - $y[0] = 1$
    - $y[1] = 1$
    - $y[2] = 1$
    - $y[3] = 3$
    - $y[4] = 2$
- **Verified Output:** `[1, 1, 1, 3, 2]`

## Q2: Cascade Connection of Systems
**Systems:**
- $h_1[n] = [1, 1]$
- $h_2[n] = [1, -1, 1]$

**Equivalent Impulse Response $h_{eq}[n]$:**
For cascade systems, $h_{eq}[n] = h_1[n] * h_2[n]$.
- Length: $2 + 3 - 1 = 4$.
- Calculation:
    - $h_{eq}[0] = 1$
    - $h_{eq}[1] = 0$
    - $h_{eq}[2] = 0$
    - $h_{eq}[3] = 1$
- **Verified Output:** `[1, 0, 0, 1]`

## Conclusion
The script `convolution_verification.py` confirms that Python's numerical convolution matches the analytical expectations for both single-stage and cascade LTI systems.
