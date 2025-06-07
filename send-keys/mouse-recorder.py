import tkinter as tk
from tkinter import messagebox, simpledialog
import threading
import time
import json
import os
from pynput import mouse
from pynput.mouse import Controller, Button
from utility import is_caps_lock_on

RECORD_FILE = "mouse_recording.json"
recording = False
events = []
start_time = 0

def collapse_move_events(events, window=0.5):
    collapsed = []
    last_move_time = -window
    buffer = []

    for event in events[:-2]:
        if event[0] != "move":
            if buffer:
                collapsed.append(buffer[-1])  # Keep last move in buffer
                buffer = []
            collapsed.append(event)
        else:
            if event[-1] - last_move_time > window:
                if buffer:
                    collapsed.append(buffer[-1])
                buffer = [event]
                last_move_time = event[-1]
            else:
                buffer.append(event)

    if buffer:
        collapsed.append(buffer[-1])

    return collapsed

def load_events():
    global events
    if os.path.exists(RECORD_FILE):
        with open(RECORD_FILE, "r") as f:
            events = json.load(f)

def save_events():
    with open(RECORD_FILE, "w") as f:
        json.dump(events, f)

def countdown(label, callback):
    def run():
        for i in range(3, 0, -1):
            label.config(text=f"Starting in {i}...")
            time.sleep(1)
        label.config(text="Recording...")
        callback()
    threading.Thread(target=run, daemon=True).start()

def start_recording(label, button, event_listbox):
    global recording, events, start_time
    if recording:
        recording = False
        label.config(text="Recording stopped.")
        button.config(text="Record")
        global events
        events = collapse_move_events(events)
        save_events()
        refresh_event_listbox(event_listbox)
        return

    events.clear()
    button.config(text="Stop")
    countdown(label, lambda: record_mouse(label))

def record_mouse(label):
    global recording, start_time
    recording = True
    start_time = time.time()

    def on_move(x, y):
        if recording:
            events.append(["move", x, y, time.time() - start_time])

    def on_click(x, y, button, pressed):
        if recording:
            events.append(["click", x, y, str(button), pressed, time.time() - start_time])

    def listen():
        with mouse.Listener(on_move=on_move, on_click=on_click) as listener:
            while recording:
                time.sleep(0.1)
            listener.stop()

    threading.Thread(target=listen, daemon=True).start()

def play_events(label, repeat_entry):
    if not events:
        messagebox.showinfo("Info", "No events recorded.")
        return

    try:
        repeat = max(1, int(repeat_entry.get()))
    except ValueError:
        repeat = 1

    label.config(text="Playing...")

    def play():
        mouse_controller = Controller()        
        for i in range(repeat):
            start_play = time.time()
            for event in events:
                if is_caps_lock_on():
                    break
                current = time.time() - start_play
                label.config(text=f"Playing... {i} {current}")
                delay = event[-1] - current
                if delay > 0:
                    time.sleep(delay)

                if event[0] == "move":
                    _, x, y, _ = event
                    mouse_controller.position = (x, y)
                elif event[0] == "click":
                    _, x, y, btn, pressed, _ = event
                    mouse_controller.position = (x, y)
                    button = Button.left if 'left' in btn else Button.right
                    if pressed:
                        mouse_controller.press(button)
                    else:
                        mouse_controller.release(button)

        label.config(text="Playback finished.")

    threading.Thread(target=play, daemon=True).start()

def refresh_event_listbox(listbox):
    listbox.delete(0, tk.END)
    for i, event in enumerate(events):
        desc = f"{i}: {event}"
        listbox.insert(tk.END, desc)

def delete_selected_event(event_listbox):
    selected = event_listbox.curselection()
    if selected:
        del events[selected[0]]
        save_events()
        refresh_event_listbox(event_listbox)

def edit_selected_event(event_listbox):
    selected = event_listbox.curselection()
    if not selected:
        return
    idx = selected[0]
    event = events[idx]
    new_value = simpledialog.askstring("Edit Event", f"Current: {event}", initialvalue=str(event))
    if new_value:
        try:
            parsed = eval(new_value)
            if isinstance(parsed, list):
                events[idx] = parsed
                save_events()
                refresh_event_listbox(event_listbox)
        except Exception as e:
            messagebox.showerror("Error", f"Invalid input: {e}")

# GUI setup
root = tk.Tk()
root.title("Mouse Recorder with Repeat & Editor")

label = tk.Label(root, text="Ready", font=("Helvetica", 14))
label.pack(pady=5)

frame = tk.Frame(root)
frame.pack()

record_btn = tk.Button(frame, text="Record", font=("Helvetica", 12), width=12,
                       command=lambda: start_recording(label, record_btn, event_listbox))
record_btn.grid(row=0, column=0, padx=5)

play_btn = tk.Button(frame, text="Play", font=("Helvetica", 12), width=12,
                     command=lambda: play_events(label, repeat_entry))
play_btn.grid(row=0, column=1, padx=5)

tk.Label(frame, text="Repeat:").grid(row=0, column=2, padx=(15, 2))
repeat_entry = tk.Entry(frame, width=5)
repeat_entry.insert(0, "1")
repeat_entry.grid(row=0, column=3)

event_listbox = tk.Listbox(root, width=80, height=10)
event_listbox.pack(pady=10)

editor_frame = tk.Frame(root)
editor_frame.pack(pady=5)

delete_btn = tk.Button(editor_frame, text="Delete Selected", command=lambda: delete_selected_event(event_listbox))
delete_btn.pack(side=tk.LEFT, padx=5)

edit_btn = tk.Button(editor_frame, text="Edit Selected", command=lambda: edit_selected_event(event_listbox))
edit_btn.pack(side=tk.LEFT, padx=5)

load_events()
refresh_event_listbox(event_listbox)
root.mainloop()
