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


def process_image(directory, filename):
    fullpath = f'{directory}/{filename}'
    image = Image.open(fullpath)
    print(fullpath)
    exif_image_info = image.info['exif']

    # 1080p
    basewidth=1920
    wpercent = (basewidth / float(image.size[0]))
    smallerImage = image.resize((basewidth, int((float(image.size[1]) * float(wpercent)))), Image.Resampling.LANCZOS)
    smallerImage.save(f'{directory}/1080p/{filename}', exif=exif_image_info)

    # 2k
    basewidth=2560
    wpercent = (basewidth / float(image.size[0]))
    smallerImage = image.resize((basewidth, int((float(image.size[1]) * float(wpercent)))), Image.Resampling.LANCZOS)
    smallerImage.save(f'{directory}/2k/{filename}', exif=exif_image_info)

    # 4k
    basewidth=3840
    wpercent = (basewidth / float(image.size[0]))
    smallerImage = image.resize((basewidth, int((float(image.size[1]) * float(wpercent)))), Image.Resampling.LANCZOS)
    smallerImage.save(f'{directory}/4k/{filename}', exif=exif_image_info)

    image.close()


if __name__ == '__main__':
    # process images
    root_dirs_files = list(walk(argv[1]))
    for root, dirs, files in root_dirs_files:
        # mkdirs
        file_patterns = ['1080p', '2k', '4k']
        for file_pattern in file_patterns:
            new_path = f'{root}/{file_pattern}'
            if not path.exists(new_path): mkdir(new_path)
        # process files
        for name in files:
            if name.lower().endswith('jpg'):
                process_image(root, name)
