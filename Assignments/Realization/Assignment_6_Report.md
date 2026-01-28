# Assignment 6: Realization of Discrete-Time Systems

## 1. Direct Form I Realization

**Difference Equation:**
$$y[n] - 1.1y[n-1] + 0.3y[n-2] = x[n] + 0.5x[n-1]$$
$$y[n] = 1.1y[n-1] - 0.3y[n-2] + x[n] + 0.5x[n-1]$$

**Block Diagram (Direct Form I):**
Direct Form I implements the feedforward part ($x[n]$ terms) and feedback part ($y[n]$ terms) separately, connected in cascade.

```mermaid
graph LR
    x(x[n]) --> InputNode
    
    subgraph Feedforward
    InputNode --"b0=1"--> Add1((+))
    InputNode --"z^-1"--> D1[D]
    D1 --"b1=0.5"--> Add1
    end
    
    subgraph Feedback
    Add1 --> IntermediateNode
    IntermediateNode --> y(y[n])
    IntermediateNode --"z^-1"--> D2[D]
    D2 --"a1=1.1"--> Add2((+))
    D2 --"z^-1"--> D3[D]
    D3 --"a2=-0.3"--> Add2
    Add2 --> IntermediateNode
    end
```
*Note: The feedback coefficients are negative of difference equation LHS coeffs.*
Specifically for $y[n] = 1.1y[n-1] - 0.3y[n-2] + ...$:
- Tap from $y[n-1]$ is multiplied by $1.1$.
- Tap from $y[n-2]$ is multiplied by $-0.3$.

**Delay Elements:** 3 total ($1$ for $x$, $2$ for $y$). Note: This is non-canonic.

---

## 2. Direct Form II Realization

**(a) Block Diagram (Direct Form II - Canonic):**
Direct Form II shares the delay elements between the feedforward and feedback paths. We introduce an intermediate variable $w[n]$.
$$w[n] = x[n] + 1.1w[n-1] - 0.3w[n-2]$$
$$y[n] = w[n] + 0.5w[n-1]$$

```mermaid
graph TD
    Input(x[n]) --> Add1((+))
    Add1 --> w_n(w[n])
    w_n --> Add2((+))
    Add2 --> Output(y[n])
    
    w_n --"z^-1"--> D1[D]
    D1 --"1.1"--> Add1
    D1 --"0.5"--> Add2
    
    D1 --"z^-1"--> D2[D]
    D2 --"-0.3"--> Add1
```

**(b) Memory Comparison:**
- **Direct Form I:** Requires $M + N = 1 + 2 = 3$ delay elements ($x[n-1]$, $y[n-1]$, $y[n-2]$).
- **Direct Form II:** Requires $\max(M, N) = \max(1, 2) = 2$ delay elements ($w[n-1]$, $w[n-2]$).
**Conclusion:** Direct Form II is more memory efficient (Canonical).

**(c) Numerical Differences:**
Direct Form II is more sensitive to quantization effects (overflow/round-off) at the internal nodes ($w[n]$) compared to Direct Form I, especially for high-Q poles, because the poles solely determine the magnitude of the intermediate variable $w[n]$ before zeros can attenuate it.

---

## 3. Python – Implementing the Filter

**(a) & (b) Implementation:**
The script `filter_realization.py` implements the difference equation manually and compares it with `scipy.signal.lfilter`.

**(c) Verification Results:**
- **Max Difference:** The maximum difference between the manual loop and the optimized library function corresponds to machine epsilon levels (approx $10^{-16}$).
- **Graph:** The outputs overlap perfectly.

![Filter Comparison](filter_comparison.png)
