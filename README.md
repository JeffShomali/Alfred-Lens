# Alfred Snippets Overflow

A lightweight macOS tray application that provides quick access to Alfred snippets through an elegant overlay interface.

## Features

- 🚀 **Quick Access**: Global hotkey (Cmd+Shift+S) to instantly show snippets
- 🔍 **Smart Search**: Fuzzy search across all snippets, keywords, and content
- 📁 **Category Organization**: Auto-organized by Alfred snippet collections
- ⌨️ **Keyboard Navigation**: Full keyboard control with shortcuts
- 🌓 **Dark Mode**: Automatic dark/light mode based on system preferences
- 📋 **Instant Copy**: One-click or keyboard shortcut to copy snippets
- ⭐ **Favorites**: Mark frequently used snippets as favorites
- 🕐 **Recent Snippets**: Quick access to recently used snippets
- 🔄 **Live Sync**: Automatically syncs with Alfred snippet changes
- 💨 **Lightweight**: Minimal resource usage, runs in system tray

## Installation

### Prerequisites

- macOS 10.14 or later
- Node.js 16 or later
- Alfred 4 or 5 with Powerpack (for snippets)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/alfred-snippets-overflow.git
cd alfred-snippets-overflow
```

2. Install dependencies:
```bash
npm install
```

3. Run the application:
```bash
npm start
```

### Development Mode

For development with hot-reload:
```bash
npm run dev
```

## Usage

### Opening the Snippets Window

- **Primary**: Press `Cmd+Shift+S`
- **Alternative**: Click the tray icon
- **Alternative**: Press `Cmd+Option+S` or `Cmd+Control+S`

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+Shift+S` | Show/hide snippets window |
| `Escape` | Close window |
| `Enter` | Copy snippet and close |
| `Cmd+C` | Copy snippet without closing |
| `Cmd+F` | Focus search field |
| `↑/↓` | Navigate snippets |
| `Tab` | Switch focus between sidebar and content |
| `1-9` | Quick select snippets 1-9 |

### Search

- Start typing to search across all snippets
- Search matches against:
  - Snippet names
  - Keywords
  - Content
  - Categories

### Categories

- **All Snippets**: View all available snippets
- **Categories**: Organized by Alfred collections
- **⭐ Favorites**: Your starred snippets
- **🕐 Recent**: Recently used snippets

## Building for Distribution

### Build for macOS

```bash
npm run build
```

This will create:
- `.dmg` installer in `dist/` directory
- `.app` bundle ready for distribution

### Code Signing (Optional)

For distribution outside the Mac App Store, you'll need to code sign the app:

1. Get a Developer ID certificate from Apple
2. Update `package.json` with your certificate details
3. Build with signing:
```bash
npm run dist
```

## Configuration

The app stores preferences in:
```
~/Library/Application Support/alfred-snippets-overflow/
```

### Preferences

- **Theme**: Auto/Light/Dark
- **Shortcut**: Customizable global hotkey
- **Launch at Startup**: Auto-start with system

## Alfred Snippets Location

The app automatically reads snippets from:
```
~/Library/Application Support/Alfred/Alfred.alfredpreferences/snippets/
```

## Troubleshooting

### Snippets not showing

1. Ensure Alfred is installed and you have the Powerpack license
2. Check that you have snippets created in Alfred
3. Verify the snippets directory exists at the expected location

### Global shortcut not working

1. Grant accessibility permissions:
   - System Preferences → Security & Privacy → Privacy → Accessibility
   - Add Alfred Snippets Overflow
2. Try alternative shortcuts if the default conflicts with other apps

### App won't start

1. Check if another instance is already running (look for tray icon)
2. Clear app data:
```bash
rm -rf ~/Library/Application Support/alfred-snippets-overflow/
```

## Development

### Project Structure

```
alfred-snippets-overflow/
├── main.js              # Electron main process
├── preload.js           # Preload script for IPC
├── renderer/
│   ├── index.html       # Main UI
│   └── app.js          # Renderer application logic
├── lib/
│   ├── snippets.js     # Snippet management
│   └── shortcuts.js    # Keyboard shortcut handling
└── assets/
    └── icons/          # App icons
```

### Technologies

- **Electron**: Cross-platform desktop framework
- **Node.js**: JavaScript runtime
- **Chokidar**: File system watcher
- **Electron Store**: Persistent storage

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Alfred App team for the amazing snippet system
- Electron community for the framework
- All contributors and users

## Support

For issues, questions, or suggestions, please open an issue on GitHub.