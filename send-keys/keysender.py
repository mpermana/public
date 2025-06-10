import tkinter as tk
from tkinter import ttk
import threading
import pydirectinput
import pygetwindow as gw
from time import sleep
from time import time
from pprint import pprint
from utility import send_key

import json
import os

from utility import is_caps_lock_on, is_num_lock_on, is_scroll_lock_on

SAVE_FILE = "threads.json"

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
                    parsed.append((None, input_string[i]))
                    i += 2
                else:
                    parsed.append((mod, input_string[i + 1]))
                    i += 2
            else:
                parsed.append((None, input_string[i]))
                i += 1
        elif input_string[i] == "\\" and i + 1 < len(input_string):
            if input_string[i + 1] == "t":
                parsed.append((None, "tab"))
                i += 2
            else:
                parsed.append((None, input_string[i]))
                i += 1
        else:
            parsed.append((None, input_string[i]))
            i += 1
    return parsed

def is_flags_for_send_keys(flags):
    if flags["pause"] or not is_final_fantasy_active():
        return False

    conditions = []
    if flags["if_caps_on"]:
        conditions.append(is_caps_lock_on())
    if flags["if_caps_off"]:
        conditions.append(not is_caps_lock_on())
    if flags["if_num_on"]:
        conditions.append(is_num_lock_on())
    if flags["if_num_off"]:
        conditions.append(not is_num_lock_on())
    if flags["if_scroll_on"]:
        conditions.append(is_scroll_lock_on())
    if flags["if_scroll_off"]:
        conditions.append(not is_scroll_lock_on())    
    return conditions and all(conditions)

from keyboard import mutexed_send_key

def send_keys_loop(flags):
    while True:        
        start_time = time()
        parsed_keys = parse_input_string(flags["input_string"])
        pprint(parsed_keys)
        for modifier, key in parsed_keys:
            while not is_flags_for_send_keys(flags):
                sleep(0.10)
            key_delay = 2.4
            mutexed_send_key(modifier, key, key_delay)
        delay = flags["delay"]
        if delay:
            elapsed_time = time() - start_time
            wait_time = delay - elapsed_time
            if wait_time > 0:
                sleep(wait_time)
            
def save_all_threads():
    data = []
    for flags in control_flags:
        data.append({
            "name": flags.get("name", ""),
            "input_string": flags["input_string"],
            "delay": flags["delay"],
            "pause": flags["pause"],
            "if_caps_on": flags.get("if_caps_on", False),
            "if_caps_off": flags.get("if_caps_off", False),
            "if_num_on": flags.get("if_num_on", False),
            "if_num_off": flags.get("if_num_off", False),
            "if_scroll_on": flags.get("if_scroll_on", False),
            "if_scroll_off": flags.get("if_scroll_off", False)
        })
    pprint(data)
    with open(SAVE_FILE, "w") as f:
        json.dump(data, f, indent=2)

def load_all_threads(container):
    if not os.path.exists(SAVE_FILE):
        return
    try:
        with open(SAVE_FILE, "r") as f:
            thread_configs = json.load(f)
            for cfg in thread_configs:
                start_sending(
                    cfg["input_string"],
                    str(cfg["delay"]),
                    container,
                    paused=cfg.get("pause", False),
                    restore_mode=True,
                    name=cfg.get("name", ""),
                    extra_flags=cfg
                )
    except Exception as e:
        print("Failed to load saved threads:", e)

def start_sending(input_string, delay_string, container, paused=False, restore_mode=False, name=None, extra_flags=None):
    try:
        delay = float(delay_string)
    except ValueError:
        delay = 0
    
    thread_index = len(control_flags) + 1
    thread_name = name or f"Thread {thread_index}"

    flags = {
        "pause": paused,
        "input_string": input_string,
        "delay": delay,
        "name": thread_name,
        "if_caps_on": False,
        "if_caps_off": False,
        "if_num_on": False,
        "if_num_off": False,
        "if_scroll_on": False,
        "if_scroll_off": False
    }
    if extra_flags:
        flags.update(extra_flags)

    control_flags.append(flags)

    t = threading.Thread(target=send_keys_loop, args=(flags,), daemon=True)
    threads.append(t)
    t.start()

    row = ttk.Frame(container)
    row.pack(fill="x", pady=2)

    name_var = tk.StringVar(value=thread_name)
    name_entry = ttk.Entry(row, textvariable=name_var, width=100)
    name_entry.pack(side="top", anchor="w", padx=5)

    def save_name(event=None):
        flags["name"] = name_var.get()
        save_all_threads()

    name_entry.bind("<Return>", save_name)
    name_entry.bind("<FocusOut>", save_name)

    # delay
    delay_var = tk.IntVar(value=delay)
    delay_entry = ttk.Entry(row, textvariable=delay_var, width=4)
    delay_entry.pack(side="top", anchor="w", padx=5)

    def save_delay(event=None):
        flags["delay"] = delay_var.get()
        save_all_threads()

    delay_entry.bind("<Return>", save_delay)
    delay_entry.bind("<FocusOut>", save_delay)
    #

    # ttk.Label(row, text=f'"{input_string}" (delay: {delay}s)').pack(anchor="w", padx=5)
    input_var = tk.StringVar(value=input_string)
    input_entry = ttk.Entry(row, textvariable=input_var, width=100)
    input_entry.pack(anchor="w", padx=5)

    def save_input(event=None):
        flags["input_string"] = input_var.get()
        save_all_threads()

    input_entry.bind("<Return>", save_input)
    input_entry.bind("<FocusOut>", save_input)


    lock_frame = ttk.Frame(row)
    lock_frame.pack(anchor="w", padx=5)

    def make_check(name, label):
        var = tk.BooleanVar(value=flags[name])
        def toggle():
            flags[name] = var.get()
            save_all_threads()
        cb = ttk.Checkbutton(lock_frame, text=label, variable=var, command=toggle)
        cb.pack(side="left")

    make_check("if_caps_on", "Caps On")
    make_check("if_caps_off", "Caps Off")
    make_check("if_num_on", "Num On")
    make_check("if_num_off", "Num Off")
    make_check("if_scroll_on", "Scroll On")
    make_check("if_scroll_off", "Scroll Off")

    pause_btn = ttk.Button(row, text="Resume" if paused else "Pause")   
    style = ttk.Style()
    style.configure("Pause.TButton", background="#ffcc00")
    style.configure("Active.TButton", background="#00cc66")
    pause_btn.config(style="Pause.TButton" if paused else "Active.TButton")

    def toggle_pause():
        flags["pause"] = not flags["pause"]
        pause_btn_config = {
            True: {"text": "Resume", "style": "Pause.TButton"},
            False: {"text": "Pause", "style": "Active.TButton"}
        }
        pause_btn.config(**pause_btn_config[flags["pause"]])
        save_all_threads()

    pause_btn.config(command=toggle_pause)
    pause_btn.pack(side="left", padx=2)

    if not restore_mode:
        save_all_threads()

def on_start_click():
    input_string = entry.get()
    delay_string = delay_entry.get()
    if input_string.strip():
        start_sending(input_string, delay_string, thread_buttons_frame)


root = tk.Tk()
root.title("FF Key Sender")
root.geometry("620x600")

frame = ttk.Frame(root, padding=10)
frame.pack(fill="both", expand=True)

ttk.Label(frame, text="Enter text to send (use ^ for Ctrl, @ for Alt):").pack()
entry = ttk.Entry(frame, width=40)
entry.pack(pady=5)

ttk.Label(frame, text="Delay between sequence (in seconds):").pack()
delay_entry = ttk.Entry(frame, width=10)
delay_entry.insert(0, "0")
delay_entry.pack(pady=5)

ttk.Label(frame, text=(
    'Examples:\n'
    '  hello         - Sends h, e, l, l, o\n'
    '  ^a@bcd        - Ctrl+A, Alt+B, then c, d\n'
    '  ^^@@xyz       - Sends ^, @, x, y, z\n'
    '  a\\tb          - Sends a, Tab, b\n'
), foreground="gray").pack()

thread_buttons_frame = ttk.LabelFrame(frame, text="Active Threads")
thread_buttons_frame.pack(fill="both", expand=True, pady=10)

start_btn = ttk.Button(frame, text="Start Send", command=on_start_click)
start_btn.pack(pady=5)


load_all_threads(thread_buttons_frame)
root.mainloop()
