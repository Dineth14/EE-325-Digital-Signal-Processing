#Aliasing Demonstration

import numpy as np
import matplotlib.pyplot as plt

# genarate continuous signal 
t = np.linspace(0, 0.01, 1000)  # time vector from 0 to 1 seconds
x_c = np.sin(2 * np.pi * 1000*t)  # 1000 Hz sine wave

# Sampling frequencies

f_s1 = 600
f_s2 = 1500

# Sampled signals

t_s1 = np.arange(0, 0.01, 1/f_s1)
x_s1 = np.sin(2 * np.pi * 1000*t_s1)

t_s2 = np.arange(0, 0.01, 1/f_s2)
x_s2 = np.sin(2 * np.pi * 1000*t_s2)

# Plotting

plt.figure(figsize=(12, 8))
plt.subplot(2, 1, 1)
plt.plot(t, x_c, label='Continuous Signal (1000 Hz)', color='blue')
plt.stem(t_s1, x_s1, linefmt='r-', markerfmt='ro', basefmt=' ', label='Sampled Signal (600 Hz)')
plt.title('Sampling at 600 Hz')
plt.xlabel('Time (s)')
plt.ylabel('Amplitude')
plt.legend()
plt.grid()

plt.subplot(2, 1, 2)
plt.plot(t, x_c, label='Continuous Signal (1000 Hz)', color='blue')
plt.stem(t_s2, x_s2, linefmt='g-', markerfmt='go', basefmt=' ', label='Sampled Signal (1500 Hz)')
plt.title('Sampling at 1500 Hz')
plt.xlabel('Time (s)')
plt.ylabel('Amplitude')
plt.legend()
plt.grid()

plt.tight_layout()
plt.show()

# discrete time waveform

n1 = np.arange(0, len(x_s1))
n2 = np.arange(0, len(x_s2))

plt.figure(figsize=(12, 6))
plt.subplot(2, 1, 1)
plt.stem(n1, x_s1, linefmt='r-', markerfmt='ro', basefmt=' ', label='Sampled Signal (600 Hz)')
plt.title('Discrete Time Signal at 600 Hz Sampling')
plt.xlabel('Sample Number')
plt.ylabel('Amplitude')
plt.legend()
plt.grid()

plt.subplot(2, 1, 2)
plt.stem(n2, x_s2, linefmt='g-', markerfmt='go', basefmt=' ', label='Sampled Signal (1500 Hz)')
plt.title('Discrete Time Signal at 1500 Hz Sampling')
plt.xlabel('Sample Number')
plt.ylabel('Amplitude')
plt.legend()
plt.grid()

plt.tight_layout()
plt.show()  

# comparsion of the sampled signals

plt.figure(figsize=(12, 6))
plt.plot(t, x_c, label='Continuous Signal (1000 Hz)', color='blue')
plt.stem(t_s1, x_s1, linefmt='r-', markerfmt='ro', basefmt=' ', label='Sampled Signal (600 Hz)')
plt.stem(t_s2, x_s2, linefmt='g-', markerfmt='go', basefmt=' ', label='Sampled Signal (1500 Hz)')
plt.title('Comparison of Sampled Signals')
plt.xlabel('Time (s)')
plt.ylabel('Amplitude')
plt.legend()
plt.grid()
plt.show()

print("The Nyquist rate for a 1000Hz signal is 2000Hz.")
print("When the 1000Hz signal is smapled below the Nyquist rate 600Hz, 1500Hz, aliasing occurs, distorting the signal representation.")