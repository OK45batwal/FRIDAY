import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

RES_DIR = Path(__file__).resolve().parent.parent / "apps" / "desktop" / "android" / "app" / "src" / "main" / "res"

DENSITIES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192
}

def draw_friday_icon(size: int, is_round: bool = False) -> Image.Image:
    # High-resolution supersampled canvas for anti-aliasing
    scale = 4
    canvas_size = size * scale
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    margin = int(canvas_size * 0.05)
    radius = canvas_size // 2 if is_round else int(canvas_size * 0.22)

    # 1. Dark Cyber Obsidian Background
    draw.rounded_rectangle(
        [margin, margin, canvas_size - margin, canvas_size - margin],
        radius=radius,
        fill=(13, 16, 26, 255),
        outline=(244, 63, 94, 255),
        width=int(scale * 2.5)
    )

    # 2. Glowing Rose & Cyan Cyber Accent Rings
    inner_margin = int(canvas_size * 0.12)
    draw.rounded_rectangle(
        [inner_margin, inner_margin, canvas_size - inner_margin, canvas_size - inner_margin],
        radius=int(radius * 0.8),
        outline=(56, 189, 248, 180),
        width=int(scale * 1.5)
    )

    # 3. Geometric Stylized "F" (FRIDAY)
    w = canvas_size
    f_points = [
        (int(w * 0.32), int(w * 0.26)),
        (int(w * 0.72), int(w * 0.26)),
        (int(w * 0.72), int(w * 0.38)),
        (int(w * 0.46), int(w * 0.38)),
        (int(w * 0.46), int(w * 0.48)),
        (int(w * 0.64), int(w * 0.48)),
        (int(w * 0.64), int(w * 0.58)),
        (int(w * 0.46), int(w * 0.58)),
        (int(w * 0.46), int(w * 0.76)),
        (int(w * 0.32), int(w * 0.76)),
    ]
    draw.polygon(f_points, fill=(244, 63, 94, 255))

    # 4. Glowing Quantum Core Node Dot (Electric Cyan)
    node_cx, node_cy = int(w * 0.68), int(w * 0.32)
    node_r = int(w * 0.045)
    draw.ellipse(
        [node_cx - node_r, node_cy - node_r, node_cx + node_r, node_cy + node_r],
        fill=(56, 189, 248, 255),
        outline=(255, 255, 255, 255),
        width=int(scale * 1)
    )

    # Downsample with Lanczos for razor-sharp rendering
    return img.resize((size, size), Image.Resampling.LANCZOS)

def generate_all():
    print("🚀 Generating High-Definition FRIDAY Android Launcher Icons...")
    for folder, size in DENSITIES.items():
        folder_path = RES_DIR / folder
        folder_path.mkdir(parents=True, exist_ok=True)

        # Standard icon
        icon = draw_friday_icon(size, is_round=False)
        icon.save(folder_path / "ic_launcher.png", format="PNG")

        # Round icon (for Android adaptive rounded displays)
        icon_round = draw_friday_icon(size, is_round=True)
        icon_round.save(folder_path / "ic_launcher_round.png", format="PNG")

        # Foreground asset
        fg = draw_friday_icon(size, is_round=False)
        fg.save(folder_path / "ic_launcher_foreground.png", format="PNG")

        print(f"✓ Generated {folder}/ic_launcher.png ({size}x{size})")

    # Update background color in values
    bg_xml = RES_DIR / "values" / "ic_launcher_background.xml"
    with open(bg_xml, "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#060913</color>\n</resources>\n')
    print("✓ Updated values/ic_launcher_background.xml -> #060913 (Cyber Dark)")

if __name__ == "__main__":
    generate_all()
