# Favicon Assets

This directory contains all favicon and icon assets for Chrome AI DevBench.

## Files

- **favicon.svg** - Main SVG favicon (scalable, modern browsers)
- **site.webmanifest** - PWA manifest for installable web app

## Generate PNG Favicons

You need to generate PNG versions from the SVG. Choose one of these methods:

### Method 1: Using ImageMagick (Recommended)

```bash
# Install ImageMagick if needed
# Ubuntu/Debian: sudo apt install imagemagick
# macOS: brew install imagemagick

cd public

# Generate 16x16 favicon
convert -background none -resize 16x16 favicon.svg favicon-16x16.png

# Generate 32x32 favicon
convert -background none -resize 32x32 favicon.svg favicon-32x32.png

# Generate 180x180 Apple touch icon with white background
convert -background white -resize 180x180 -gravity center -extent 180x180 favicon.svg apple-touch-icon.png

# Generate 1200x630 OG image
convert -size 1200x630 xc:'#f0f4ff' \
  \( favicon.svg -resize 400x400 \) -gravity center -composite \
  og-image.png
```

### Method 2: Using Inkscape

```bash
cd public

# 16x16
inkscape -w 16 -h 16 favicon.svg -o favicon-16x16.png

# 32x32
inkscape -w 32 -h 32 favicon.svg -o favicon-32x32.png

# 180x180 Apple touch icon
inkscape -w 180 -h 180 favicon.svg -o apple-touch-icon.png
```

### Method 3: Online Tools

1. Go to [RealFaviconGenerator](https://realfavicongenerator.net/)
2. Upload `favicon.svg`
3. Download the generated package
4. Copy PNG files to this directory

### Method 4: Using Node.js (sharp)

```bash
npm install sharp-cli -g

# Generate all sizes
sharp -i favicon.svg -o favicon-16x16.png resize 16 16
sharp -i favicon.svg -o favicon-32x32.png resize 32 32
sharp -i favicon.svg -o apple-touch-icon.png resize 180 180
```

## Required PNG Files

- ✅ `favicon.svg` (already created)
- ⏳ `favicon-16x16.png` (generate using above methods)
- ⏳ `favicon-32x32.png` (generate using above methods)
- ⏳ `apple-touch-icon.png` (generate using above methods)
- ⏳ `og-image.png` (optional, for social media)

## Design Specs

The favicon uses Google Chrome's signature colors:

- **Blue** (#4285F4) - Outer ring
- **Red** (#EA4335) - Second circle
- **Yellow** (#FBBC04) - Third circle
- **Green** (#34A853) - Center dot

Optimized for clarity at small sizes (16x16 minimum).
