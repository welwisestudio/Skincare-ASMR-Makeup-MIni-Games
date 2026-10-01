"""Prepare generated Higgsfield backgrounds and effect/ribbon sprite sheets."""
from pathlib import Path
from PIL import Image, ImageChops, ImageOps

root=Path(__file__).resolve().parents[1]
source=root/'reference/ui-polish'
out=root/'public/assets/ui'

def sprite(sheet,name,box,limit):
    im=Image.open(source/f'{sheet}.png').convert('RGB')
    w,h=im.size
    im=im.crop(tuple(round(v*(w if i%2==0 else h)) for i,v in enumerate(box)))
    r,g,b=im.split()
    cyan=ImageChops.subtract(ImageChops.darker(g,b),r)
    alpha=cyan.point(lambda v:255 if v<85 else max(0,round((170-v)*255/85)))
    im=im.convert('RGBA');im.putalpha(alpha)
    bounds=alpha.point(lambda v:255 if v>90 else 0).getbbox()
    im=im.crop(bounds);im.thumbnail((limit,limit),Image.Resampling.LANCZOS)
    ImageOps.expand(im,border=3,fill=(0,0,0,0)).save(out/f'{name}.webp',quality=96)

for name in ['spa-room','celebration']:
    im=Image.open(source/f'{name}.png');im.thumbnail((2400,2400),Image.Resampling.LANCZOS);im.save(out/f'{name}.webp',quality=93)
sprite('ribbons-v3','ribbon-pink',(0,0,1,.5),1200)
sprite('ribbons-v3','ribbon-gold',(0,.5,1,1),1200)
for i,name in enumerate(['bubble','heart','petal','glint']):
    x,y=i%2,i//2
    sprite('vfx',name,(x/2+.01,y/2+.01,(x+1)/2-.01,(y+1)/2-.01),360)
print('Packed 8 new illustrated assets')
