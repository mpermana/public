import sys
import os
import tkinter as tk
from io import BytesIO
from PIL import Image
from PIL import ImageChops
from PIL import ImageEnhance
from PIL import ImageFilter
from PIL import ImageTk
from PIL import ImageOps

def get_image_size_in_bytes(image):
    # clone hack
    image = image.copy()

    # Create a BytesIO object to hold the image data
    buffer = BytesIO()

    # Save the image data to the buffer in the desired format (e.g., JPEG, PNG)
    buffer.name = 'hack.jpeg'
    image.save(buffer, format=image.format)

    # Get the size of the buffer (image data) in bytes
    size_in_bytes = buffer.tell()

    # Close the buffer to release resources
    buffer.close()

    return size_in_bytes


class ImageViewer:

    def __init__(self, image_paths):
        self.image_paths = image_paths
        self.image_index = 0

        # Load the first image using PIL (Python Imaging Library)
        self.load_image()

        # Create a Tkinter window
        self.window = tk.Tk()
        self.window.title("Image Viewer")

        # Set the window state to maximized (zoomed)
        self.window.state('zoomed')

        self.tk_image = None  # Placeholder for PhotoImage object

        self.create_widgets()

    def get_image_info(self, image):
        # Get image size in pixels
        size_info = f"Size: {image.width}x{image.height} pixels\n"

        # Get image file size in bytes
        file_size = get_image_size_in_bytes(image)
        size_info += f"File Size: {file_size} bytes\n"

        # Get image format
        info = f"original_image: {self.original_image.filename}\n"
        info += size_info
        info += f"Format: {image.format}\n"
        # Add more image information if needed
        return info

    def load_image(self):
        # Load the image at the current index using PIL
        self.original_image = Image.open(self.image_path)
        self.exif_image_info = self.original_image.info.get('exif')

        # Fix image orientation if needed
        self.image = ImageOps.exif_transpose(self.original_image)        

    @property
    def image_path(self):
        return self.image_paths[self.image_index]

    @property
    def image_brightened(self):
        return ImageEnhance.Brightness(self.image).enhance(1.30)

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

    def save_image(self, useBrightened):
        image = self.image_brightened if useBrightened else self.image
        if self.exif_image_info:
            image.save(self.output_path, exif=self.exif_image_info)
        else:
            image.save(self.output_path)

    def resize_and_update_image(self, max_width, max_height):
        aspect_ratio = self.original_image.width / self.original_image.height
        new_width1  = max_width
        new_height1 = max_width/aspect_ratio        
        new_height2 = max_height
        new_width2  = max_width*aspect_ratio
        if new_height1 <= max_height:
            width = new_width1
            height = new_height1
        else:
            width = new_width2
            height = new_height2
        self.image = self.resize_image(self.original_image, width, height)

        # update output_path
        filename, extension = os.path.splitext(self.image_path)
        self.output_path = ''.join([filename, '-', str(self.image.width), 'x', str(self.image.height), extension])
        self.update_image_info()
        self.update_image()

    def update_image_info(self):
        self.info_label.config(text=self.get_image_info(self.image))

    def update_image(self):
        self.tk_image = ImageTk.PhotoImage(self.image)
        self.image_label.configure(image=self.tk_image)        
        self.tk_image_brightened = ImageTk.PhotoImage(self.image_brightened)
        self.image_label2.configure(image=self.tk_image_brightened)

    def create_widgets(self):
        self.window.bind("1", lambda event: self.resize_and_update_image(1600, 1200))
        self.window.bind("2", lambda event: self.resize_and_update_image(2560, 1440))
        self.window.bind("3", lambda event: self.resize_and_update_image(3840, 2160))
        self.window.bind("s", lambda event: self.save_image(False))
        self.window.bind("b", lambda event: self.save_image(True))
        self.window.bind("<Left>", lambda event: self.show_previous_image())
        self.window.bind("<Right>", lambda event: self.show_next_image())
        self.window.bind("<Delete>", lambda event: self.delete_original_image())

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
        self.image_label = tk.Label(frame)
        self.image_label.grid(row=1, column=0, padx=10, pady=10, columnspan=3)        
        self.image_label2 = tk.Label(frame)
        self.image_label2.grid(row=2, column=0, padx=10, pady=10, columnspan=3)
        self.update_image();        

        # Add navigation buttons for switching between images
        prev_button = tk.Button(frame, text="Previous", command=self.show_previous_image)
        prev_button.grid(row=0, column=0, padx=10, pady=10, sticky=tk.W)

        next_button = tk.Button(frame, text="Next", command=self.show_next_image)
        next_button.grid(row=0, column=2, padx=10, pady=10, sticky=tk.E)

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


    def show_previous_image(self):
        self.image_index = (self.image_index - 1) % len(self.image_paths)
        self.load_image()
        self.update_image_info()
        self.update_image()

    def show_next_image(self):
        self.image_index = (self.image_index + 1) % len(self.image_paths)
        self.load_image()
        self.update_image_info()
        self.update_image()

    def delete_original_image(self):
        self.original_image.close()
        os.remove(self.image_path)        

    def run(self):
        # Run the Tkinter event loop
        self.window.mainloop()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python script_name.py image_path1 [image_path2 ...]")
        sys.exit(1)

    directory = sys.argv[1:]
    root_dirs_files = list(os.walk(sys.argv[1]))
    image_paths = [
        f'{root}/{filename}'
        for root, dirs, files in root_dirs_files
        for filename in files
            if filename.lower().endswith('jpg')
    ]
    viewer = ImageViewer(image_paths)
    viewer.run()