# pip install pydirectinput
import sys
import pydirectinput
from time import sleep

def send_keys(input_string):
    for char in input_string:
        if char == " ":
            pydirectinput.press("space")  # Handle spaces explicitly
        else:
            pydirectinput.press(char)  # Press each character
        sleep(1)

def main():
    if len(sys.argv) < 2:
        print("Usage: python script.py <string>")
        return

    input_string = sys.argv[1]
    while True:
        send_keys(input_string)

if __name__ == "__main__":
    main()
