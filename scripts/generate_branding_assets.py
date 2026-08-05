import os
from PIL import Image, ImageDraw

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES_DIR = os.path.join(PROJECT_ROOT, "android", "app", "src", "main", "res")

# Input assets
EDATA_LOGO_PATH = os.path.join(PROJECT_ROOT, "assets", "icons", "eData.png")
FOREGROUND_PATH = os.path.join(PROJECT_ROOT, "assets", "icons", "android-icon-foreground.png")
SPLASH_ICON_PATH = os.path.join(PROJECT_ROOT, "assets", "icons", "splash-icon.png")

BRAND_BG_COLOR = (15, 23, 42, 255) # #0f172a dark theme slate blue

def create_round_icon(im):
    # im is RGBA Image
    size = im.size
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size[0], size[1]), fill=255)
    output = Image.new("RGBA", size, (0, 0, 0, 0))
    output.paste(im, (0, 0), mask)
    return output

def create_adaptive_foreground(src_img_path, size):
    # Adaptive foreground canvas is 108dp x 108dp.
    # The active/safe area is the center 66% (72dp x 72dp out of 108dp).
    fg_canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    if os.path.exists(src_img_path):
        src = Image.open(src_img_path).convert("RGBA")
    else:
        src = Image.open(EDATA_LOGO_PATH).convert("RGBA")
    
    # Target size for logo in center: 60% of total size
    target_logo_size = int(size * 0.60)
    
    # Maintain aspect ratio
    w, h = src.size
    ratio = min(target_logo_size / w, target_logo_size / h)
    new_w, new_h = int(w * ratio), int(h * ratio)
    
    resized_logo = src.resize((new_w, new_h), Image.Resampling.LANCZOS)
    offset_x = (size - new_w) // 2
    offset_y = (size - new_h) // 2
    
    fg_canvas.paste(resized_logo, (offset_x, offset_y), resized_logo)
    return fg_canvas

def generate_launcher_icons():
    logo = Image.open(EDATA_LOGO_PATH).convert("RGBA")
    
    densities = {
        "mipmap-mdpi": (48, 108),
        "mipmap-hdpi": (72, 162),
        "mipmap-xhdpi": (96, 216),
        "mipmap-xxhdpi": (144, 324),
        "mipmap-xxxhdpi": (192, 432),
    }

    for folder, (legacy_size, adaptive_size) in densities.items():
        folder_path = os.path.join(RES_DIR, folder)
        os.makedirs(folder_path, exist_ok=True)
        
        # 1. ic_launcher.png (Legacy Square)
        legacy_im = logo.resize((legacy_size, legacy_size), Image.Resampling.LANCZOS)
        legacy_im.save(os.path.join(folder_path, "ic_launcher.png"))
        
        # 2. ic_launcher_round.png (Legacy Round)
        round_im = create_round_icon(legacy_im)
        round_im.save(os.path.join(folder_path, "ic_launcher_round.png"))
        
        # 3. ic_launcher_foreground.png (Adaptive Foreground)
        fg_im = create_adaptive_foreground(FOREGROUND_PATH if os.path.exists(FOREGROUND_PATH) else EDATA_LOGO_PATH, adaptive_size)
        fg_im.save(os.path.join(folder_path, "ic_launcher_foreground.png"))
        
        print(f"Generated launcher icons for {folder}")

def create_splash_screen(w, h):
    # Create canvas filled with dark brand color #0f172a
    splash = Image.new("RGBA", (w, h), BRAND_BG_COLOR)
    
    src_path = SPLASH_ICON_PATH if os.path.exists(SPLASH_ICON_PATH) else EDATA_LOGO_PATH
    logo = Image.open(src_path).convert("RGBA")
    
    # Logo size should be ~35% of min dimension
    target_dim = int(min(w, h) * 0.40)
    lw, lh = logo.size
    ratio = min(target_dim / lw, target_dim / lh)
    nw, nh = int(lw * ratio), int(lh * ratio)
    
    resized_logo = logo.resize((nw, nh), Image.Resampling.LANCZOS)
    pos_x = (w - nw) // 2
    pos_y = (h - nh) // 2
    
    splash.paste(resized_logo, (pos_x, pos_y), resized_logo)
    return splash

def generate_splash_screens():
    # Primary drawable splash
    drawable_dir = os.path.join(RES_DIR, "drawable")
    os.makedirs(drawable_dir, exist_ok=True)
    main_splash = create_splash_screen(2732, 2732)
    main_splash.save(os.path.join(drawable_dir, "splash.png"))
    print("Generated main splash.png in drawable")
    
    land_densities = {
        "drawable-land-mdpi": (480, 320),
        "drawable-land-hdpi": (800, 480),
        "drawable-land-xhdpi": (1280, 720),
        "drawable-land-xxhdpi": (1600, 960),
        "drawable-land-xxxhdpi": (1920, 1280),
    }
    
    port_densities = {
        "drawable-port-mdpi": (320, 480),
        "drawable-port-hdpi": (480, 800),
        "drawable-port-xhdpi": (720, 1280),
        "drawable-port-xxhdpi": (960, 1600),
        "drawable-port-xxxhdpi": (1280, 1920),
    }
    
    for folder, (w, h) in land_densities.items():
        folder_path = os.path.join(RES_DIR, folder)
        os.makedirs(folder_path, exist_ok=True)
        spl = create_splash_screen(w, h)
        spl.save(os.path.join(folder_path, "splash.png"))
        print(f"Generated landscape splash for {folder}")
        
    for folder, (w, h) in port_densities.items():
        folder_path = os.path.join(RES_DIR, folder)
        os.makedirs(folder_path, exist_ok=True)
        spl = create_splash_screen(w, h)
        spl.save(os.path.join(folder_path, "splash.png"))
        print(f"Generated portrait splash for {folder}")

if __name__ == "__main__":
    print("Starting eData branding asset generation...")
    generate_launcher_icons()
    generate_splash_screens()
    print("All branding assets generated successfully!")
