"""Pack generated artwork into web sprites; preserve originals and their prompts.

The solid export backdrop is an alpha matte. No artwork is repainted here.
Requires Pillow (pip install pillow).
"""
from pathlib import Path
from PIL import Image, ImageChops, ImageFilter, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'assets'
OUT.mkdir(parents=True, exist_ok=True)

def matte(image):
    im = image.convert('RGB')
    # Background is uniform enough to use the corner average as a chroma matte.
    sample = im.crop((8,8,28,28)).resize((1,1)).getpixel((0,0))
    distance = ImageChops.difference(im, Image.new('RGB',im.size,sample))
    r,g,b = distance.split()
    distance = ImageChops.lighter(ImageChops.lighter(r,g),b)
    # Only the connected export backdrop is transparent. Global color-keying
    # would punch holes through the jade roller and the frog's green headband.
    region=distance.point(lambda x: 0 if x<18 else 255)
    ImageDraw.floodfill(region,(0,0),128)
    alpha=region.point(lambda x: 0 if x==128 else 255)
    alpha=alpha.filter(ImageFilter.GaussianBlur(.45))
    im = im.convert('RGBA'); im.putalpha(alpha)
    return im

for name in ['cat','frog','bunny']:
    im=matte(Image.open(ROOT/'reference'/f'{name}-original.png'))
    im.resize((1000,1000),Image.Resampling.LANCZOS).save(OUT/f'{name}.webp',quality=91)

atlas=Image.open(ROOT/'reference'/'tools-original.png')
names=['cleanser','cotton','mask-brush','roller','dropper','patches','towel','spray','makeup-brush','lipstick','compact','sponge']
w,h=atlas.size
for i,name in enumerate(names):
    x,y=i%4,i//4
    # Inset also removes the separators produced by the atlas generator.
    im=matte(atlas.crop((round(x*w/4)+12,round(y*h/3)+12,round((x+1)*w/4)-12,round((y+1)*h/3)-12)))
    box=im.getbbox()
    if box: im=im.crop(box)
    im.thumbnail((220,260),Image.Resampling.LANCZOS)
    canvas=Image.new('RGBA',(256,288))
    canvas.alpha_composite(im,((256-im.width)//2,(288-im.height)//2))
    canvas.save(OUT/f'{name}.webp',quality=92)

# Two generated hydrogel pieces, rotated to rest naturally below the eyes.
pair=Image.open(OUT/'patches.webp').convert('RGBA')
for name,box,angle in [('patch-left',(0,0,128,288),90),('patch-right',(128,0,256,288),-90)]:
    part=pair.crop(box)
    part=part.crop(part.getbbox()).rotate(angle,expand=True,resample=Image.Resampling.BICUBIC)
    part.save(OUT/f'{name}.webp',quality=94)

spa=Image.open(ROOT/'reference'/'spa-original.png')
spa.thumbnail((1920,1080),Image.Resampling.LANCZOS)
spa.save(OUT/'spa.webp',quality=84)
print(f'Packed {len(list(OUT.glob("*.webp")))} web assets into {OUT}')
