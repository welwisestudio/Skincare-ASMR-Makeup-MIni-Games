"""Slice the Higgsfield UI sheets into runtime sprites. No UI artwork is drawn here."""
from pathlib import Path
from PIL import Image, ImageChops, ImageOps
import json

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'reference/ui'
OUT=ROOT/'public/assets/ui'
OUT.mkdir(parents=True,exist_ok=True)
inventory=[]

def export(sheet,name,box=None,limit=700):
    im=Image.open(SRC/f'{sheet}.png').convert('RGB')
    if box:
        w,h=im.size
        im=im.crop(tuple(round(v*(w if i%2==0 else h)) for i,v in enumerate(box)))
    r,g,b=im.split()
    cyan=ImageChops.subtract(ImageChops.darker(g,b),r)
    alpha=cyan.point(lambda v:255 if v<100 else max(0,round((170-v)*255/70)))
    im=im.convert('RGBA');im.putalpha(alpha)
    bounds=alpha.point(lambda v:255 if v>100 else 0).getbbox()
    if bounds:im=im.crop(bounds)
    im.thumbnail((limit,limit),Image.Resampling.LANCZOS)
    im=ImageOps.expand(im,border=3,fill=(0,0,0,0))
    im.save(OUT/f'{name}.webp',quality=94)
    inventory.append({'key':f'ui-{name}','file':f'{name}.webp','size':im.size,'sheet':sheet,'crop':box})

for i,name in enumerate(['pause','back','settings','hint','sound','muted']):
    x,y=i%3,i//3
    export('controls',name,(x/3+.012,y/3+.012,(x+1)/3-.012,(y+1)/3-.012),192)
for name,box in [
    ('score',(.012,.025,.49,.295)),('coins',(.51,.025,.99,.295)),
    ('progress-track',(.012,.32,.49,.555)),('progress-fill',(.51,.32,.99,.555)),
    ('timer',(.015,.59,.49,.98)),('star',(.51,.59,.985,.98))]:
    export('hud',name,box,600 if 'progress' in name else 430)
for i,name in enumerate(['green-button','purple-button','pink-ribbon','gold-ribbon']):
    x,y=i%2,i//2
    export('banners',name,(x/2+.012,y/2+.012,(x+1)/2-.012,(y+1)/2-.012),700)
for name,box in [
    ('polaroid',(.04,.015,.475,.525)),('panel',(.53,.03,.96,.65)),
    ('trophy',(.025,.565,.545,.955)),('lock',(.64,.685,.865,.95))]:
    export('paper',name,box,850)
export('logo','logo',limit=1000)
frame=Image.open(OUT/'polaroid.webp').convert('RGBA')
pixels=frame.load()
for y in range(int(frame.height*.10),int(frame.height*.78)):
    for x in range(int(frame.width*.10),int(frame.width*.90)):
        r,g,b,a=pixels[x,y]
        if max(abs(r-94),abs(g-107),abs(b-100))<27:pixels[x,y]=(r,g,b,0)
frame.save(OUT/'polaroid-front.webp',quality=94)
inventory.append({'key':'ui-polaroid-front','file':'polaroid-front.webp','size':frame.size,'sheet':'paper'})
tiles=Image.open(SRC/('tiles-v2.png' if (SRC/'tiles-v2.png').exists() else 'tiles.png'));tiles.thumbnail((1000,1400),Image.Resampling.LANCZOS);tiles.save(OUT/'tiles.webp',quality=91)
inventory.append({'key':'ui-tiles','file':'tiles.webp','size':tiles.size,'sheet':'tiles'})
(OUT/'manifest.json').write_text(json.dumps(inventory,indent=2),encoding='utf8')
print(f'Packed {len(inventory)} generated UI sprites')
