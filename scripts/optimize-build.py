"""Optimize only dist; public assets are immutable inputs. Python + Pillow required."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, __version__ as PILLOW_VERSION, features
import argparse
import hashlib
import io
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--quality', type=int, default=82)
parser.add_argument('--budget', type=int, default=20_000_000)
args = parser.parse_args()
assert 80 <= args.quality <= 100
source, dist = ROOT / 'public', ROOT / 'dist'
assert (dist / 'index.html').is_file(), 'Run vite build first'
cache = ROOT / 'reference/build-compression/cache'
cache.mkdir(parents=True, exist_ok=True)
encoder = f'Pillow-{PILLOW_VERSION}-webp-{features.version("webp")}-m6-exact'
source_hashes = {}
profile = json.loads((ROOT/'scripts/compression-profile.json').read_text(encoding='utf-8'))['overrides']
registered = set(json.loads(subprocess.check_output([
    'node', '--input-type=module', '-e',
    "import {UI_ASSETS} from './src/ui-assets.js'; console.log(JSON.stringify(UI_ASSETS));"
], cwd=ROOT, text=True)))

def sha(data):
    return hashlib.sha256(data).hexdigest()

def optimize(path):
    rel = path.relative_to(source)
    original = path.read_bytes()
    digest = sha(original)
    source_hashes[rel.as_posix()] = digest
    # Preserve small UI, text and icons byte-for-byte.
    quality = profile.get(rel.as_posix(), args.quality)
    original_image = Image.open(io.BytesIO(original))
    if len(original) < 24576 or quality == 'original':
        encoded = original
    else:
        key = sha(f'{digest}:{quality}:{encoder}'.encode())
        cached = cache / (key + '.webp')
        if cached.exists():
            encoded = cached.read_bytes()
        else:
            output = io.BytesIO()
            original_image.save(output, 'WEBP', quality=quality, method=6, exact=True)
            encoded = output.getvalue()
            cached.write_bytes(encoded)
        if len(encoded) >= len(original):
            encoded = original
    result = Image.open(io.BytesIO(encoded))
    assert result.size == original_image.size, f'Resolution changed: {rel}'
    assert result.convert('RGBA').getchannel('A').tobytes() == original_image.convert('RGBA').getchannel('A').tobytes(), f'Alpha changed: {rel}'
    # Always encode from public, never from a previously compressed dist image.
    (dist / rel).write_bytes(encoded)
    return {'path': rel.as_posix(), 'source_sha256': digest, 'output_sha256': sha(encoded),
            'original_bytes': len(original), 'bytes': len(encoded), 'size': list(result.size),
            'quality': quality if encoded != original else 'original', 'alpha_exact': True}

before = sum(p.stat().st_size for p in dist.rglob('*') if p.is_file())
unused = [p for p in (source/'assets/ui').glob('*.webp') if p.stem not in registered]
for path in unused:
    target = (dist/path.relative_to(source)).resolve()
    assert target.is_relative_to(dist.resolve())
    target.unlink(missing_ok=True) # Only unregistered build copies, never public.
with ThreadPoolExecutor(max_workers=6) as workers:
    rows = list(workers.map(optimize, sorted(p for p in source.rglob('*.webp') if p not in unused)))
after = sum(p.stat().st_size for p in dist.rglob('*') if p.is_file())
report = {'encoder': encoder, 'quality': args.quality, 'budget_bytes': args.budget,
          'before_bytes': before, 'after_bytes': after, 'excluded_unregistered_assets': [p.relative_to(source).as_posix() for p in unused], 'files': rows}
reports = ROOT / 'test-results/build-compression'
reports.mkdir(parents=True, exist_ok=True)
(reports / 'report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
assert all(sha((source / name).read_bytes()) == digest for name, digest in source_hashes.items()), 'Source asset modified'
print(f'Build: {before:,} -> {after:,} bytes ({after / 1e6:.2f} MB / {after / 1024**2:.2f} MiB)')
print(f'WebP: {sum(r["quality"] != "original" for r in rows)} optimized; original dimensions and exact alpha verified for {len(rows)} images.')
print('Original public assets unchanged. Restore with: npm run build:original')
if after > args.budget:
    raise SystemExit(f'Build exceeds {args.budget:,}-byte target; inspect report before publishing.')
