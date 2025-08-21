# Alfred Lens

A professional macOS application for viewing and managing Alfred snippets with an intuitive, native interface and powerful search capabilities.

![macOS](https://img.shields.io/badge/Platform-macOS-blue.svg)
![Electron](https://img.shields.io/badge/Built%20with-Electron-47848F.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)
![Version](https://img.shields.io/badge/Version-1.0.0-brightgreen.svg)

## Download & Installation

### Quick Install (Recommended)

1. **Download the latest release:**
   - Go to the [Releases](https://github.com/JeffShomali/alfred-lens/releases/latest) page
   - Download `Alfred.Lens-1.0.0.dmg` (or latest version)
   
2. **Install the application:**
   - Open the downloaded DMG file
   - Drag Alfred Lens to your Applications folder
   - Eject the DMG
   
3. **First launch:**
   - Open Alfred Lens from Applications
   - macOS may ask for permission to access folders - click Allow
   - The app will automatically find your Alfred snippets

### System Requirements

- **macOS 10.15 Catalina** or later
- **Alfred 4** or **Alfred 5** with snippets configured
- 100 MB free disk space

## Features

### Core Functionality
- **Smart Search**: Instantly find snippets by name, keyword, or content
- **Folder Organization**: Browse snippets organized by collections
- **Accordion View**: Clean, expandable interface for easy browsing
- **Quick Copy**: One-click copy to clipboard with visual feedback
- **Keyboard Shortcuts**: Full keyboard control for power users

### User Experience
- **Native macOS Design**: Follows Apple Human Interface Guidelines
- **Dark Mode Support**: Automatic theme switching based on system preferences
- **Customizable Settings**: Adjust window size, shortcuts, and behavior
- **Menu Bar Integration**: Quick access from your menu bar
- **Recent History**: Access your frequently used snippets

### Privacy & Security
- **100% Offline**: No internet connection required
- **No Data Collection**: Your snippets never leave your Mac
- **Read-Only Access**: Never modifies your Alfred configuration
- **Open Source**: Full transparency with publicly auditable code

## Usage Guide

### Basic Usage

1. **Launch Alfred Lens** from Applications or use the global shortcut
2. **Browse** snippets using the folder sidebar
3. **Search** for specific snippets using the search bar
4. **Copy** snippets by clicking them and selecting "Copy to Clipboard"

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘⇧S` | Show/Hide Alfred Lens |
| `⌘C` | Copy selected snippet |
| `⌘F` | Focus search bar |
| `⌘,` | Open Settings |
| `ESC` | Close window |
| `↑/↓` | Navigate snippets |
| `Enter` | Copy & close |

### Settings

Access Settings via `⌘,` or the gear icon to customize:
- Global shortcut key combination
- Window size and position
- Theme (Light/Dark/Auto)
- Hold duration for activation
- Startup behavior

## Building from Source

### Prerequisites

- Node.js 16 or later
- npm or yarn package manager
- Xcode Command Line Tools

### Build Instructions

```bash
# Clone the repository
git clone https://github.com/JeffShomali/alfred-lens.git
cd alfred-lens

# Install dependencies
npm install

# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Create distributable DMG
npm run dist
```

### Project Structure

```
alfred-lens/
├── src/
│   ├── main/           # Main process (Electron)
│   ├── renderer/       # Renderer process
│   └── config/         # App configuration
├── renderer/           # UI components
│   ├── index.html      # Main window
│   ├── settings.html   # Settings window
│   └── app.js          # Frontend logic
├── assets/            # Icons and images
└── package.json       # Dependencies
```

## Troubleshooting

### Alfred Lens can't find my snippets
1. Ensure Alfred is installed and has snippets configured
2. Check Alfred Preferences → Features → Snippets
3. Restart Alfred Lens

### App won't open on first launch
1. Right-click Alfred Lens in Applications
2. Select "Open" and confirm
3. This bypasses Gatekeeper on first launch

### Global shortcut not working
1. Check System Preferences → Security & Privacy → Accessibility
2. Ensure Alfred Lens has permission
3. Try setting a different shortcut in Settings

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to your branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## Release Notes

### Version 1.0.0 (Current)
- Initial public release
- Core snippet viewing functionality
- Folder organization with accordion view
- Search and filtering
- Keyboard shortcuts
- Settings customization
- Dark mode support

### Roadmap
- [ ] Export snippets to various formats
- [ ] Snippet editing capabilities
- [ ] Cloud sync support
- [ ] Multiple Alfred library support
- [ ] Advanced search with regex
- [ ] Snippet statistics and analytics

## Support

### Getting Help

- **Documentation**: Check this README and the [Wiki](https://github.com/JeffShomali/alfred-lens/wiki)
- **Issues**: Report bugs on the [Issues](https://github.com/JeffShomali/alfred-lens/issues) page
- **Discussions**: Join our [community discussions](https://github.com/JeffShomali/alfred-lens/discussions)

### Reporting Issues

When reporting issues, please include:
- macOS version
- Alfred version
- Steps to reproduce
- Expected vs actual behavior
- Any error messages

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for full details.

## Acknowledgments

- **Alfred App Team** - For creating an incredible productivity tool
- **Electron Community** - For the robust framework
- **Contributors** - Everyone who has helped improve this project
- **Users** - For your feedback and support

## Author

**Jeff Shomali**
- Developer and maintainer of Alfred Lens
- Passionate about productivity tools and macOS development

## Disclaimer

This is an independent project and is not affiliated with, endorsed by, or sponsored by Running with Crayons Ltd (makers of Alfred).

---

**Alfred Lens** - View your snippets through a better lens.

Made with dedication for the Alfred community.