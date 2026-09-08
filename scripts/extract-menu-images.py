"""Extract the dish photographs that are explicitly shown in FLyer Hana.pdf."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "FLyer Hana.pdf"
OUTPUT = ROOT / "assets" / "images" / "menu-items"
PREVIEW = ROOT / "tmp" / "pdfs" / "menu-item-contact-sheet.jpg"

# Pixel coordinates refer to the 1805 x 2533 embedded flyer artwork. Only
# photographs that can be associated with an individual numbered dish are used.
CROPS = {
    "hana-16": (288, 1998, 416, 2066),
    "hana-17": (288, 2072, 416, 2139),
    "hana-213": (222, 160, 298, 202),
    "hana-214": (306, 160, 382, 202),
    "hana-216": (392, 160, 470, 202),
    "hana-230": (291, 454, 415, 508),
    "hana-231": (291, 526, 415, 582),
    "hana-232": (291, 598, 415, 654),
    "hana-233": (291, 670, 415, 727),
    "hana-242": (294, 840, 417, 894),
    "hana-243": (294, 900, 417, 949),
    "hana-245": (294, 968, 417, 1020),
    "hana-248": (294, 1098, 417, 1153),
    "hana-249": (294, 1161, 417, 1208),
    "hana-260": (717, 104, 835, 160),
    "hana-263": (717, 224, 835, 281),
    "hana-265": (717, 305, 835, 364),
    "hana-266": (717, 363, 835, 412),
    "hana-267": (717, 421, 835, 479),
    "hana-270": (717, 563, 835, 624),
    "hana-280": (717, 754, 835, 817),
    "hana-283": (717, 910, 835, 971),
    "hana-284": (717, 985, 835, 1047),
    "hana-285": (717, 1059, 835, 1125),
    "hana-330": (1100, 498, 1245, 542),
    "hana-332": (1100, 603, 1245, 658),
    "hana-333": (1100, 662, 1245, 714),
    "hana-335": (1100, 754, 1245, 807),
    "hana-336": (1120, 817, 1245, 871),
    "hana-338": (1120, 914, 1245, 976),
    "hana-339": (1100, 1023, 1245, 1096),
    "hana-340": (1120, 1128, 1245, 1190),
}


def source_artwork() -> Image.Image:
    page = PdfReader(PDF).pages[0]
    images = sorted(page.images, key=lambda image: len(image.data), reverse=True)
    if not images:
        raise RuntimeError("No embedded artwork found in the flyer PDF")
    artwork = images[0].image.convert("RGB")
    if artwork.size != (1805, 2533):
        raise RuntimeError(f"Unexpected flyer artwork size: {artwork.size}")
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
    artwork = source_artwork()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    previews = []
    for dish_id, bounds in CROPS.items():
        crop = artwork.crop(bounds).filter(
            ImageFilter.UnsharpMask(radius=0.65, percent=135, threshold=2)
        )
        crop.save(OUTPUT / f"{dish_id}.webp", "WEBP", lossless=True, method=6)
        previews.append((dish_id, crop))
    contact_sheet(previews)
    print(f"Extracted {len(previews)} dish photographs to {OUTPUT}")
    print(f"Contact sheet: {PREVIEW}")


if __name__ == "__main__":
    main()
