from pathlib import Path, PurePosixPath
from zipfile import ZipFile
import re

root = Path(__file__).resolve().parents[1]
archive = root / 'Skincare-ASMR-web.zip'
dist = root / 'dist'
with ZipFile(archive) as z:
    names = z.namelist()
    assert 'index.html' in names, 'Missing root index.html'
    assert len(names) == len(set(names)), 'Duplicate ZIP entries'
    for name in names:
        path = PurePosixPath(name)
        assert not path.is_absolute() and '\\' not in name, f'Invalid ZIP path: {name}'
        assert all(part not in ('.', '..') and re.fullmatch(r'[A-Za-z0-9_.-]+', part)
                   for part in name.rstrip('/').split('/')), f'Invalid archive filename: {name}'
    files = [p for p in dist.rglob('*') if p.is_file()]
    entries = {name for name in names if not name.endswith('/')}
    assert entries == {p.relative_to(dist).as_posix() for p in files}, 'ZIP contents differ from dist'
    assert all(z.read(p.relative_to(dist).as_posix()) == p.read_bytes() for p in files), 'ZIP bytes differ from dist'
    assert z.testzip() is None, 'ZIP CRC check failed'
    print(f'ZIP verified: {len(files)} files, valid Latin names, root index.html, {archive.stat().st_size:,} bytes')
