from pathlib import Path
from PIL import Image,ImageChops,ImageOps
out=Path('public/assets/ui');names=['jet','rug','sofa','bath','car','yacht','boutique','beauty']
for i,name in enumerate(names):
 im=Image.open(f'reference/premium-redesign/scene-{i}.png');im.thumbnail((1200,1500));im.save(out/f'clean-{name}.webp',quality=95)
for sheet,keys in [(8,['vacuum','brush','squeegee','spray']),(9,['cushion','blanket','towels','bag'])]:
 path=Path(f'reference/premium-redesign/scene-{sheet}.png')
 if not path.exists():continue
 im=Image.open(path).convert('RGB');w,h=im.size
 for i,key in enumerate(keys):
  part=im.crop((i%2*w//2,i//2*h//2,(i%2+1)*w//2,(i//2+1)*h//2));r,g,b=part.split();cyan=ImageChops.subtract(ImageChops.darker(g,b),r);alpha=cyan.point(lambda v:255 if v<70 else max(0,round((150-v)*255/80)));part=part.convert('RGBA');part.putalpha(alpha);part=part.crop(alpha.point(lambda v:255 if v>100 else 0).getbbox());part.thumbnail((480,480),Image.Resampling.LANCZOS);ImageOps.expand(part,border=4).save(out/f'clean-{key}.webp',quality=96)

# Isolated sofa replacement: keep the full source coordinate system for its mask.
sofa=Path('reference/premium-redesign/sofa-isolated.png')
if sofa.exists():
 im=Image.open(sofa).convert('RGB');r,g,b=im.split()
 cyan=ImageChops.subtract(ImageChops.darker(g,b),r)
 alpha=cyan.point(lambda v:255 if v<70 else max(0,round((150-v)*255/80)))
 im=im.convert('RGBA');im.putalpha(alpha)
 im.save(out/'clean-sofa.webp',quality=96)
 # Furniture feet are not an upholstered cleaning surface.
 from PIL import ImageDraw
 upholstery=alpha.copy();ImageDraw.Draw(upholstery).rectangle((0,round(im.height*.763),im.width,im.height),fill=0)
 mask=Image.new('RGBA',im.size,(255,255,255,255));mask.putalpha(upholstery)
 mask.save(out/'clean-sofa-mask.webp',lossless=True)

# Final isolated cleaning scenes and shared rubbish assets.
import runpy
runpy.run_path("scripts/pack-cleaning-audit.py")
