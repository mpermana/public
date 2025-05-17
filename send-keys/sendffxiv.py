# pip install pydirectinput pygetwindow
import sys
import pydirectinput
from time import sleep
import pygetwindow as gw

delay = 1
try:
    delay = float(sys.argv[2])
except:
    pass

def is_final_fantasy_active():
    try:
        active_window = gw.getActiveWindow()
        return active_window and "FINAL FANTASY" in active_window.title.upper()
    except:
        return False

def send_keys(input_string):
    for char in input_string:
        if not is_final_fantasy_active():
            sleep(0.01)  # 10ms delay when not active
            continue
        if char == " ":
            pydirectinput.press("space")
        else:
            pydirectinput.press(char)
        sleep(delay)

def main():
    if len(sys.argv) < 2:
        print("Usage: python script.py <string> [delay]")
        return

    input_string = sys.argv[1]
    while True:
        send_keys(input_string)

if __name__ == "__main__":
    main()
