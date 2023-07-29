import sys
import os
import tkinter as tk
from PIL import Image, ImageTk, ImageOps
import piexif

class ImageViewer:
    def __init__(self, image_path):
        self.image_path = image_path

        # Load the image using PIL (Python Imaging Library)
        self.original_image = Image.open(self.image_path)

        # Preserve the original EXIF data in the image
        self.original_exif_data = piexif.load(self.image_path)

        # Fix image orientation if needed
        self.image = ImageOps.exif_transpose(self.original_image)

        # Create a Tkinter window
        self.window = tk.Tk()
        self.window.title("Image Viewer")

        # Set the window state to maximized (zoomed)
        self.window.state('zoomed')

        self.image_list = [self.image]  # Create a mutable data structure to store the image

        self.tk_image = None  # Placeholder for PhotoImage object

        self.create_widgets()

    def get_image_info(self, image):
        # Get image size in pixels
        size_info = f"Size: {image.width}x{image.height} pixels\n"

        # Get image file size in bytes
        file_size = os.path.getsize(self.image_path)
        size_info += f"File Size: {file_size} bytes\n"

        # Get image format
        info = f"Image Information:\n"
        info += size_info
        info += f"Format: {image.format}\n"
        # Add more image information if needed
        return info

    def resize_image(self, image, width, height):
        # Calculate the aspect ratio of the original image
        aspect_ratio = image.width / image.height

        # Calculate the new width and height based on the aspect ratio
        new_width = width
        new_height = int(width / aspect_ratio)

        # Check if the new height exceeds the passed height
        if new_height > height:
            new_height = height
            new_width = int(height * aspect_ratio)

        # Resize the image
        resized_image = image.resize((new_width, new_height), Image.ANTIALIAS)
        return ImageOps.exif_transpose(resized_image)

    def save_image(self, output_path):
        # Preserve the original EXIF data in the resized image
        exif_bytes = piexif.dump(self.original_exif_data)

        # Save the resized image with the original EXIF data
        self.image_list[0].save(output_path, exif=exif_bytes)

    def resize_and_update_image(self, width, height):
        self.image_list[0] = self.resize_image(self.original_image, width, height)
        self.update_image_info()
        self.update_image()

    def update_image_info(self):
        self.info_label.config(text=self.get_image_info(self.image_list[0]))

    def update_image(self):
        self.tk_image = ImageTk.PhotoImage(self.image_list[0])
        self.image_label.configure(image=self.tk_image)
        self.image_label.image = self.tk_image

    def create_widgets(self):
        def save_image_handler(event):
            self.save_image("resized_image.jpg")

        self.window.bind("1", lambda event: self.resize_and_update_image(1600, 1200))
        self.window.bind("2", lambda event: self.resize_and_update_image(2048, 1080))
        self.window.bind("3", lambda event: self.resize_and_update_image(3840, 2160))
        self.window.bind("s", save_image_handler)

        # Create a Canvas to contain the image and information
        canvas = tk.Canvas(self.window)
        canvas.pack(fill=tk.BOTH, expand=True)

        # Create a Frame inside the Canvas for the image and information
        frame = tk.Frame(canvas)
        canvas.create_window((0, 0), window=frame, anchor=tk.NW)

        # Get image information
        self.info_label = tk.Label(frame, text=self.get_image_info(self.original_image))
        self.info_label.grid(row=0, column=0, padx=10, pady=10)

        # Create a label to display the image
        self.tk_image = ImageTk.PhotoImage(self.image_list[0])
        self.image_label = tk.Label(frame, image=self.tk_image)
        self.image_label.grid(row=1, column=0, padx=10, pady=10)

        # Add vertical scrollbar to the canvas
        v_scrollbar = tk.Scrollbar(canvas, orient=tk.VERTICAL, command=canvas.yview)
        v_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        canvas.config(yscrollcommand=v_scrollbar.set)

        # Add horizontal scrollbar to the canvas
        h_scrollbar = tk.Scrollbar(canvas, orient=tk.HORIZONTAL, command=canvas.xview)
        h_scrollbar.pack(side=tk.BOTTOM, fill=tk.X)
        canvas.config(xscrollcommand=h_scrollbar.set)

        # Make the canvas scrollable
        frame.bind("<Configure>", lambda event: canvas.config(scrollregion=canvas.bbox("all")))

    def run(self):
        # Run the Tkinter event loop
        self.window.mainloop()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python script_name.py image_path")
        sys.exit(1)

    image_path = sys.argv[1]
    viewer = ImageViewer(image_path)
    viewer.run()
