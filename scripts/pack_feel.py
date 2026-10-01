from pathlib import Path
from PIL import Image, ImageChops, ImageOps, ImageDraw, ImageFilter

root=Path(__file__).resolve().parents[1]
source=root/'reference/feel'
out=root/'public/assets/ui'

def sprite(sheet,name,box,limit=500):
    im=Image.open(source/f'{sheet}.png').convert('RGB');w,h=im.size
    im=im.crop(tuple(round(v*(w if i%2==0 else h)) for i,v in enumerate(box)))
    r,g,b=im.split();cyan=ImageChops.subtract(ImageChops.darker(g,b),r)
    alpha=cyan.point(lambda v:255 if v<85 else max(0,round((170-v)*255/85)))
    im=im.convert('RGBA');im.putalpha(alpha)
    if name in ['foam-puff','mist-cloud','powder-stroke']:
        # Remove cyan spill from translucent white material, not just its matte.
        pixels=[]
        for rr,gg,bb,aa in im.getdata():
            if not aa:pixels.append((0,0,0,0));continue
            opacity=aa/255
            pixels.append((min(255,round(rr/opacity)),max(0,min(255,round((gg-255*(1-opacity))/opacity))),max(0,min(255,round((bb-255*(1-opacity))/opacity))),aa))
        im.putdata(pixels)
    im=im.crop(alpha.point(lambda v:255 if v>90 else 0).getbbox())
    im.thumbnail((limit,limit),Image.Resampling.LANCZOS)
    ImageOps.expand(im,border=3,fill=(0,0,0,0)).save(out/f'{name}.webp',quality=96)

for i,name in enumerate(['play','restart','levels','next','finish','back']):
    x,y=i%3,i//3;sprite('action-icons','action-'+name,(x/3+.018,y/3+.018,(x+1)/3-.018,(y+1)/3-.018),240)
for i,name in enumerate(['serum-drop','water-puddle','foam-puff','mist-cloud','powder-stroke','mask-curl']):
    x,y=i%3,i//3;sprite('tactile-fx',name,(x/3+.015,y/2+.015,(x+1)/3-.015,(y+1)/2-.015))
sprite('progress-v4','progress-green',(0,0,1,1),1000)

# Restrict edits to feathered eye patches: head, skin, hair and silhouette never move.
for name,size,ox,oy,eyeY,eyeDX in [('cat',740,-70,-70,330,79),('frog',700,-50,-43,340,80),('bunny',680,-40,-18,352,76)]:
    im=Image.open(source/f'{name}-open.png').convert('RGBA');ratio=im.width/size
    for side,label in [(-1,'left'),(1,'right')]:
        x,y=300+side*eyeDX,eyeY-10
        box=((x-62-ox)*ratio,(y-42-oy)*ratio,(x+62-ox)*ratio,(y+42-oy)*ratio)
        patch=im.crop(tuple(round(v) for v in box)).resize((372,252),Image.Resampling.LANCZOS)
        mask=Image.new('L',patch.size);d=ImageDraw.Draw(mask)
        d.rounded_rectangle((14,14,358,238),radius=65,fill=255)
        mask=mask.filter(ImageFilter.GaussianBlur(10));patch.putalpha(mask)
        patch.save(root/f'public/assets/{name}-eye-{label}.webp',quality=96)
print('Packed 13 UI/effect assets and 6 feathered eye patches')
