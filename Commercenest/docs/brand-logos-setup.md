# Brand Logos Setup Guide

## Overview
This guide helps you set up original brand logos for the Shop by Brands carousel section.

## Required Logo Files
You need to download the following original brand logos and place them in `Commercenest/web/public/images/brands/`:

### Required Files:
1. `nike-logo.png` - Nike swoosh logo
2. `adidas-logo.png` - Adidas three stripes logo  
3. `puma-logo.png` - Puma leaping cat logo
4. `reebok-logo.png` - Reebok vector logo
5. `under-armour-logo.png` - Under Armour UA logo
6. `new-balance-logo.png` - New Balance NB logo
7. `converse-logo.png` - Converse star logo
8. `vans-logo.png` - Vans checkerboard logo

## Logo Requirements:
- **Format**: PNG with transparent background
- **Size**: Recommended 200x200px or larger
- **Quality**: High resolution, clear and crisp
- **Background**: Transparent (no white/colored backgrounds)

## Where to Get Original Logos:

### Option 1: Official Brand Websites
- Nike: https://about.nike.com/en/newsroom/collections/nike-inc-logos
- Adidas: https://www.adidas-group.com/en/our-group/brands/adidas/
- Puma: https://about.puma.com/en/company/brand
- Reebok: https://www.reebok.com/us/help-articles/About_Reebok
- Under Armour: https://about.underarmour.com/
- New Balance: https://www.newbalance.com/about-us/
- Converse: https://www.converse.com/about-us
- Vans: https://www.vans.com/about-us.html

### Option 2: Logo Download Sites
- **CleanPNG**: https://www.cleanpng.com/
- **PNG Tree**: https://pngtree.com/
- **Freepik**: https://www.freepik.com/
- **Flaticon**: https://www.flaticon.com/

### Option 3: Search Engines
Search for: "[Brand Name] logo PNG transparent background"

## Installation Steps:

1. **Download Logos**: Get the original logo files from the sources above
2. **Rename Files**: Ensure they match the exact filenames listed above
3. **Place in Directory**: Copy all logo files to `Commercenest/web/public/images/brands/`
4. **Verify**: Check that all files are in the correct location
5. **Test**: Run the development server and check the brand carousel

## File Structure:
```
Commercenest/web/public/images/brands/
├── nike-logo.png
├── adidas-logo.png
├── puma-logo.png
├── reebok-logo.png
├── under-armour-logo.png
├── new-balance-logo.png
├── converse-logo.png
└── vans-logo.png
```

## Troubleshooting:

### If logos don't load:
1. Check file names match exactly (case-sensitive)
2. Verify files are in the correct directory
3. Check browser console for errors
4. Ensure files are valid PNG images
5. Check file permissions

### Fallback Behavior:
If a logo fails to load, the system will display the brand name in a gray box as a fallback.

## Legal Considerations:
- Ensure you have permission to use brand logos
- Consider using logos only for educational/demo purposes
- For commercial use, contact brands for official logo usage rights
- Some brands provide official logo downloads for partners

## Testing:
After installing logos, test the carousel by:
1. Starting the development server: `npm run dev`
2. Navigate to the homepage
3. Scroll to the "Shop by Brands" section
4. Verify all logos display correctly
5. Test the automatic carousel functionality
6. Check responsive behavior on different screen sizes
