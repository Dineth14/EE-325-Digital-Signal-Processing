import sympy as sp
import numpy as np
import matplotlib.pyplot as plt

def verify_inverse_z_transform():
    # Define variables
    z = sp.symbols('z')
    n = sp.symbols('n', integer=True)
    
    # Q2: Inverse z-Transform of X(z) = 2z / ((z - 1)(z + 0.5))
    # We expand X(z)/z to perform Partial Fraction Expansion effectively
    # X(z) = 2z / ((z - 1)(z + 0.5))
    # PFE on X(z)/z = 2 / ((z - 1)(z + 0.5))
    
    X_z_expr = 2 * z / ((z - 1) * (z + 0.5))
    X_z_div_z = 2 / ((z - 1) * (z + 0.5))
    
    print("X(z) =", X_z_expr)
    print("\n--- Partial Fraction Expansion (Symbolic) ---")
    
    # Perform PFE on X(z)/z
    PFE_div_z = sp.apart(X_z_div_z, z)
    print("X(z)/z (Partial Fractions):", PFE_div_z)
    
    # Analyze terms
    # X(z)/z = A/(z-1) + B/(z+0.5)
    # X(z) = A*z/(z-1) + B*z/(z+0.5)
    # Using z-transform pairs:
    # z/(z-a) <--> a^n u[n]
    
    # Reconstruct X(z) from PFE
    X_z_reconstructed = PFE_div_z * z
    print("X(z) (PFE form):", sp.expand(X_z_reconstructed))
    
    print("\n--- Inverse z-Transform Derivation ---")
    # Manually printing expected forms based on PFE results from sympy
    # Sympy might output something like: 1.333/(z-1) - 1.333/(z+0.5)
    # Coefficients are usually extracted manually here for clarity in verification.
    
    # A = Res(X(z)/z, 1) = 2 / (1 + 0.5) = 2/1.5 = 4/3
    # B = Res(X(z)/z, -0.5) = 2 / (-0.5 - 1) = 2/-1.5 = -4/3
    # So X(z) = (4/3) * z/(z-1) - (4/3) * z/(z+0.5)
    # x[n] = (4/3)*(1)^n u[n] - (4/3)*(-0.5)^n u[n]
    
    x_n_analytical_str = "(4/3) * (1)**n - (4/3) * (-0.5)**n"
    print(f"Analytical x[n] (derived from PFE): {x_n_analytical_str} for n >= 0")
    
    print("\n--- Numerical Verification & Plotting ---")
    # Plot x[n] for n = 0 to 10
    n_vals = np.arange(0, 11)
    x_n_vals = (4/3) * (1.0)**n_vals - (4/3) * (-0.5)**n_vals
    
    print(f"x[0]: {x_n_vals[0]} (Expected: x[0] = lim z->inf X(z) = 0)") 
    # Wait, IVT: x[0] = lim z->inf X(z). 
    # X(z) = 2z / (z^2 - 0.5z - 0.5) ~ 2/z as z->inf -> 0.
    # Formula: 4/3 - 4/3 = 0. Correct.
    
    print(f"x[1]: {x_n_vals[1]}")
    # X(z) = 0 + x[1]z^-1 + ...
    # 2z / (z-1)(z+0.5) = 2z / (z^2 - 0.5z - 0.5) = 2/z * (1 / (1 - ...)) ...
    # Long division: 2z / (z^2 ...) -> 2/z ... so x[1]=2.
    # Formula: 4/3 - 4/3*(-0.5) = 4/3 + 2/3 = 6/3 = 2. Correct.
    
    plt.figure(figsize=(10, 6))
    plt.stem(n_vals, x_n_vals, basefmt=" ")
    plt.title('Plot of x[n] for Assignment 4 Q2')
    plt.xlabel('n')
    plt.ylabel('x[n]')
    plt.grid(True)
    plt.savefig('x_n_plot.png')
    print("Plot saved to x_n_plot.png")

if __name__ == "__main__":
    verify_inverse_z_transform()
