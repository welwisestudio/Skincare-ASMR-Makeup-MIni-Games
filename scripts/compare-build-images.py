"""Verify geometry/alpha and measure visible-pixel distortion; not a perceptual guarantee."""
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
import json

root = Path(__file__).resolve().parents[1]
report = json.loads((root / 'test-results/build-compression/report.json').read_text())
out = root / 'test-results/build-compression'

def boxmean(x, size=7):
    summed = np.pad(x, ((size//2, size//2), (size//2, size//2)), mode='reflect')
    summed = np.pad(summed, ((1, 0), (1, 0))).cumsum(0).cumsum(1)
    return (summed[size:, size:] - summed[:-size, size:] - summed[size:, :-size] + summed[:-size, :-size]) / size**2

def metrics(original, candidate):
    a = np.asarray(original.convert('RGBA'), dtype=np.float64)
    b = np.asarray(candidate.convert('RGBA'), dtype=np.float64)
    alpha = a[:, :, 3:4] / 255
    a = a[:, :, :3] * alpha + 240 * (1 - alpha)
    b = b[:, :, :3] * alpha + 240 * (1 - alpha)
    visible = alpha[:, :, 0] > .1
    mse = ((a-b)**2)[visible].mean()
    psnr = float(10*np.log10(255**2/mse)) if mse else 100.0
    # Native-resolution luminance SSIM, uniform 7x7 window, only visible pixels.
    a = a @ np.array([.299, .587, .114]); b = b @ np.array([.299, .587, .114])
    ma, mb = boxmean(a), boxmean(b)
    va, vb, covariance = boxmean(a*a)-ma*ma, boxmean(b*b)-mb*mb, boxmean(a*b)-ma*mb
    ssim = ((2*ma*mb+6.5025)*(2*covariance+58.5225))/((ma*ma+mb*mb+6.5025)*(va+vb+58.5225))
    return round(psnr, 3), round(float(ssim[visible].mean()), 6)

rows = []
for row in report['files']:
    if row['quality'] == 'original':
        continue
    original, candidate = Image.open(root/'public'/row['path']), Image.open(root/'dist'/row['path'])
    psnr, ssim = metrics(original, candidate)
    rows.append({'path': row['path'], 'psnr_visible_rgb': psnr, 'ssim_visible_luma': ssim})
rows.sort(key=lambda r:r['ssim_visible_luma'])
(out/'quality.json').write_text(json.dumps({'note':'Native-resolution visible RGB PSNR and visible luminance SSIM (uniform 7x7); numerical indicators, not proof of imperceptibility.', 'files':rows}, indent=2))
print('Lowest SSIM:', json.dumps(rows[:10], indent=2))
print('Mean SSIM:', round(sum(r['ssim_visible_luma'] for r in rows)/len(rows), 6))

# Worst numerical cases + faces, carpet, borders and a full-screen background.
selected = list(dict.fromkeys([r['path'] for r in rows[:5]] + [
    'assets/ui/romance-coral-wedding.webp','assets/ui/clean-rug.webp',
    'assets/ui/vip-frame.webp','assets/ui/spa-room.webp','assets/ui/clean-car.webp']))
for index, name in enumerate(selected):
    a=Image.open(root/'public'/name).convert('RGBA'); b=Image.open(root/'dist'/name).convert('RGBA')
    background=Image.new('RGBA',a.size,'#f2e3d7')
    a=Image.alpha_composite(background,a).convert('RGB');b=Image.alpha_composite(background,b).convert('RGB')
    w,h=a.size;box=(max(0,w//2-220),max(0,h//2-190),min(w,w//2+220),min(h,h//2+190))
    sheet=Image.new('RGB',(910,425),'#eeeeee');draw=ImageDraw.Draw(sheet)
    draw.text((10,8),Path(name).stem+' / ORIGINAL',fill='black');draw.text((465,8),'OPTIMIZED / 100% NATIVE PIXELS',fill='black')
    sheet.paste(a.crop(box),(10,33));sheet.paste(b.crop(box),(465,33));sheet.save(out/f'compare-{index:02}.png')
