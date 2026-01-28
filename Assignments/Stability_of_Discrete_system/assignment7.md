# Assignment 7: Stability of Discrete-Time Systems

## 1. BIBO Stability from Impulse Response

A linear time-invariant (LTI) system is BIBO stable if and only if the impulse response is absolutely summable:
$$ \sum_{n=-\infty}^{\infty} |h[n]| < \infty $$

### (a) $h_1[n] = 2^n u[n]$
$$ \sum_{n=-\infty}^{\infty} |2^n u[n]| = \sum_{n=0}^{\infty} 2^n = 1 + 2 + 4 + \dots = \infty $$
**Conclusion:** Unstable. The sum diverges.

### (b) $h_2[n] = (-0.5)^n u[n]$
$$ \sum_{n=-\infty}^{\infty} |(-0.5)^n u[n]| = \sum_{n=0}^{\infty} |(-0.5)|^n = \sum_{n=0}^{\infty} (0.5)^n $$
Using geometric series sum $\sum_{n=0}^{\infty} r^n = \frac{1}{1-r}$ for $|r| < 1$:
$$ \sum_{n=0}^{\infty} (0.5)^n = \frac{1}{1-0.5} = \frac{1}{0.5} = 2 < \infty $$
**Conclusion:** Stable. The sum is finite.

### (c) $h_3[n] = u[n]$
$$ \sum_{n=-\infty}^{\infty} |u[n]| = \sum_{n=0}^{\infty} 1 = 1 + 1 + 1 + \dots = \infty $$
**Conclusion:** Unstable. The sum diverges.

## 2. Jury Stability Test

Characteristic polynomial: $p(z) = z^2 - 1.7z + 0.6$.
Coefficients: $a_2 = 1, a_1 = -1.7, a_0 = 0.6$.

### (a) Jury Table and Conditions
For a 2nd order system ($N=2$), the necessary and sufficient conditions for stability are:
1. $P(1) > 0$
2. $(-1)^2 P(-1) > 0 \Rightarrow P(-1) > 0$
3. $|a_0| < a_2$ (assuming $a_2 > 0$)

**Checking Conditions:**
1. $P(1) = (1)^2 - 1.7(1) + 0.6 = 1 - 1.7 + 0.6 = -0.1$
   - Condition $P(1) > 0$ is **FALSE**.
2. $P(-1) = (-1)^2 - 1.7(-1) + 0.6 = 1 + 1.7 + 0.6 = 3.3$
   - Condition $P(-1) > 0$ is **TRUE**.
3. $|a_0| < a_2 \Rightarrow |0.6| < 1$
   - Condition is **TRUE**.

**Conclusion:** Since the first condition fails ($P(1) = -0.1 \ngtr 0$), the system is **UNSTABLE**.

### (b) Verification with Roots
Roots of $z^2 - 1.7z + 0.6 = 0$:
$$ z = \frac{1.7 \pm \sqrt{(-1.7)^2 - 4(1)(0.6)}}{2} = \frac{1.7 \pm \sqrt{2.89 - 2.4}}{2} $$
$$ z = \frac{1.7 \pm \sqrt{0.49}}{2} = \frac{1.7 \pm 0.7}{2} $$
$$ z_1 = \frac{2.4}{2} = 1.2, \quad z_2 = \frac{1.0}{2} = 0.5 $$
Only stable if all poles satisfy $|z| < 1$.
Here, $|z_1| = 1.2 > 1$.
**Conclusion:** The system is **UNSTABLE**, consistent with the Jury test.

## 3. Python Simulation Analysis

### (c) Explanation of Behavior
- **System A:** $y[n] - 0.5y[n-1] = x[n]$
  - Characteristic equation: $z - 0.5 = 0 \Rightarrow z = 0.5$.
  - Since $|z| = 0.5 < 1$, the pole is inside the unit circle.
  - **Expectation:** Stable system, bounded output for bounded input.

- **System B:** $y[n] - 1.2y[n-1] = x[n]$
  - Characteristic equation: $z - 1.2 = 0 \Rightarrow z = 1.2$.
  - Since $|z| = 1.2 > 1$, the pole is outside the unit circle.
  - **Expectation:** Unstable system, unbounded output (exponential growth) for bounded input.

The simulation plots (see `plots/system_responses.png`) confirm this: System A settles or remains bounded, while System B grows exponentially.
