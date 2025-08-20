# Product Requirements Document
## Alfred Snippets Overflow - Tray Application

### Executive Summary
A lightweight macOS tray application that provides quick access to Alfred snippets through an elegant HTML interface, activated by holding the Command key for 5 seconds. The app runs as a background service and offers instant snippet preview, search, and clipboard functionality.

---

## 1. Product Overview

### 1.1 Vision Statement
Create a seamless, keyboard-driven snippet management overlay that enhances developer productivity by providing instant access to code snippets without interrupting workflow.

### 1.2 Target Users
- **Primary:** Software developers using Alfred snippets
- **Secondary:** Power users who frequently use text snippets
- **Tertiary:** Content creators needing quick access to templates

### 1.3 Core Value Proposition
- **Instant Access:** 5-second Command key activation
- **Zero Context Switch:** Overlay interface preserves current work context
- **Universal Clipboard:** Copy and paste anywhere
- **Beautiful UI:** Clean, modern interface with markdown rendering

---

## 2. Functional Requirements

### 2.1 System Tray Integration
- **Background Service:** Run continuously in system tray
- **Minimal Resource Usage:** < 50MB RAM idle, < 100MB active
- **Auto-start Option:** Launch at system startup
- **Tray Menu Options:**
  - Show Snippets (manual trigger)
  - Settings
  - About
  - Quit

### 2.2 Activation Mechanism
- **Primary Trigger:** Hold Command key for 5 seconds
- **Alternative Triggers:**
  - Global hotkey (customizable)
  - Tray icon click
- **Deactivation:**
  - ESC key
  - Click outside window
  - Copy action completion

### 2.3 Snippet Management

#### 2.3.1 Data Source
- **Location:** `/Users/{username}/Library/Application Support/Alfred/Alfred.alfredpreferences/snippets/`
- **Format:** JSON files with `.alfredsnippet` structure
- **Real-time Sync:** Watch for file changes

#### 2.3.2 Categories
- Auto-detect from folder structure
- Support nested categories
- Category icons/colors
- Collapsible category groups

#### 2.3.3 Snippet Display
- **Title:** From `name` field
- **Keyword:** From `keyword` field (highlighted)
- **Content:** Rendered with syntax highlighting
- **Preview:** First 3 lines in list view
- **Full View:** Complete snippet with markdown rendering

### 2.4 Search & Filter
- **Global Search:** Search across all snippets
- **Filter by:**
  - Category
  - Keyword
  - Content
  - Recently used
- **Fuzzy Matching:** Typo-tolerant search
- **Search History:** Remember last 10 searches

### 2.5 Actions
- **Copy to Clipboard:** Single click or Enter key
- **Expand Variables:** Replace placeholders like `{cursor}`, `{clipboard}`
- **Preview:** Hover for quick preview
- **Edit:** Open in Alfred (external)
- **Favorite:** Star frequently used snippets

### 2.6 Keyboard Navigation
- **Arrow Keys:** Navigate list
- **Tab:** Switch between sidebar and content
- **Enter:** Copy selected snippet
- **Cmd+C:** Copy without closing
- **Cmd+V:** Paste immediately (copy + close + paste)
- **Cmd+F:** Focus search
- **1-9:** Quick select first 9 snippets
- **ESC:** Close window

---

## 3. Non-Functional Requirements

### 3.1 Performance
- **Startup Time:** < 2 seconds
- **Activation Time:** < 200ms
- **Search Response:** < 50ms
- **Copy Action:** < 100ms

### 3.2 Usability
- **Accessibility:** VoiceOver support
- **Responsive:** Adapt to different screen sizes
- **Dark/Light Mode:** Follow system preference
- **Smooth Animations:** 60fps transitions

### 3.3 Reliability
- **Crash Recovery:** Auto-restart on crash
- **Data Integrity:** Never modify Alfred files
- **Error Handling:** Graceful degradation

---

## 4. User Interface Design

### 4.1 Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  [🔍 Search snippets...]                          [✕]   │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  CATEGORIES  │         SNIPPET PREVIEW                  │
│              │                                          │
│  📁 React    │  ╔════════════════════════════════════╗ │
│     • Hooks  │  ║ React Functional Component        ║ │
│     • Tests  │  ║ Keyword: ___rfc                   ║ │
│              │  ╟────────────────────────────────────╢ │
│  📁 Interview│  ║ import React from 'react'         ║ │
│     • Email  │  ║                                   ║ │
│     • CV     │  ║ export default function           ║ │
│              │  ║   Playground() {                  ║ │
│  📁 Linux    │  ║   return (                        ║ │
│     • System │  ║     <div>playground</div>         ║ │
│     • Files  │  ║   )                               ║ │
│              │  ║ }                                 ║ │
│  ⭐ Favorites│  ╚════════════════════════════════════╝ │
│              │                                          │
│  🕐 Recent   │  [Copy to Clipboard] [Insert at Cursor] │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘
```

### 4.2 Visual Design System

#### 4.2.1 Color Palette
**Light Mode:**
- Background: #FFFFFF
- Sidebar: #F5F5F7
- Text Primary: #1D1D1F
- Text Secondary: #86868B
- Accent: #007AFF
- Border: #D2D2D7
- Hover: #E8E8ED
- Selection: #007AFF15

**Dark Mode:**
- Background: #1C1C1E
- Sidebar: #2C2C2E
- Text Primary: #F5F5F7
- Text Secondary: #98989D
- Accent: #0A84FF
- Border: #38383A
- Hover: #3A3A3C
- Selection: #0A84FF25

#### 4.2.2 Typography
- **Font Family:** SF Pro Display (System)
- **Search Bar:** 16px, regular
- **Category Headers:** 13px, semibold
- **Snippet Title:** 15px, medium
- **Keyword Badge:** 12px, medium, monospace
- **Code Preview:** 13px, SF Mono
- **Body Text:** 14px, regular

#### 4.2.3 Spacing & Dimensions
- **Window Size:** 900x600px (default)
- **Min Size:** 600x400px
- **Sidebar Width:** 220px
- **Padding:** 16px
- **List Item Height:** 72px
- **Border Radius:** 8px (window), 6px (elements)

### 4.3 Component Specifications

#### 4.3.1 Sidebar
```
┌────────────────┐
│ 🔍 Search...   │  <- Search always visible
├────────────────┤
│ CATEGORIES     │  <- Section header
│                │
│ 📁 React (12)  │  <- Category with count
│   └ Hooks (6)  │  <- Subcategory indented
│   └ Tests (3)  │
│                │
│ ⭐ Favorites   │  <- Special sections
│ 🕐 Recent      │
└────────────────┘
```

#### 4.3.2 Snippet List Item
```
┌─────────────────────────────────────┐
│ React Functional Component      ⭐  │  <- Title + Favorite
│ ___rfc                   [React]    │  <- Keyword + Category badge
│ import React from 'react'...        │  <- Preview (truncated)
└─────────────────────────────────────┘
```

#### 4.3.3 Snippet Detail View
```
┌──────────────────────────────────────────┐
│ React Functional Component              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━         │
│                                          │
│ Keyword: ___rfc    Category: React      │
│                                          │
│ ┌──────────────────────────────────┐   │
│ │ import React from 'react'         │   │
│ │                                    │   │
│ │ export default function            │   │
│ │   Playground() {                   │   │
│ │   return (                         │   │
│ │     <div>playground</div>          │   │
│ │   )                                │   │
│ │ }                                  │   │
│ └──────────────────────────────────┘   │
│                                          │
│ [Copy] [Copy & Close] [Insert]          │
└──────────────────────────────────────────┘
```

### 4.4 Interaction States

#### 4.4.1 Hover States
- **List Item:** Light background highlight
- **Buttons:** Darker shade, cursor pointer
- **Category:** Expand indicator appears

#### 4.4.2 Active States
- **Selected Item:** Blue border, light blue background
- **Search Field:** Blue focus ring
- **Button Press:** Scale 0.98

#### 4.4.3 Loading States
- **Initial Load:** Skeleton screens
- **Search:** Inline spinner
- **Category Expand:** Smooth accordion

### 4.5 Animations
- **Window Appear:** Fade in + scale (200ms)
- **Window Dismiss:** Fade out + scale (150ms)
- **List Navigation:** Smooth scroll (150ms)
- **Category Expand:** Height transition (200ms)
- **Copy Success:** Green checkmark pulse (300ms)

---

## 5. Technical Architecture

### 5.1 Technology Stack
- **Framework:** Electron
- **Frontend:** HTML5, CSS3, JavaScript
- **UI Library:** React (optional) or Vanilla JS
- **Markdown Renderer:** Marked.js
- **Syntax Highlighting:** Prism.js
- **File Watching:** Chokidar
- **Global Shortcuts:** Electron global-shortcut

### 5.2 Application Structure
```
alfred-snippets-overflow/
├── main.js              # Electron main process
├── preload.js           # Bridge between main and renderer
├── renderer/
│   ├── index.html       # Main UI
│   ├── styles.css       # Styling
│   ├── app.js          # Application logic
│   └── components/     # UI components
├── lib/
│   ├── snippets.js     # Snippet management
│   ├── shortcuts.js    # Keyboard handling
│   └── storage.js      # Preferences storage
└── assets/
    └── icons/          # Tray and app icons
```

### 5.3 Data Flow
1. **Read Alfred Snippets** → Parse JSON → Store in memory
2. **Watch File Changes** → Update memory cache → Refresh UI
3. **User Search** → Filter cache → Update view
4. **Copy Action** → Process snippet → Clipboard → Close/Continue

---

## 6. MVP Features (Phase 1)

### Must Have
- [x] System tray application
- [x] 5-second Command key activation
- [x] Read Alfred snippets
- [x] Display categories and snippets
- [x] Search functionality
- [x] Copy to clipboard
- [x] Keyboard navigation
- [x] Dark/Light mode

### Nice to Have (Phase 2)
- [ ] Favorites system
- [ ] Recent snippets
- [ ] Variable expansion
- [ ] Custom themes
- [ ] Export/Import
- [ ] Statistics
- [ ] Cloud sync

### Future Considerations (Phase 3)
- [ ] Multi-snippet management
- [ ] Snippet creation/editing
- [ ] Team sharing
- [ ] VS Code extension
- [ ] Alfred workflow integration

---

## 7. Success Metrics

### 7.1 Usage Metrics
- Daily Active Users
- Snippets copied per day
- Average session duration
- Most used snippets
- Search queries per session

### 7.2 Performance Metrics
- App launch time
- Memory usage
- CPU usage
- Activation response time
- Search performance

### 7.3 User Satisfaction
- Copy success rate
- Error rate
- Feature adoption rate
- User feedback score

---

## 8. Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Alfred updates change file format | High | Version detection, graceful fallback |
| Performance with large snippet libraries | Medium | Pagination, virtual scrolling |
| Keyboard shortcut conflicts | Medium | Customizable shortcuts |
| Cross-platform compatibility | Low | Focus on macOS first |

---

## 9. Release Plan

### Phase 1: MVP (Week 1-2)
- Core functionality
- Basic UI
- System tray integration

### Phase 2: Enhancement (Week 3-4)
- Polished UI
- Advanced search
- Keyboard shortcuts

### Phase 3: Polish (Week 5)
- Performance optimization
- User testing
- Bug fixes

### Phase 4: Launch (Week 6)
- Documentation
- Distribution setup
- Initial release

---

## 10. Appendix

### A. Snippet JSON Structure
```json
{
  "alfredsnippet": {
    "snippet": "code content here",
    "uid": "unique-identifier",
    "name": "Display Name",
    "keyword": "trigger_keyword"
  }
}
```

### B. Keyboard Shortcut Map
- `Cmd (hold 5s)`: Activate
- `Esc`: Close
- `Enter`: Copy & Close
- `Cmd+C`: Copy
- `Cmd+F`: Search
- `↑↓`: Navigate
- `Tab`: Focus switch
- `1-9`: Quick select

### C. File System Paths
- Snippets: `~/Library/Application Support/Alfred/Alfred.alfredpreferences/snippets/`
- App Config: `~/Library/Application Support/AlfredSnippetsOverflow/`
- Logs: `~/Library/Logs/AlfredSnippetsOverflow/`