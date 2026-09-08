"""Import images from the user-specified HANA source and its linked pages."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageOps, ImageDraw
import io, json, re, urllib.request

pages = [('https://ca.camcam.click/hana', 'assets/source-camcam.html'),
         ('https://ca.camcam.click/hana-2', 'assets/source-camcam-2.html'),
         ('https://ca.camcam.click/hana-3', 'assets/source-camcam-3.html')]
existing = json.loads(Path('assets/images/sources.json').read_text())
def asset_id(url):
    match = re.search(r'/([0-9a-f]{40,})-w:', url)
    return match.group(1) if match else url
known = {asset_id(url) for filename,url in existing.items() if not filename.startswith('hana-source-')}
found = {}
for page, filename in pages:
    source = Path(filename).read_text(encoding='utf-8')
    for url in re.findall(r'https://statics\.pancake\.vn/web-media/[^\s"\)<>]+\.jpg', source):
        if asset_id(url) not in known: found.setdefault(url, page)

def download(item):
    index, (url, page) = item
    image = Image.open(io.BytesIO(urllib.request.urlopen(url,timeout=30).read())).convert('RGB')
    image.thumbnail((1400,1400))
    filename = f'hana-source-{index+1}.webp'
    image.save('assets/images/'+filename,quality=83)
    return filename, image, {'imageUrl':url,'sourcePage':page,'verifiedOn':'2026-09-07'}

results = list(ThreadPoolExecutor(6).map(download,enumerate(found.items())))
if not results: raise SystemExit('No new source images were found.')
sheet=Image.new('RGB',(1000,((len(results)+3)//4)*280),'#eee')
draw=ImageDraw.Draw(sheet)
provenance={}
for index,(filename,image,source) in enumerate(results):
    thumb=ImageOps.contain(image,(245,245))
    sheet.paste(thumb,((index%4)*250,(index//4)*280))
    draw.text(((index%4)*250+5,(index//4)*280+252),filename,fill='black')
    existing[filename]=source['imageUrl']
    provenance[filename]=source
Path('assets/images/sources.json').write_text(json.dumps(existing,indent=2)+'\n')
Path('assets/images/camcam-sources.json').write_text(json.dumps(provenance,indent=2)+'\n')
Path('test-results').mkdir(exist_ok=True)
sheet.save('test-results/camcam-contact-sheet.jpg')
print('Imported',len(results),'new photographs with source provenance.')
