# python image-resize.py "D:\Baby Photo\2023-03"
# pip install Pillow
from PIL import Image
from PIL import ImageEnhance
from os import walk
from os import path
from os import mkdir
from shutil import move
from sys import argv


def calculate_brightness(image):
    greyscale_image = image.convert('L')
    histogram = greyscale_image.histogram()
    pixels = sum(histogram)
    brightness = scale = len(histogram)
    for index in range(0, scale):
        ratio = histogram[index] / pixels
        brightness += ratio * (-scale + index)
    return brightness / scale



   

def resize(path, basewidth=3840):
    image = Image.open(path)
    exif_image_info = image.info['exif']
    # make small image
    wpercent = (basewidth / float(image.size[0]))
    hsize = int((float(image.size[1]) * float(wpercent)))
    smallerImage = image.resize((basewidth, hsize), Image.ANTIALIAS)
    splitted = path.split('.')
    new_path = ''.join(splitted[:-1] + ['-', str(basewidth), '.'] + splitted[-1:])
    smallerImage.save(new_path, exif=exif_image_info)
    print('Saved', new_path)
    image.close()
    smallerImage.close()

if __name__ == '__main__':
    # process images
    root_dirs_files = list(walk(argv[1]))
    for root, dirs, files in root_dirs_files:
        # process files
        for name in files:
            if name.lower().endswith('jpg'):
                path = f'{root}/{name}'
                resize(path, 1920)
                resize(path, 2560)
                resize(path, 3840)

                
