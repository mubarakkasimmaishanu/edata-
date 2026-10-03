import os
from PIL import Image

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IOS_ASSETS_DIR = os.path.join(PROJECT_ROOT, "ios", "App", "App", "Assets.xcassets")
APP_ICON_DIR = os.path.join(IOS_ASSETS_DIR, "AppIcon.appiconset")
SPLASH_DIR = os.path.join(IOS_ASSETS_DIR, "Splash.imageset")

EDATA_LOGO_PATH = os.path.join(PROJECT_ROOT, "assets", "icons", "eData.png")
SPLASH_ICON_PATH = os.path.join(PROJECT_ROOT, "assets", "icons", "splash-icon.png")
if not os.path.exists(SPLASH_ICON_PATH):
    SPLASH_ICON_PATH = os.path.join(PROJECT_ROOT, "assets", "icon_loader.png")

# Official eData Brand Slate Blue Dark Theme
BRAND_BG_RGB = (15, 23, 42) # #0f172a (RGB strictly without alpha for iOS App Store)
BRAND_BG_RGBA = (15, 23, 42, 255)

def generate_ios_icon():
    os.makedirs(APP_ICON_DIR, exist_ok=True)
    # Apple App Store icon: 1024x1024, RGB (no alpha)
    size = 1024
    icon_canvas = Image.new("RGB", (size, size), BRAND_BG_RGB)
    
    logo = Image.open(EDATA_LOGO_PATH).convert("RGBA")
    
    # Safe area: logo occupies 65% of canvas
    target_dim = int(size * 0.65)
    w, h = logo.size
    ratio = min(target_dim / w, target_dim / h)
    nw, nh = int(w * ratio), int(h * ratio)
    
    resized_logo = logo.resize((nw, nh), Image.Resampling.LANCZOS)
    pos_x = (size - nw) // 2
    pos_y = (size - nh) // 2
    
    # Paste using alpha mask
    icon_canvas.paste(resized_logo, (pos_x, pos_y), resized_logo)
    
    output_path = os.path.join(APP_ICON_DIR, "AppIcon-512@2x.png")
    icon_canvas.save(output_path, "PNG")
    print(f"Generated iOS App Store icon (1024x1024, RGB) at: {output_path}")

def generate_ios_splash():
    os.makedirs(SPLASH_DIR, exist_ok=True)
    size = 2732
    splash_canvas = Image.new("RGBA", (size, size), BRAND_BG_RGBA)
    
    src_path = SPLASH_ICON_PATH if os.path.exists(SPLASH_ICON_PATH) else EDATA_LOGO_PATH
    logo = Image.open(src_path).convert("RGBA")
    
    target_dim = int(size * 0.35)
    w, h = logo.size
    ratio = min(target_dim / w, target_dim / h)
    nw, nh = int(w * ratio), int(h * ratio)
    
    resized_logo = logo.resize((nw, nh), Image.Resampling.LANCZOS)
    pos_x = (size - nw) // 2
    pos_y = (size - nh) // 2
    
    splash_canvas.paste(resized_logo, (pos_x, pos_y), resized_logo)
    
    for filename in ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]:
        p = os.path.join(SPLASH_DIR, filename)
        splash_canvas.save(p, "PNG")
        print(f"Generated iOS Launch Splash at: {p}")

if __name__ == "__main__":
    print("Generating native iOS branding assets...")
    generate_ios_icon()
    generate_ios_splash()
    print("iOS branding assets generated successfully!")
