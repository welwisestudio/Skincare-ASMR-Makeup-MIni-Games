"""Extract the cyan matte from the Higgsfield tutorial cursor master."""
from pathlib import Path
from PIL import Image
import numpy as np
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / 'reference/hints/hand.png'
source.parent.mkdir(parents=True, exist_ok=True)
if not source.exists():
    urllib.request.urlretrieve('https://d8j0ntlcm91z4.cloudfront.net/user_3D5kdXPlCRSJxCIcXJ9sMjqKOkj/hf_20260930_000554_59fdbc69-4b2f-49fe-b549-89b89b6fdef3.png', source)
im = Image.open(source).convert('RGBA')
a = np.array(im).astype(float)
r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
a[:, :, 3] = np.clip((135 - (np.minimum(g, b) - r)) / 65, 0, 1) * 255
a[(g > 170) & (b > 170) & (r < 95), 3] = 0
im = Image.fromarray(a.astype('uint8'))
im = im.crop(im.getbbox())
im.thumbnail((384, 384), Image.Resampling.LANCZOS)
out = Image.new('RGBA', (im.width + 8, im.height + 8))
out.paste(im, (4, 4))
out.save(ROOT / 'public/assets/ui/hint-hand.webp', quality=96)
print('Tutorial hand packed:', out.size)
