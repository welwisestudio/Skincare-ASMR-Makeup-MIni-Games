from pathlib import Path
from PIL import Image, ImageChops, ImageOps

root = Path('reference/cleaning-audit')
out = Path('public/assets/ui')

def cutout(im, crop=False):
    im = im.convert('RGB')
    r, g, b = im.split()
    key = ImageChops.subtract(ImageChops.darker(g, b), r)
    alpha = key.point(lambda v: 255 if v < 70 else max(0, round((150-v)*255/80)))
    im = im.convert('RGBA')
    im.putalpha(alpha)
    if crop:
        im = im.crop(alpha.point(lambda v: 255 if v > 100 else 0).getbbox())
        im.thumbnail((320, 320), Image.Resampling.LANCZOS)
        im = ImageOps.expand(im, border=4)
    return im

for i, name in enumerate(['trash-bag', 'bath', 'car', 'yacht', 'jet']):
    cutout(Image.open(root / f'master-{i}.png'), i == 0).save(out / f'clean-{name}.webp', quality=96)
sheet = Image.open(root / 'master-5.png')
w, h = sheet.size
for i in range(4):
    part = sheet.crop((i%2*w//2, i//2*h//2, (i%2+1)*w//2, (i//2+1)*h//2))
    cutout(part, True).save(out / f'clean-litter-{i}.webp', quality=96)
