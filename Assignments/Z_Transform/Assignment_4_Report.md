# Assignment 4: z-Transform and Inverse z-Transform

## 1. Forward z-Transform
**Question:** Find the z-transform $X(z)$ and region of convergence (ROC) of $x[n] = 0.5^n u[n]$.

**Solution:**
The definition of the z-transform is:
$$X(z) = \sum_{n=-\infty}^{\infty} x[n] z^{-n}$$

Substituting $x[n]$:
$$X(z) = \sum_{n=0}^{\infty} 0.5^n z^{-n} = \sum_{n=0}^{\infty} (0.5 z^{-1})^n$$

This is a geometric series of the form $\sum_{n=0}^{\infty} r^n = \frac{1}{1-r}$, which converges if $|r| < 1$.
Here, $r = 0.5z^{-1}$.

Convergence condition:
$$|0.5 z^{-1}| < 1 \implies \frac{0.5}{|z|} < 1 \implies |z| > 0.5$$

Result:
$$X(z) = \frac{1}{1 - 0.5z^{-1}} = \frac{z}{z - 0.5}$$

**ROC:** $|z| > 0.5$

---

## 2. Inverse z-Transform by Partial Fractions
**Question:** Given $X(z) = \frac{2z}{(z-1)(z+0.5)}$ and assuming valid causal $x[n]$, find $x[n]$.

**(a) Partial Fraction Expansion:**
We expand $\frac{X(z)}{z}$ to easily handle the roots:
$$\frac{X(z)}{z} = \frac{2}{(z-1)(z+0.5)} = \frac{A}{z-1} + \frac{B}{z+0.5}$$

finding A:
$$A = \left. \frac{2}{z+0.5} \right|_{z=1} = \frac{2}{1.5} = \frac{4}{3}$$

finding B:
$$B = \left. \frac{2}{z-1} \right|_{z=-0.5} = \frac{2}{-1.5} = -\frac{4}{3}$$

So,
$$\frac{X(z)}{z} = \frac{4/3}{z-1} - \frac{4/3}{z+0.5}$$
$$X(z) = \frac{4}{3} \frac{z}{z-1} - \frac{4}{3} \frac{z}{z+0.5}$$

**(b) Time-domain sequence x[n]:**
Using standard transform pairs for causal sequences ($|z| > 1$):
$$\frac{z}{z-a} \longleftrightarrow a^n u[n]$$

Term 1: $\frac{4}{3} (1)^n u[n]$
Term 2: $-\frac{4}{3} (-0.5)^n u[n]$

$$x[n] = \frac{4}{3} u[n] - \frac{4}{3} (-0.5)^n u[n]$$
$$x[n] = \frac{4}{3} [1 - (-0.5)^n] u[n]$$

**(c) Sketch and Decay:**
- For $n=0$: $x[0] = 4/3(1 - 1) = 0$
- For $n=1$: $x[1] = 4/3(1 - (-0.5)) = 4/3(1.5) = 2$
- For $n \to \infty$: $(-0.5)^n \to 0$, so $x[n] \to 4/3 \approx 1.33$

The system has a transient response due to the pole at $-0.5$ (alternating decay) and a steady-state response due to the pole at $1$ (step).

---

## 3. Python – Verification

**(a) Symbolic Derivation:**
Using `sympy` in the attached script `z_transform_verification.py`, we performed partial fraction decomposition on $X(z)/z$:
Output:
```
X(z)/z (Partial Fractions): 1.33333333333333/(z - 1) - 1.33333333333333/(z + 0.5)
```
This confirms $A = 4/3$ and $B = -4/3$.

**(b) Comparison:**
The symbolic result matches the analytical result perfectly. Python derived:
$$x[n] = 1.333 \cdot 1^n - 1.333 \cdot (-0.5)^n$$

**(c) Discussion:**
Symbolic tools like `sympy` are extremely useful for z-transforms because:
1. They handle algebraic manipulation (PFE) automatically, reducing calculation errors.
2. They can directly compute inverse transforms for complex expressions.
3. They allow for rapid verification of manual work.

![x[n] Plot](x_n_plot.png)
