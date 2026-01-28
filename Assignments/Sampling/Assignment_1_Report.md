# Assignment 1: Sampling and Aliasing

## Objective
Demonstrate the effects of sampling a continuous-time signal at frequencies below the Nyquist rate (Aliasing).

## Problem Description
**Continuous Signal:**
A sine wave of frequency $f = 1000$ Hz is used:
$$x_c(t) = \sin(2\pi \cdot 1000 t)$$
**Nyquist Rate:**
The minimum sampling rate required to avoid aliasing is $2f_{max} = 2 \times 1000 = 2000$ Hz.

## Simulation Analysis
The Python script `E21291_Aliasing_demo.py` samples this signal at two different frequencies:

### Case 1: Sampling at $f_s = 600$ Hz
- **Observation:** Since $f_s = 600$ Hz $< 2000$ Hz, the system is **under-sampled**.
- **Result:** Aliasing occurs. The high-frequency original signal ($1000$ Hz) will appear as a lower frequency alias in the discrete domain.
- **Alias Frequency:** $|1000 - k \cdot 600|$. For $k=2$, $|1000 - 1200| = 200$ Hz (folded).

### Case 2: Sampling at $f_s = 1500$ Hz
- **Observation:** Since $f_s = 1500$ Hz $< 2000$ Hz, the system is also **under-sampled**.
- **Result:** Aliasing occurs.
- **Alias Frequency:** $|1000 - 1500| = 500$ Hz.

## Conclusion
The simulation visually demonstrates that sampling at a rate lower than the Nyquist rate results in a distorted or "aliased" signal that does not faithfully represent the original frequency. To correctly reconstruct the 1000 Hz sine wave, a sampling rate of at least 2000 Hz is required.
