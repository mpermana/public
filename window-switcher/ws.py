import pygetwindow as gw
import pyautogui
import pywinctl
import tkinter as tk
from tkinter import ttk
from PIL import Image, ImageTk
import time

class WindowSwitcher:
    def __init__(self, root):
        self.root = root
        self.root.title("Window Switcher")
        self.root.geometry("800x600")
        
        self.canvas = tk.Canvas(root)
        self.frame = ttk.Frame(self.canvas)
        self.scrollbar = ttk.Scrollbar(root, orient="vertical", command=self.canvas.yview)
        self.canvas.configure(yscrollcommand=self.scrollbar.set)

        self.scrollbar.pack(side="right", fill="y")
        self.canvas.pack(side="left", fill="both", expand=True)
        self.canvas_frame = self.canvas.create_window((0, 0), window=self.frame, anchor="nw")

        self.frame.bind("<Configure>", self.on_frame_configure)
        self.canvas.bind("<Configure>", self.on_canvas_configure)

        self.window_thumbnails = []
        self.update_window_list()

    def on_frame_configure(self, event):
        self.canvas.configure(scrollregion=self.canvas.bbox("all"))

    def on_canvas_configure(self, event):
        self.canvas.itemconfig(self.canvas_frame, width=event.width)

    def update_window_list(self):
        for widget in self.frame.winfo_children():
            widget.destroy()

        self.window_thumbnails = []
        windows = gw.getWindowsWithTitle("")
        
        row, col = 0, 0
        for win in windows:
            if not win.title or not win.visible:
                continue
            try:
                bbox = win._rect
                if bbox.width > 0 and bbox.height > 0:
                    screenshot = pyautogui.screenshot(region=(bbox.left, bbox.top, bbox.width, bbox.height))
                    img = screenshot.resize((200, 150), Image.LANCZOS)
                    img_tk = ImageTk.PhotoImage(img)

                    btn = tk.Button(self.frame, image=img_tk, text=win.title, compound="top", command=lambda w=win: self.focus_window(w))
                    btn.image = img_tk
                    btn.grid(row=row, column=col, padx=10, pady=10)

                    col += 1
                    if col > 3:  # 4 thumbnails per row
                        col = 0
                        row += 1
            except Exception as e:
                print(f"Could not capture window {win.title}: {e}")

        self.root.after(5000, self.update_window_list)  # Refresh every 5 seconds

    def focus_window(self, window):
        try:
            win = pywinctl.getWindow(title=window.title)
            if win:
                win.activate()
        except Exception as e:
            print(f"Could not focus window {window.title}: {e}")

if __name__ == "__main__":
    root = tk.Tk()
    app = WindowSwitcher(root)
    root.mainloop()
