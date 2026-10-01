from pathlib import Path
from PIL import Image,ImageChops,ImageOps
names=['crown','locket','perfume','fan','music','tea','mirror','tiara','brooch','mask','globe','lantern']
out=Path('public/assets/ui')
for sheet in range(4):
 im=Image.open(f'reference/premium/sheet-{sheet}.png').convert('RGB');w,h=im.size
 for j in range(1 if sheet==3 else 4):
  boxes=[[(0,0,350,323),(350,0,700,323),(0,337,350,700),(350,345,700,700)],[(0,0,350,321),(350,0,700,327),(0,330,350,700),(350,350,700,700)],[(0,0,350,290),(350,0,700,286),(0,315,350,700),(350,287,700,700)]]
  part=im if sheet==3 else im.crop(tuple(round(v*(w if k%2==0 else h)/700) for k,v in enumerate(boxes[sheet][j])))
  r,g,b=part.split();cyan=ImageChops.subtract(ImageChops.darker(g,b),r);alpha=cyan.point(lambda v:255 if v<70 else max(0,round((150-v)*255/80)))
  # Remove stray slivers from a neighboring cell while preserving all substantive pieces.
  mask=alpha.point(lambda v:255 if v>100 else 0);pixels=bytearray(mask.tobytes());pw,ph=mask.size;largest=[]
  for pos in range(len(pixels)):
   if not pixels[pos]:continue
   stack=[pos];pixels[pos]=0;component=[]
   while stack:
    k=stack.pop();component.append(k);x=k%pw;y=k//pw
    for nxt in ([k-1] if x else [])+([k+1] if x<pw-1 else [])+([k-pw] if y else [])+([k+pw] if y<ph-1 else []):
     if pixels[nxt]:pixels[nxt]=0;stack.append(nxt)
   if len(component)>len(largest):largest=component
   if len(component)<pw*ph*.003:
    for k in component:alpha.putpixel((k%pw,k//pw),0)
  part=part.convert('RGBA');part.putalpha(alpha);bounds=(min(k%pw for k in largest),min(k//pw for k in largest),max(k%pw for k in largest)+1,max(k//pw for k in largest)+1);part=part.crop(bounds);part.thumbnail((760,900),Image.Resampling.LANCZOS)
  key='frame' if sheet==3 else names[sheet*4+j]
  ImageOps.expand(part,border=4,fill=(0,0,0,0)).save(out/f'vip-{key}.webp',quality=96)
print('Packed 13 Higgsfield assets')
