from pathlib import Path
from PIL import Image
import numpy as np
import urllib.request

root=Path(__file__).resolve().parents[1]
folder=root/'reference/reward-fx';folder.mkdir(parents=True,exist_ok=True)
sources={
 'reward-rays':'https://d8j0ntlcm91z4.cloudfront.net/user_3D5kdXPlCRSJxCIcXJ9sMjqKOkj/hf_20260930_003007_6302edf2-a2d0-4c80-95f3-2eca925dea7d.png',
 'reward-coin':'https://d8j0ntlcm91z4.cloudfront.net/user_3D5kdXPlCRSJxCIcXJ9sMjqKOkj/hf_20260930_003054_60ba5da8-67e0-4c62-9de5-0e6c3456a064.png'
}
for name,url in sources.items():
    path=folder/(name+'.png')
    if not path.exists(): urllib.request.urlretrieve(url,path)
    a=np.array(Image.open(path).convert('RGBA')).astype(float)
    if name=='reward-rays':
        alpha=np.max(a[:,:,:3],axis=2)/255
        alpha[alpha<.035]=0
        a[:,:,:3]=np.minimum(255,a[:,:,:3]/np.maximum(alpha[:,:,None],.001))
        a[:,:,3]=alpha*255
    else:
        r,g,b=a[:,:,0],a[:,:,1],a[:,:,2]
        a[:,:,3]=np.clip((135-(np.minimum(g,b)-r))/65,0,1)*255
        a[(g>170)&(b>170)&(r<95),3]=0
    im=Image.fromarray(a.astype('uint8'))
    if name=='reward-coin': im=im.crop(im.getbbox())
    im.thumbnail((640,640) if name=='reward-rays' else (192,192),Image.Resampling.LANCZOS)
    im.save(root/'public/assets/ui'/(name+'.webp'),quality=96)
    print(name,im.size)
