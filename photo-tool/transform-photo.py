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


def process_image(directory, filename, basewidth=1600):
    fullpath = f'{directory}/{filename}'
    image = Image.open(fullpath)
    print(fullpath)
    print('brightness:', calculate_brightness(image))
    exif_image_info = image.info['exif']

    # make small image
    wpercent = (basewidth / float(image.size[0]))
    hsize = int((float(image.size[1]) * float(wpercent)))
    smallerImage = image.resize((basewidth, hsize), Image.ANTIALIAS)
    smallerImage.save(f'{directory}/small/{filename}', exif=exif_image_info)

    # # brighten image level 1
    brightenedImage = ImageEnhance.Brightness(image).enhance(1.20)
    brightenedImage.save(f'{directory}/bright20/{filename}', exif=exif_image_info)
    print('brightness:', calculate_brightness(brightenedImage))

    # # brighten image level 2
    brightenedImage2 = ImageEnhance.Brightness(image).enhance(1.35)
    brightenedImage2.save(f'{directory}/bright35/{filename}', exif=exif_image_info)
    print('brightness:', calculate_brightness(brightenedImage2))


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
    basewidth = 3840
    command = argv[1]
    if command == '2k':
        basewidth = 2560
    if command == '1080p':
        basewidth = 1920
    paths = argv[2:]
    for path in paths:
        resize(path, basewidth)
