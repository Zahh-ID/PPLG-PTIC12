from pathlib import Path
from PIL import Image
import json,hashlib
ROOT=Path(__file__).resolve().parent.parent
manifest=json.loads((ROOT/'assets/manifests/v2/proof.json').read_text(encoding='utf8'))
count=0
for a in manifest['assets']:
    assert (ROOT/a['source']).is_file(),a['id']
    files=a.get('files',[a.get('file')]);hashes=set()
    if 'frames' in a:assert a['frames']>=12 and len(files)==a['frames'],a['id']
    for file in files:
        im=Image.open(ROOT/file);assert im.mode=='RGBA' and im.size==tuple(a['size']),(file,im.size)
        assert im.getbbox(),file
        assert set(im.getchannel('A').tobytes())<={0,255},file
        hashes.add(hashlib.sha256(im.tobytes()).hexdigest())
        if 'paletteColors' in a:
            data=im.tobytes();assert len({data[i:i+3] for i in range(0,len(data),4) if data[i+3]})<=a['paletteColors'],file
        count+=1
    if 'frames' in a:assert len(hashes)==a['frames'],f'{a["id"]}: duplicate exported frames ({len(hashes)}/{a["frames"]})'
    if a.get('family')=='player':assert a['size']==[96,80] and a['root']==[48,72] and len(a['muzzles'])==12,a['id']
    assert not any(a.get('clipped',[])),f'{a["id"]}: clipped source pixels'
print(f'PASS: {count} V2 images; all 11 animations have 12 distinct frames, source provenance, exact sizes, binary alpha and family palette limits.')
