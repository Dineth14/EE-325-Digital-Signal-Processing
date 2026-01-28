# Assignment 2: Time Domain Analysis of LTI Systems

## Objective
Analyze the time-domain response of a Linear Time-Invariant (LTI) system using difference equations in Python.

## System Description
The system is defined by the first-order difference equation:
$$y[n] = 0.5 y[n-1] + x[n]$$
Rearranging terms, this corresponds to the system:
$$y[n] - 0.5 y[n-1] = x[n]$$
Impulse Response expectation: $h[n] = (0.5)^n u[n]$.

## Simulation Results (`simulation.py`)

### 1. Impulse Response ($h[n]$)
- **Input:** $x[n] = \delta[n]$ (Unit Impulse).
- **Method:** Iteratively inferred $y[n]$ with $y[-1]=0$.
- **Result:**
    - $n=0: y[0] = 0.5(0) + 1 = 1$
    - $n=1: y[1] = 0.5(1) + 0 = 0.5$
    - $n=2: y[2] = 0.5(0.5) + 0 = 0.25$
- **Verification:** Follows the theoretical decay $h[n] = (0.5)^n$.

### 2. Step Response ($s[n]$)
- **Input:** $x[n] = u[n]$ (Unit Step).
- **Result:** Accumulates the impulse response.
    - $n=0: 1$
    - $n=1: 1 + 0.5 = 1.5$
    - $n=2: 1.5 + 0.25 = 1.75$
- **Steady State:** As $n \to \infty$, $s[n] \to \frac{1}{1 - 0.5} = 2$.

## Conclusion
The Python simulation successfully implements the recursive difference equation and visualizes the system's characteristic exponential decay (Stable IIR system).
