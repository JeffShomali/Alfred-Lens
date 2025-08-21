# Release Instructions for Alfred Lens

## How to Create a Release for Public Download

### Automated Release (Recommended)

1. **Update version in package.json**:
   ```bash
   npm version patch  # for bug fixes (1.0.0 -> 1.0.1)
   npm version minor  # for new features (1.0.0 -> 1.1.0)
   npm version major  # for breaking changes (1.0.0 -> 2.0.0)
   ```

2. **Push the tag to GitHub**:
   ```bash
   git push origin main --tags
   ```

3. **GitHub Actions will automatically**:
   - Build the app for macOS
   - Create a DMG installer
   - Create a GitHub Release
   - Upload the DMG and ZIP files

### Manual Release

1. **Build locally**:
   ```bash
   npm run dist
   ```

2. **Find the built files**:
   - DMG file: `dist/Alfred Lens-*.dmg`
   - ZIP file: `dist/Alfred Lens-*.zip`

3. **Create GitHub Release**:
   - Go to your repo on GitHub
   - Click "Releases" → "Create a new release"
   - Choose a tag (e.g., v1.0.0)
   - Add release title and description
   - Upload the DMG and ZIP files
   - Publish release

## Security Checklist Before Release

- [ ] No API keys or tokens in code
- [ ] No personal information exposed
- [ ] No hardcoded paths specific to your machine
- [ ] All dependencies are production-ready
- [ ] Code has been tested on a clean macOS install

## Making the App Downloadable

Users can download the app by:
1. Going to your GitHub repository
2. Clicking on "Releases" section
3. Downloading the `.dmg` file
4. Installing like any macOS app

## Hiding Development Tools

The `.gitignore` has been configured to exclude development-specific folders using patterns that don't explicitly reveal tool names:
- `.*[Cc]ode*/` - Catches various code-related folders
- `.*tool*/` - Catches various tool folders

This way, the `.claude` folder (and similar) won't be committed without making it obvious what tools were used.