# Star Citizen Hangar Viewer

A browser extension to extract and view your Star Citizen hangar items with melt values, insurance info, and Concierge level.

## Installation

1. Download and extract `sc-hangar-extension-v2.zip`
2. Open your browser's extensions page:
   - **Chrome/Edge/Brave**: `chrome://extensions/`
   - **Opera**: `opera://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the extracted `sc-hangar-extension-v2` folder

## How to Use

1. Go to https://robertsspaceindustries.com/account/pledges (log in first)
2. Wait for the page to fully load
3. Click the **Star Citizen Hangar Viewer** extension icon in your toolbar
4. Click **Extract Hangar Data** button
5. Wait 3-10 seconds while it expands items and loads data
6. Click **View My Hangar** to see your complete hangar

## Features

- **All Items Listed**: Shows all ships, vehicles, paints, and gear with melt values
- **Upgraded Ships**: Displays current ship with upgrade history
- **Insurance Info**: Converts to years (120 Month → 10 Years) and shows LTI
- **Concierge Level**: Automatically detects and displays your Chairman's Club rank
- **Search & Sort**: Filter by name and sort by value/date/name
- **Clean Names**: Removes prefixes and suffixes for easier reading
- **Custom Backgrounds**: Add your own ship images (see below)

## Custom Ship Backgrounds

You can add custom background images for your ships!

1. Go to the extension folder: `sc-hangar-extension-v2/ship-backgrounds/`
2. Add ship images named to match your ships:
   - `perseus.jpg` for Perseus
   - `l-21-wolf.jpg` for L-21 Wolf
   - `aegis-avenger-titan.png` for Aegis Avenger Titan
3. Reload the viewer to see your backgrounds

See `ship-backgrounds/README.md` for detailed naming instructions.

## What Gets Filtered Out

- Items with $0 melt value (except for Concierge detection)
- Gift cards
- Non-meltable items

## Notes

- Extension only works on the RSI hangar page
- Data is stored locally in your browser
- Click "Extract Hangar Data" again to refresh your hangar info

## Concierge Levels

The extension automatically detects your Concierge level:
- High Admiral
- Grand Admiral
- Space Marshal
- Wing Commander
- Praetorian
- Legatus Navium

---

**Not affiliated with Cloud Imperium Games or Roberts Space Industries**
