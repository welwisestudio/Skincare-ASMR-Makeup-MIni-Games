from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import argparse
import re

parser = argparse.ArgumentParser()
parser.add_argument('--adtest', action='store_true')
args = parser.parse_args()

root = Path(__file__).resolve().parents[1]
dist = root / 'dist'
assert (dist / 'index.html').is_file(), 'Build is missing'
files = sorted(path for path in dist.rglob('*') if path.is_file())
invalid = [path.relative_to(dist).as_posix() for path in files
           if any(not re.fullmatch(r'[A-Za-z0-9_.-]+', part)
                  for part in path.relative_to(dist).parts)]
if invalid:
    raise SystemExit('Invalid Playables filenames:\n' + '\n'.join(invalid))
target = root / ('Skincare-ASMR-adtest.zip' if args.adtest else 'Skincare-ASMR-web.zip')
with ZipFile(target, 'w', ZIP_DEFLATED, compresslevel=9) as archive:
    for path in files:
        archive.write(path, path.relative_to(dist).as_posix())
print(f'{target.name}: {target.stat().st_size:,} bytes')
