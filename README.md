<img width="1866" height="940" alt="Screenshot 2025-11-29 175118" src="https://github.com/user-attachments/assets/e9b30f06-8614-4d7d-ab47-884c7bcd413a" />

# Star Citizen Hangar Manager



A comprehensive Chrome extension for managing, tracking, and visualizing your Star Citizen fleet. Extract data from your RSI hangar, track loaners, manage wishlists, and more!

![Version](https://img.shields.io/badge/version-2.0.2-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### 🏠 Fleet Management
- **Complete Fleet Overview** - View all your ships and vehicles in one place
- **Loaner Ship Detection** - Automatically generates and displays loaner ships for concept ships you own
- **Custom In-Game Ships** - Add ships you bought in-game (with aUEC) to track your complete fleet
- **Smart Filtering** - Separate views for Ships, Ground Vehicles, Equipment, Add-ons, and Paints
- **Concierge Status** - Automatic detection of your Concierge level (High Admiral through Legatus Navium)

### 🚀 Ship Details
- **Comprehensive Data Extraction**:
  - Ship name and type
  - Insurance (LTI, X Years, X Months)
  - Melt value
  - Status (Flight Ready, In Concept, Upgraded)
  - Upgrade history (shows original ship if upgraded)
- **Ship Cards** - Clean, RSI-style cards with ship images
- **Detail Panel** - Click any ship to see full details in a sliding side panel
- **Status Badges**:
  - 🔴 Concept - Ships still in development
  - 🔄 Loaner - Temporary ships for concept ships you own
  - 🎮 In-Game - Ships you added from in-game purchases

### 🔄 Buyback Queue
- **Extract Buyback Items** - View your melted ships from the buyback queue
- **Store Credit Detection** - Shows which items can use store credit vs fresh money
- **Incremental Extraction** - Extract across multiple pages without duplicates

### ⭐ Wishlist
- **190+ Ship Database** - Browse all Star Citizen ships
- **Wishlist Management** - Add/remove ships to track your dream fleet
- **Price Tracking** - See total wishlist value
- **In-Hangar Detection** - Shows which wishlist ships you already own
- **Three Tabs**: All Ships, My Wishlist, My Hangar

### 📊 Analytics
- **Fleet Statistics**:
  - Breakdown by ship type
  - Status distribution (Flight Ready vs Concept)
  - Insurance coverage analysis
- **Fleet Value Analysis**:
  - Total fleet value
  - Average ship value
  - Top 10 most valuable ships
- **Visual Stats Cards** - Quick overview of your collection

### ⚙️ Settings & Data Management
- **Clear All Data** - Fresh start option
- **Export to CSV** - Export your hangar data for spreadsheets
- **Multi-Page Extraction** - Extract from all hangar pages with duplicate prevention
- **Auto-Update Checker** - Notifies when new versions are available on GitHub

## 🎨 Design Features

- **RSI-Style Interface** - Clean cards inspired by the official RSI launcher
- **Sidebar Navigation** - Easy access to all features
- **Custom Ship Backgrounds** - Add your own ship images
- **Dark Theme** - Easy on the eyes
- **Responsive Layout** - Works on different screen sizes
- **Smooth Animations** - Professional transitions and effects

## 📦 Installation

1. Download the latest release from [GitHub Releases](https://github.com/Copeman-1/StarCitizen-Hangar-Viewer/releases)
2. Extract the ZIP file
3. Open Chrome and go to `chrome://extensions`
4. Enable "Developer mode" (toggle in top-right)
5. Click "Load unpacked"
6. Select the extracted folder
7. Done! The extension icon will appear in your toolbar

## 🚀 Usage

### Initial Setup
1. Go to [robertsspaceindustries.com/account/pledges](https://robertsspaceindustries.com/account/pledges)
2. Click the extension icon
3. Click "Extract Hangar Data"
4. Wait for extraction to complete
5. If you have multiple pages, go to the next page and extract again
6. Click "View My Hangar" to see your fleet

### Extracting Buyback Queue
1. Go to [robertsspaceindustries.com/account/buy-back-pledges](https://robertsspaceindustries.com/account/buy-back-pledges)
2. Click the extension icon
3. Click "Extract Hangar Data"
4. Extract from multiple pages if needed
5. View in the "Buyback Queue" section

### Adding In-Game Ships
1. Open the app and go to "Fleet"
2. Click "+ Add In-Game Ship"
3. Enter ship name and select type
4. Ship appears with 🎮 In-Game badge

### Using the Wishlist
1. Click "⭐ Wishlist" in the sidebar
2. Browse ships or search
3. Click "+ Add to Wishlist" on any ship
4. View total wishlist value at the top

## 📁 Custom Ship Backgrounds

Add custom images for your ships:

1. Navigate to the `ship-backgrounds/` folder in the extension directory
2. Add images with ship names (lowercase, dashes instead of spaces)
   - Example: `aegis-avenger-titan.jpg`
   - Example: `rsi-aurora-mr.png`
   - Example: `anvil-carrack.jpg`
3. Reload the extension
4. Your custom backgrounds will appear on ship cards

**Supported formats**: JPG, PNG

**Naming Examples**:
- "Aegis Avenger Titan" → `aegis-avenger-titan.jpg`
- "RSI Aurora MR" → `rsi-aurora-mr.png`
- "Anvil C8X Pisces Expedition" → `anvil-c8x-pisces-expedition.jpg`

## 🔧 Technical Details

### Data Storage
- Uses `chrome.storage.local` for persistence
- Separate storage for hangar, buyback, and wishlist
- Data persists between sessions
- Clear data option available in Settings

### Extraction Method
- Extracts from RSI website DOM
- Parses pledge data, insurance, upgrades
- Handles pagination automatically
- Duplicate prevention for multi-page extraction

### Loaner System
- Based on official RSI Loaner Ship Matrix (updated November 2025)
- Automatically generates loaners for concept ships
- 70+ ship mappings
- Shows which ship each loaner is for

### Update System
- Checks GitHub releases on app load
- Compares current version with latest
- Shows notification with download link
- Manual update required (no auto-download)

## 🐛 Known Issues

- Loaners are virtual (generated based on owned ships, not extracted from hangar)
- Some edge cases with ship name matching may occur
- Insurance parsing requires expanding items on hangar page (automatic)

## 🛠️ Development

### Project Structure
```
sc-hangar-extension-v2/
├── manifest.json          # Extension configuration
├── popup.html/js          # Extension popup (extraction)
├── app.html/js            # Main application
├── viewer.html/js         # Legacy viewer
├── buyback.html/js        # Buyback page
├── wishlist.html/js       # Wishlist page
├── ships-database.js      # 190+ ships data
├── loaner-matrix.js       # Loaner ship mappings
└── ship-backgrounds/      # Custom ship images
```

### Key Files
- **popup.js** - Handles data extraction from RSI website
- **app.js** - Main application logic and rendering
- **loaner-matrix.js** - Maps concept ships to their loaners
- **ships-database.js** - Complete ship catalog with prices

## 📝 Changelog

### v2.0.2 (Current)
- ✨ Added loaner ship detection and display
- ✨ Added custom in-game ship feature
- 🎨 Improved fleet filtering (excludes equipment/addons/paints)
- 🔔 Added GitHub version checking
- 🐛 Fixed equipment categorization
- 🎨 Enhanced UI with better badges and borders
- 🐛 Multiple bug fixes and improvements

### v2.0.0
- 🎨 Complete UI redesign with sidebar navigation
- ✨ Added unified app interface
- 🎨 Improved ship card design (RSI-style)
- ✨ Added detail side panel
- 📊 Enhanced statistics and analytics
- 🔧 Better filtering and organization

### v1.x
- 🚀 Initial release
- ✨ Basic hangar extraction
- 👀 Simple viewer interface

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

### Areas for Contribution
- Ship database updates
- Loaner matrix updates
- UI improvements
- Bug fixes
- Feature suggestions

## 📄 License

This project is not affiliated with Cloud Imperium Games or Roberts Space Industries.

Star Citizen® and Roberts Space Industries® are registered trademarks of Cloud Imperium Rights LLC and Cloud Imperium Rights Ltd.

## 🔗 Links

- **GitHub Repository**: [Copeman-1/StarCitizen-Hangar-Viewer](https://github.com/Copeman-1/StarCitizen-Hangar-Viewer)
- **Issues**: [Report Bugs](https://github.com/Copeman-1/StarCitizen-Hangar-Viewer/issues)
- **Releases**: [Download Latest](https://github.com/Copeman-1/StarCitizen-Hangar-Viewer/releases)
- **RSI Website**: [robertsspaceindustries.com](https://robertsspaceindustries.com)

## 💬 Support

If you encounter any issues:
1. Check the [Known Issues](#-known-issues) section
2. Search existing [GitHub Issues](https://github.com/Copeman-1/StarCitizen-Hangar-Viewer/issues)
3. Create a new issue with:
   - Description of the problem
   - Steps to reproduce
   - Browser version
   - Extension version

## 🌟 Credits

**Created by**: Copeman-1

**Special Thanks**: Star Citizen community for testing and feedback

---

**See you in the 'verse, Citizen! o7** 🚀
