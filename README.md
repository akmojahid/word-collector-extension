# Wlist - Word Collector Extension

A beautiful Chrome extension for collecting and organizing Bangla, English, and multi-word phrases from any webpage. Designed with a vintage study aesthetic, Wlist helps you build your vocabulary collection one word at a time.

## ✨ Features

- 📖 **Dual Language Support** - Automatically detect and save English and Bangla words
- ✍️ **Phrase Collection** - Save multi-word phrases and sentences (up to 5 words)
- 📚 **Smart Chunking** - Words are automatically organized into chunks of 20 for efficient learning
- 🏷️ **Status Tracking** - Track chunk status as Running → Unread → Read
- 🎨 **Vintage Study Aesthetic** - Beautiful, distraction-free UI designed for focused learning
- ⚡ **Quick Save** - Use `Alt+S` keyboard shortcut or right-click context menu
- 💾 **Export Database** - Export your complete vocabulary as JSON anytime
- 📱 **Responsive Design** - Works seamlessly across all pages

## 🚀 Installation

### Option 1: Load from Source (Development)
1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the `vocab-extension` folder
6. The Wlist extension icon will appear in your Chrome toolbar!

### Option 2: Install from GitHub
```bash
git clone https://github.com/YOUR_USERNAME/word-collector-extension.git
cd word-collector-extension/vocab-extension
# Then follow Option 1 from step 2 onwards
```

## 📖 Quick Start Guide

### Saving Words

**Method 1: Keyboard Shortcut (Fastest)**
- Select any word or phrase on a webpage
- Press `Alt+S` (default)
- The word is automatically saved and categorized

**Method 2: Right-Click Context Menu**
- Right-click on any selected word or phrase
- Choose "Save to Vocab Vault"
- Word is instantly saved

**Supported Content Types:**
- Single words: "hello", "নমস্কার"
- Multi-word phrases: "Good morning", "কীভাবে আছো" (max 5 words)
- Auto-detection:
  - 🇬🇧 **English** for Latin-script words
  - 🇧🇩 **Bangla** for Bengali script  
  - ✍️ **Phrase** for selections with multiple words

### Managing Your Vocabulary

1. **Open Wlist** - Click the Wlist icon in your Chrome toolbar

2. **View Collections**
   - **English Tab** - English words and phrases
   - **বাংলা Tab** - Bangla words and phrases
   - **Phrase Tab** - Multi-word phrases
   - **Settings Tab** - Configuration and data management

3. **Expand a Chunk**
   - Click any chunk card to view all words
   - See words as a JavaScript array for easy copying

4. **Track Progress**
   - Chunks of 20 words automatically mark as **Unread** when full
   - Click "Mark Read" to track completed lessons
   - **Running** = less than 20 words
   - **Unread** = full but not reviewed
   - **Read** = completed and reviewed

5. **Copy Words**
   - Click "Copy Array" in any expanded chunk
   - Words are copied as JSON array: `["word1", "word2", ...]`
   - Paste into your notes, code, or apps

6. **Delete Words**
   - Hover over any word pill in an expanded chunk
   - Click the ✕ button to remove it
   - Confirm when prompted

7. **Delete Chunks**
   - Click "Delete Chunk" button at the bottom of a chunk
   - Removes all 20 words in that chunk at once

### Settings & Customization

**Change Keyboard Shortcut:**
1. In Wlist popup, go to Settings tab
2. Click "chrome://extensions/shortcuts"
3. Find "Wlist" and modify the shortcut (default: Alt+S)
4. Changes take effect immediately

**Export Your Data:**
- Click the export icon in the header
- Or go to Settings → "Export Full Database"
- Downloads as `vocab-vault-YYYY-MM-DD.json`
- Keep backups of your progress!

**Clear Data:**
- Per-category: Click "Clear All" in each tab
- Everything: Settings → "Clear All Words" (⚠️ irreversible)
- Shows timestamp of last update

## 📊 How Data is Organized

Words are stored in **chunks of 20** for optimal learning:

```json
{
  "meta": {
    "totalWords": 147,
    "lastUpdated": "2024-06-17T10:30:00Z",
    "version": "1.0"
  },
  "words": {
    "EN_words": {
      "1": ["hello", "world", "goodbye", ...20 total...],
      "2": ["apple", "banana", ...],
      "3": [...]
    },
    "BN_words": {
      "1": ["নমস্কার", "পৃথিবী", ...],
      "2": [...]
    },
    "PH_words": {
      "1": ["Good morning", "How are you", ...],
      "2": [...]
    }
  },
  "chunkMeta": {
    "EN_words": {
      "1": { 
        "status": "read",           // running | unread | read
        "completedAt": "2024-06-15T08:00:00Z",
        "updatedAt": "2024-06-15T08:00:00Z"
      },
      "2": { "status": "unread", ... }
    },
    "BN_words": { "1": {...} },
    "PH_words": { "1": {...} }
  }
}
```

**Chunk Statuses:**
- 🟠 **Running** - Active chunk, < 20 words
- 🔵 **Unread** - Full chunk (20 words), not yet reviewed
- ✅ **Read** - Completed and marked as reviewed

## 🛠️ Technical Details

### Architecture

**Service Worker (`background.js`)**
- Listens for word selections via keyboard shortcut (`Alt+S`)
- Handles context menu "Save to Vocab Vault" clicks
- Detects language (English/Bangla) and classifies phrases
- Manages Chrome storage and chunk organization
- Sends toast notifications to active tabs

**Popup UI (`popup.html` + `popup.css` + `popup.js`)**
- Displays collections in three tabs + settings
- Handles chunk expansion, copying, deletion
- Manages status transitions
- Shows statistics and last-updated timestamp
- Vintage aesthetic with Poppins font

**Content Script (`content.js`)**
- Injected into all webpages
- Displays toast notifications when words are saved
- Shows success/warning/error messages

### Key Functions

**Language Detection:**
```javascript
function detectLanguage(text) {
  const banglaPattern = /[\u0980-\u09FF]/;  // Bangla Unicode
  const englishPattern = /^[a-zA-Z\s'"\-\.,!?:;()]+$/;
  
  if (banglaPattern.test(text)) return "bn";
  if (englishPattern.test(text)) return "en";
  return null;
}
```

**Phrase Detection:**
```javascript
function isPhrase(text) {
  return text.trim().split(/\s+/).length > 1;  // Multi-word = phrase
}
```

### File Structure
```
vocab-extension/
├── manifest.json          # Chrome Extension MV3 config
├── background.js          # Service worker (word processing & storage)
├── popup.html             # Extension popup markup
├── popup.css              # Vintage styling
├── popup.js               # Popup interaction logic
├── content.js             # Toast notification injection
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

### Technologies Used
- **Chrome Extension MV3** - Latest extension standard
- **Vanilla JavaScript** - No frameworks or dependencies
- **Chrome Storage API** - Local data persistence
- **HTML5 + CSS3** - Vintage UI design
- **Google Fonts (Poppins)** - Modern typography

## 🐛 Troubleshooting

**Words not saving?**
- ✅ Verify content script injection: `chrome://extensions/` → Details → Content Scripts
- ✅ Reload extension: click refresh icon in `chrome://extensions/`
- ✅ Check browser console: DevTools (F12) → Application → Console for errors
- ✅ Try selecting text again and use the shortcut

**Toast notifications not showing?**
- ✅ Check if page allows scripts (some sites block)
- ✅ Try different website
- ✅ Make sure extension has permission on that domain

**Can't find Settings/Shortcuts page?**
- ✅ Copy-paste `chrome://extensions/shortcuts` directly into address bar
- ✅ Make sure you're signed into Chrome account

**Lost my words?**
- ✅ Open popup and check if data is still there
- ✅ Look for backup JSON file if you exported previously
- ✅ Check Chrome sync settings

## 🚀 Development

### Prerequisites
- Chrome browser (v88+)
- Text editor (VS Code, Sublime, etc.)
- Git (optional, for cloning)

### Local Development Workflow

1. **Clone repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/word-collector-extension.git
   cd word-collector-extension/vocab-extension
   ```

2. **Load unpacked** (see Installation above)

3. **Make edits** to any source file

4. **Reload extension**
   - Go to `chrome://extensions/`
   - Click the refresh icon on Wlist card
   - Changes take effect immediately

5. **Test changes** across websites

### Debugging Tips
- Use DevTools: Right-click extension icon → "Inspect popup"
- Service Worker logs: `chrome://extensions/` → Details → Service Worker → inspect
- Content script errors: DevTools → Console on any webpage

## 📋 Roadmap / Future Features

- [ ] Word difficulty/proficiency levels
- [ ] Spaced repetition algorithm
- [ ] Quiz/flashcard mode
- [ ] Cloud sync across devices
- [ ] Dark/Light theme toggle  
- [ ] Custom word categories
- [ ] Search & advanced filtering
- [ ] Pronunciation pronunciation guides
- [ ] Integration with learning apps
- [ ] Statistics dashboard

## 📄 License

MIT License - Feel free to use, modify, and distribute.

See LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! 

1. **Fork** the repository
2. Create a **feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to your branch (`git push origin feature/amazing-feature`)
5. Open a **Pull Request**

## 📞 Support & Feedback

- **Report Issues** - Open an issue on GitHub
- **Feature Requests** - Create an issue with "enhancement" label
- **Questions** - Check existing issues or create a discussion

---

**Happy Learning! Build your vocabulary one word at a time. 🎓**

Made with ❤️ for language learners everywhere.
