from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    # Create image with blue background
    img = Image.new('RGB', (size, size), color='#3b82f6')
    draw = ImageDraw.Draw(img)
    
    # Try to use a font, fallback to default if not available
    try:
        font_size = int(size * 0.6)
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        try:
            font_size = int(size * 0.6)
            font = ImageFont.load_default()
        except:
            font = None
    
    # Draw the letter "S"
    text = "S"
    if font:
        # Get text bounding box
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        # Center the text
        x = (size - text_width) // 2
        y = (size - text_height) // 2
        
        draw.text((x, y), text, fill='white', font=font)
    else:
        # Fallback: draw a simple rectangle
        margin = size // 4
        draw.rectangle([margin, margin, size-margin, size-margin], fill='white')
    
    # Save the image
    img.save(f'public/{filename}')
    print(f"Created {filename} ({size}x{size})")

# Create the icons
if __name__ == "__main__":
    os.makedirs('public', exist_ok=True)
    create_icon(192, 'icon-192x192.png')
    create_icon(512, 'icon-512x512.png')
    print("Icons created successfully!")