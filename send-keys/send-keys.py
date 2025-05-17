# pip install pydirectinput
import sys
import pydirectinput
from time import sleep

delay = 1
try:
  delay = float(sys.argv[2])
except:
  pass

def send_keys(input_string):
    for char in input_string:
        if char == " ":
            pydirectinput.press("space")  # Handle spaces explicitly
        else:
            pydirectinput.press(char)  # Press each character
        sleep(delay)

def main():
    if len(sys.argv) < 2:
        print("Usage: python script.py <string>")
        return

    input_string = sys.argv[1]
    while True:
        send_keys(input_string)

if __name__ == "__main__":
    main()
