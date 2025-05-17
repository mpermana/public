import tkinter as tk
from tkinter import ttk
import threading
import pydirectinput
import pygetwindow as gw
from time import sleep
from queue import Queue

key_queue = Queue()
threads = []
control_flags = []

def is_final_fantasy_active():
    try:
        active_window = gw.getActiveWindow()
        return active_window and "FINAL FANTASY" in active_window.title.upper()
    except:
        return False

def parse_input_string(input_string):
    parsed = []
    i = 0
    while i < len(input_string):
        if input_string[i] in "^@":
            mod = "ctrl" if input_string[i] == "^" else "alt"
            if i + 1 < len(input_string):
                if input_string[i + 1] == input_string[i]:
                    parsed.append((None, input_string[i]))  # literal ^ or @
                    i += 2
                else:
                    parsed.append((mod, input_string[i + 1]))
                    i += 2
            else:
                parsed.append((None, input_string[i]))  # trailing modifier
                i += 1
        else:
            parsed.append((None, input_string[i]))
            i += 1
    return parsed

def send_keys_loop(parsed_keys, flags, delay):
    while not flags["stop"]:
        if flags["pause"]:
            sleep(0.1)
            continue
        for modifier, key in parsed_keys:
            if flags["stop"]:
                return
            if flags["pause"]:
                break
            if not is_final_fantasy_active():
                sleep(0.01)
                continue
            key_queue.put((modifier, key))
            sleep(delay)

def key_worker():
    while True:
        modifier, key = key_queue.get()
        if key == " ":
            key = "space"
        if modifier == "ctrl":
            pydirectinput.keyDown("ctrl")
            pydirectinput.press(key)
            pydirectinput.keyUp("ctrl")
        elif modifier == "alt":
            pydirectinput.keyDown("alt")
            pydirectinput.press(key)
            pydirectinput.keyUp("alt")
        else:
            pydirectinput.press(key)
        key_queue.task_done()

def start_sending(input_string, delay_string, container):
    try:
        delay = float(delay_string)
    except ValueError:
        delay = 2.51

    parsed_keys = parse_input_string(input_string)
    flags = {"stop": False, "pause": False}
    control_flags.append(flags)

    t = threading.Thread(target=send_keys_loop, args=(parsed_keys, flags, delay), daemon=True)
    threads.append(t)
    t.start()

    row = ttk.Frame(container)
    row.pack(fill="x", pady=2)

    ttk.Label(row, text=f'"{input_string}" (delay: {delay}s)').pack(side="left", padx=5)

    pause_btn = ttk.Button(row, text="Pause")
    stop_btn = ttk.Button(row, text="Stop")

    def toggle_pause():
        flags["pause"] = not flags["pause"]
        pause_btn.config(text="Resume" if flags["pause"] else "Pause")

    def stop_thread():
        flags["stop"] = True
        stop_btn.config(state="disabled")
        pause_btn.config(state="disabled")

    pause_btn.config(command=toggle_pause)
    stop_btn.config(command=stop_thread)

    pause_btn.pack(side="left", padx=2)
    stop_btn.pack(side="left", padx=2)

def on_start_click():
    input_string = entry.get()
    delay_string = delay_entry.get()
    if input_string.strip():
        start_sending(input_string, delay_string, thread_buttons_frame)

# Start key worker
worker_thread = threading.Thread(target=key_worker, daemon=True)
worker_thread.start()

# GUI
root = tk.Tk()
root.title("FF Key Sender")
root.geometry("560x470")

frame = ttk.Frame(root, padding=10)
frame.pack(fill="both", expand=True)

ttk.Label(frame, text="Enter text to send (use ^ for Ctrl, @ for Alt):").pack()

entry = ttk.Entry(frame, width=40)
entry.pack(pady=5)

ttk.Label(frame, text="Delay between keys (in seconds):").pack()
delay_entry = ttk.Entry(frame, width=10)
delay_entry.insert(0, "2.51")
delay_entry.pack(pady=5)

ttk.Label(frame, text=(
    'Examples:\n'
    '  hello         - Sends h, e, l, l, o\n'
    '  ^a@bcd        - Ctrl+A, Alt+B, then c, d\n'
    '  ^^@@xyz       - Sends ^, @, x, y, z\n'
), foreground="gray").pack()

thread_buttons_frame = ttk.LabelFrame(frame, text="Active Threads")
thread_buttons_frame.pack(fill="both", expand=True, pady=10)

start_btn = ttk.Button(frame, text="Start Send", command=on_start_click)
start_btn.pack(pady=5)

root.mainloop()
