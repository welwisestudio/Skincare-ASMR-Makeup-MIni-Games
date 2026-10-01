from pathlib import Path
import subprocess
import imageio_ffmpeg
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
video = next(root.glob('*.mp4'))
out = root / 'reference'
times = [5, 25, 55, 85, 125, 170, 225, 275, 325, 390, 455, 515, 575, 645, 710, 775, 850, 925]
sheet = Image.new('RGB', (6*240, 3*452), '#eee9f4')
for i, sec in enumerate(times):
    path = out / f'frame-{sec:03d}.jpg'
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-y', '-ss', str(sec), '-i', str(video), '-frames:v', '1', '-q:v', '2', str(path)], capture_output=True, check=True)
    thumb = Image.open(path).resize((240,427))
    x,y = (i%6)*240, (i//6)*452
    sheet.paste(thumb,(x,y+25))
    ImageDraw.Draw(sheet).text((x+8,y+5),f'{sec//60}:{sec%60:02d}',fill='black')
sheet.save(out/'contact-sheet.jpg')
print('reference/contact-sheet.jpg')
