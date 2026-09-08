"""Inspect public restaurant source content without executing its scripts."""
import json, re, sys
from pathlib import Path
from html.parser import HTMLParser

class Audit(HTMLParser):
    def __init__(self):
        super().__init__()
        self.skip = 0
        self.text, self.links, self.media = [], [], []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ('script', 'style'): self.skip += 1
        if tag == 'a': self.links.append(attrs.get('href', ''))
        if tag in ('img', 'iframe', 'video', 'source'): self.media.append(attrs)
    def handle_endtag(self, tag):
        if tag in ('script', 'style'): self.skip = max(0, self.skip - 1)
    def handle_data(self, value):
        if not self.skip and value.strip(): self.text.append(value.strip())

source = Path(sys.argv[1]).read_text(encoding='utf-8')
audit = Audit()
audit.feed(source)
urls = list(dict.fromkeys(re.findall(r'https?[^\s"\)<>]+', source)))
print(json.dumps({'text': audit.text, 'links': list(dict.fromkeys(audit.links)), 'media': audit.media,
                  'images': [u for u in urls if re.search(r'\.(?:png|jpe?g|webp|svg)(?:$|\?)', u)]}, ensure_ascii=False, indent=2))
