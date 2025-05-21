import pyautogui
import time

from utility import is_caps_lock_on
from utility import is_final_fantasy_active

try:
    print("Starting auto clicker CAPS. Press Ctrl+C to stop.")
    while True:
        if is_final_fantasy_active() and is_caps_lock_on():
            pyautogui.click()  # Performs a left mouse click at the current position
            time.sleep(1)      # Waits 1 second
        time.sleep(0.1)
except KeyboardInterrupt:
    print("\nAuto clicker stopped.")

