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
    i = 0
    while i < len(input_string):
        print(input_string[i:i+6])
        if input_string[i:i+6] == "{NUM0}":
            print("num0")
            pydirectinput.press("num0")
            i += 6
        elif input_string[i:i+5] == "{INS}":
            pydirectinput.press("insert")
            i += 5
        elif input_string[i] == " ":
            pydirectinput.press("space")
            i += 1
        else:
            pydirectinput.press(input_string[i])
            i += 1
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
