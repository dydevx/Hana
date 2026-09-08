from pathlib import Path
import re, urllib.request, io, json
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageOps, ImageDraw

source = Path('assets/source-hana.html').read_text(encoding='utf-8')
urls = list(dict.fromkeys(re.findall(r'https://content\.pancake\.vn/1/fwebp80/[^\s"\)<>]+', source)))
def download(pair):
    i, url = pair
    data = urllib.request.urlopen(url).read()
    img = Image.open(io.BytesIO(data)).convert('RGB')
    img.thumbnail((1400,1400))
    img.save(f'assets/images/hana-{i}.webp', quality=83)
    return i, img, url
results = sorted(ThreadPoolExecutor(8).map(download, enumerate(urls)))
sheet = Image.new('RGB', (1000, ((len(results)+4)//5)*230), '#eeeeee')
draw = ImageDraw.Draw(sheet)
for i, img, url in results:
    thumb = ImageOps.contain(img,(195,195))
    sheet.paste(thumb, ((i%5)*200,(i//5)*230))
    draw.text(((i%5)*200+5,(i//5)*230+200),str(i),fill='black')
sheet.save('assets/contact-sheet.jpg')
Path('assets/images/sources.json').write_text(json.dumps({f'hana-{i}.webp':url for i,img,url in results}, indent=2))
for family, name in [('Cormorant+Garamond:wght@400;500;600','cormorant'), ('Inter:wght@400;500;600','inter')]:
    req=urllib.request.Request('https://fonts.googleapis.com/css2?family='+family+'&display=swap', headers={'User-Agent':'Mozilla/5.0'})
    css=urllib.request.urlopen(req).read().decode()
    fonturl=re.findall(r'url\((.*?)\)',css)[-1]
    Path('assets/fonts/'+name+'.woff2').write_bytes(urllib.request.urlopen(fonturl).read())
print('Downloaded',len(results),'HANA images and 2 local fonts')
