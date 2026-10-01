from pathlib import Path
from PIL import Image, ImageChops, ImageOps
import json

root=Path('reference/dressup-expansion')
out=Path('public/assets/ui')
keys=['garden','city','seaside','evening']
# Generated sheets preserve columns, but reserve more height for the character rows.
rows=[(0,.393,.790,1),(0,.379,.762,1),(0,.390,.772,1),(0,.378,.752,1)]
names=['base','dressed','layered','finished','dress','jacket','shoes','bag','clip']
report=[]
for index,key in enumerate(keys):
    master=Image.open(root/f'master-{index}.png').convert('RGB')
    w,h=master.size
    for cell,name in enumerate(names):
        row,col=divmod(cell,3)
        crop=(round(col*w/3),round(rows[index][row]*h),round((col+1)*w/3),round(rows[index][row+1]*h))
        im=master.crop(crop)
        r,g,b=im.split()
        cyan=ImageChops.subtract(ImageChops.darker(g,b),r)
        alpha=cyan.point(lambda v:255 if v<70 else max(0,round((150-v)*255/80)))
        im=im.convert('RGBA');im.putalpha(alpha)
        box=alpha.point(lambda v:255 if v>100 else 0).getbbox()
        assert box, (key,name)
        if cell<4:
            # Register every portrait by head center and feet; bags cannot shift the body.
            head=alpha.crop((0,box[1],im.width,box[1]+round((box[3]-box[1])*.19))).point(lambda v:255 if v>100 else 0).getbbox()
            center=(head[0]+head[2])/2
            scale=720/(box[3]-box[1])
            part=im.crop(box)
            part=part.resize((round(part.width*scale),720),Image.Resampling.LANCZOS)
            result=Image.new('RGBA',(512,768))
            result.alpha_composite(part,(round(256-(center-box[0])*scale),24))
        else:
            part=im.crop(box);part.thumbnail((420,420),Image.Resampling.LANCZOS)
            result=ImageOps.expand(part,border=4)
        result.save(out/f'world-outfit-{key}-{name}.webp',quality=96)
        report.append({'theme':key,'sprite':name,'sourceCrop':crop,'alphaBox':box,'size':result.size})
(root/'packing.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
