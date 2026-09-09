"""Extract the dish photographs explicitly shown in the supplied HANA menus."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
CURRENT_PDF = ROOT / "MENU.pdf"
OUTPUT = ROOT / "assets" / "images" / "menu-items"
PREVIEW = ROOT / "tmp" / "pdfs" / "menu-item-contact-sheet.jpg"

# One-based page numbers and pixel coordinates refer to the 1701 x 1193
# flattened artwork in MENU.pdf. Crops are limited to photographs that can be
# attributed to a numbered dish without guessing.
MENU_CROPS = {
    "hana-3": (3, (170, 355, 660, 535)),
    "hana-10": (3, (430, 470, 835, 720)),
    "hana-13": (3, (5, 505, 425, 735)),
    "hana-14": (3, (410, 680, 815, 985)),
    "hana-15": (4, (80, 520, 470, 805)),
    "hana-20": (4, (360, 640, 810, 945)),
    "hana-16": (3, (1240, 885, 1515, 995)),
    "hana-17": (3, (1240, 1005, 1515, 1120)),
    "hana-30a": (5, (20, 350, 850, 817)),
    "hana-60a": (6, (0, 660, 500, 941)),
    "hana-70a": (7, (320, 400, 600, 558)),
    "hana-100a": (7, (150, 710, 770, 1059)),
    "hana-110a": (7, (520, 520, 850, 706)),
    "hana-203": (8, (270, 720, 830, 1035)),
    "hana-205": (8, (0, 630, 340, 821)),
    "hana-25": (9, (90, 420, 850, 848)),
    "hana-213": (10, (85, 660, 365, 750)),
    "hana-214": (10, (85, 830, 365, 940)),
    "hana-216": (10, (450, 455, 735, 575)),
    "hana-230": (10, (955, 500, 1290, 635)),
    "hana-231": (10, (955, 825, 1290, 965)),
    "hana-232": (10, (1325, 500, 1665, 635)),
    "hana-233": (10, (1320, 825, 1665, 965)),
    "hana-242": (11, (75, 430, 370, 560)),
    "hana-243": (11, (75, 645, 370, 770)),
    "hana-245": (11, (75, 905, 370, 1035)),
    "hana-246": (11, (465, 305, 740, 430)),
    "hana-248": (11, (465, 605, 740, 735)),
    "hana-249": (11, (465, 845, 740, 960)),
    "hana-260": (11, (965, 300, 1285, 420)),
    "hana-263": (11, (965, 620, 1285, 735)),
    "hana-265": (11, (965, 890, 1290, 1035)),
    "hana-266": (11, (1355, 305, 1655, 420)),
    "hana-267": (11, (1355, 505, 1655, 615)),
    "hana-270": (11, (1355, 825, 1660, 965)),
    "hana-280": (12, (75, 475, 370, 605)),
    "hana-283": (12, (75, 935, 370, 1070)),
    "hana-284": (12, (445, 545, 745, 685)),
    "hana-285": (12, (455, 795, 745, 945)),
    "hana-286": (12, (975, 150, 1290, 305)),
    "hana-287": (12, (975, 410, 1290, 555)),
    "hana-291": (12, (1360, 410, 1665, 555)),
    "hana-310": (13, (0, 0, 850, 405)),
    "hana-324": (13, (850, 0, 1701, 405)),
    "hana-330": (14, (80, 330, 370, 460)),
    "hana-332": (14, (80, 675, 370, 825)),
    "hana-333": (14, (80, 930, 370, 1055)),
    "hana-335": (14, (460, 415, 745, 525)),
    "hana-336": (14, (460, 665, 745, 815)),
    "hana-338": (14, (965, 225, 1290, 370)),
    "hana-339": (14, (990, 530, 1290, 720)),
    "hana-340": (14, (1350, 270, 1670, 465)),
}


def current_page_artwork(page_number: int) -> Image.Image:
    page = PdfReader(CURRENT_PDF).pages[page_number - 1]
    images = sorted(page.images, key=lambda image: len(image.data), reverse=True)
    if not images:
        raise RuntimeError(f"No embedded artwork found on page {page_number}")
    artwork = images[0].image.convert("RGB")
    if artwork.size != (1701, 1193):
        raise RuntimeError(
            f"Unexpected MENU.pdf artwork size on page {page_number}: {artwork.size}"
        )
    return artwork


def contact_sheet(crops: list[tuple[str, Image.Image]]) -> None:
    cell_width, cell_height = 220, 150
    columns = 4
    rows = (len(crops) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * cell_width, rows * cell_height), "#161513")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()
    for index, (dish_id, crop) in enumerate(crops):
        x = (index % columns) * cell_width
        y = (index // columns) * cell_height
        preview = crop.copy()
        preview.thumbnail((cell_width - 20, cell_height - 34), Image.Resampling.LANCZOS)
        sheet.paste(preview, (x + (cell_width - preview.width) // 2, y + 24))
        draw.text((x + 9, y + 7), dish_id, fill="#f0c978", font=font)
    PREVIEW.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(PREVIEW, quality=90, optimize=True)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    previews = []
    pages = {}
    for dish_id, (page_number, bounds) in MENU_CROPS.items():
        if page_number not in pages:
            pages[page_number] = current_page_artwork(page_number)
        crop = pages[page_number].crop(bounds).filter(
            ImageFilter.UnsharpMask(radius=0.75, percent=125, threshold=2)
        )
        crop.save(OUTPUT / f"{dish_id}.webp", "WEBP", quality=88, method=6)
        previews.append((dish_id, crop))
    contact_sheet(previews)
    print(f"Extracted {len(previews)} dish photographs to {OUTPUT}")
    print(f"Contact sheet: {PREVIEW}")


if __name__ == "__main__":
    main()
