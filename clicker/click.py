import pyautogui
import time

try:
    print("Starting auto clicker. Press Ctrl+C to stop.")
    while True:
        pyautogui.click()  # Performs a left mouse click at the current position
        time.sleep(1)      # Waits 1 second
except KeyboardInterrupt:
    print("\nAuto clicker stopped.")

