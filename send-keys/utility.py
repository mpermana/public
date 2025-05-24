import ctypes
import tkinter as tk
from tkinter import ttk
import threading
import pydirectinput
import pygetwindow as gw
from time import sleep
from queue import Queue
import json
import os

SAVE_FILE = "threads.json"
key_queue = Queue()
threads = []
control_flags = []


VK_NUMLOCK = 0x90
VK_SCROLL  = 0x91
VK_CAPITAL = CAPS_LOCK = 0x14
def is_caps_lock_on():
    return bool(ctypes.WinDLL("User32.dll").GetKeyState(CAPS_LOCK) & 1)

def is_num_lock_on():
    return bool(ctypes.WinDLL("User32.dll").GetKeyState(VK_NUMLOCK) & 1)

def is_scroll_lock_on():
    return bool(ctypes.WinDLL("User32.dll").GetKeyState(VK_SCROLL) & 1)

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

def save_all_threads():
    data = []
    for flags in control_flags:
        data.append({
            "name": flags.get("name", ""),
            "input": flags["input_string"],
            "delay": flags["delay"],
            "pause": flags["pause"]
        })
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
                    cfg["input"],
                    str(cfg["delay"]),
                    container,
                    paused=cfg.get("pause", False),
                    restore_mode=True,
                    name=cfg.get("name", "")
                )
    except Exception as e:
        print("Failed to load saved threads:", e)

def start_sending(input_string, delay_string, container, paused=False, restore_mode=False, name=None):
    try:
        delay = float(delay_string)
    except ValueError:
        delay = 2.51

    parsed_keys = parse_input_string(input_string)
    thread_index = len(control_flags) + 1
    thread_name = name or f"Thread {thread_index}"

    flags = {
        "stop": False,
        "pause": paused,
        "input_string": input_string,
        "delay": delay,
        "name": thread_name
    }
    control_flags.append(flags)

    t = threading.Thread(target=send_keys_loop, args=(parsed_keys, flags, delay), daemon=True)
    threads.append(t)
    t.start()

    row = ttk.Frame(container)
    row.pack(fill="x", pady=2)

    # Editable name label
    name_var = tk.StringVar(value=thread_name)
    name_entry = ttk.Entry(row, textvariable=name_var, width=15)
    name_entry.pack(side="left", padx=5)

    def save_name(event=None):
        flags["name"] = name_var.get()
        save_all_threads()

    name_entry.bind("<Return>", save_name)
    name_entry.bind("<FocusOut>", save_name)

    ttk.Label(row, text=f'"{input_string}" (delay: {delay}s)').pack(side="left", padx=5)

    pause_btn = ttk.Button(row, text="Resume" if paused else "Pause")
    stop_btn = ttk.Button(row, text="Stop")

    def toggle_pause():
        flags["pause"] = not flags["pause"]
        pause_btn.config(text="Resume" if flags["pause"] else "Pause")
        save_all_threads()

    def stop_thread():
        flags["stop"] = True
        stop_btn.config(state="disabled")
        pause_btn.config(state="disabled")
        name_entry.config(state="disabled")
        save_all_threads()

    pause_btn.config(command=toggle_pause)
    stop_btn.config(command=stop_thread)

    pause_btn.pack(side="left", padx=2)
    stop_btn.pack(side="left", padx=2)

    if not restore_mode:
        save_all_threads()

def on_start_click():
    input_string = entry.get()
    delay_string = delay_entry.get()
    if input_string.strip():
        start_sending(input_string, delay_string, thread_buttons_frame)
