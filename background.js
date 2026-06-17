// background.js - Service Worker

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-to-vocab",
    title: "Save to Vocab Vault",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    id: "save-to-error",
    title: "Add to Error Log",
    contexts: ["selection"]
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const selectedText = info.selectionText?.trim();
  if (!selectedText) return;

  if (info.menuItemId === "save-to-vocab") {
    processWord(selectedText, tab.id, "vocab");
  }

  if (info.menuItemId === "save-to-error") {
    processWord(selectedText, tab.id, "error");
  }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command, tab) => {
  const isSave = command === "save-word" || command === "save-error";
  if (!isSave) return;

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => window.getSelection()?.toString().trim() || ""
  }).then(results => {
    const selectedText = results?.[0]?.result;
    if (!selectedText) return;
    if (command === "save-word") {
      processWord(selectedText, tab.id, "vocab");
    } else if (command === "save-error") {
      processWord(selectedText, tab.id, "error");
    }
  }).catch(err => console.error("Script injection failed:", err));
});

// Detect language: Bangla or English
function detectLanguage(text) {
  // Bangla unicode range: \u0980–\u09FF
  const banglaPattern = /[\u0980-\u09FF]/;
  const englishPattern = /^[a-zA-Z\s'"\-\.,!?:;()]+$/;

  if (banglaPattern.test(text)) return "bn";
  if (englishPattern.test(text)) return "en";
  return null; // mixed or unsupported
}

function isPhrase(text) {
  return text.trim().split(/\s+/).length > 1;
}

// Process and save the word
async function processWord(text, tabId, target = "vocab") {
  // Validate: max 10 words
  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount > 10) {
    sendNotification(tabId, "❌ Too many words! Select up to 10 words only.", "error");
    return;
  }

  const data = await loadData();
  ensureChunkMeta(data);

  let storageKey;
  let chunkLabel;
  let phrase = false;

  if (target === "error") {
    storageKey = "ERROR_words";
    chunkLabel = "Error Log";
  } else {
    const lang = detectLanguage(text);
    phrase = isPhrase(text);
    if (!lang) {
      sendNotification(tabId, "⚠️ Only Bangla or English words/phrases are supported.", "warn");
      return;
    }
    storageKey = phrase ? "PH_words" : lang === "en" ? "EN_words" : "BN_words";
    chunkLabel = phrase ? "Phrase Chunks" : lang === "en" ? "EN Chunks" : "BN Chunks";
  }

  if (!data.words[storageKey]) data.words[storageKey] = { 1: [] };
  if (!data.chunkMeta[storageKey]) data.chunkMeta[storageKey] = {};
  const wordList = data.words[storageKey];
  const metaList = data.chunkMeta[storageKey];

  // Check for duplicate in target list
  const allWords = Object.values(wordList).flat();
  if (allWords.map(w => w.toLowerCase()).includes(text.toLowerCase())) {
    sendNotification(tabId, `"${text}" is already in your list.`, "warn");
    return;
  }

  const chunkKeys = Object.keys(wordList).map(Number).sort((a, b) => a - b);
  let lastChunk = chunkKeys[chunkKeys.length - 1] || 1;
  if (!wordList[lastChunk]) {
    wordList[lastChunk] = [];
  }
  if (wordList[lastChunk].length >= 20) {
    lastChunk++;
    wordList[lastChunk] = [];
  }

  wordList[lastChunk].push(text);
  if (!metaList[lastChunk]) {
    metaList[lastChunk] = { status: "running", completedAt: null, updatedAt: null };
  }

  const now = new Date().toISOString();
  if (wordList[lastChunk].length >= 20) {
    metaList[lastChunk].status = metaList[lastChunk].status === "read" ? "read" : "unread";
    metaList[lastChunk].completedAt = metaList[lastChunk].completedAt || now;
  } else {
    metaList[lastChunk].status = "running";
  }
  metaList[lastChunk].updatedAt = now;

  data.words[storageKey] = wordList;
  data.chunkMeta[storageKey] = metaList;
  data.meta.totalWords = (data.meta.totalWords || 0) + 1;
  data.meta.lastUpdated = now;

  await saveData(data);
  sendNotification(tabId, `${text} added to ${chunkLabel} ${lastChunk}`, "success");
}

// Load data from storage
function ensureChunkMeta(data) {
  if (!data.words) {
    data.words = { EN_words: {}, BN_words: {}, PH_words: {}, ERROR_words: {} };
  }
  if (!data.words.EN_words) data.words.EN_words = {};
  if (!data.words.BN_words) data.words.BN_words = {};
  if (!data.words.PH_words) data.words.PH_words = {};
  if (!data.words.ERROR_words) data.words.ERROR_words = {};

  if (!data.chunkMeta) {
    data.chunkMeta = { EN_words: {}, BN_words: {}, PH_words: {}, ERROR_words: {} };
  }
  if (!data.chunkMeta.EN_words) data.chunkMeta.EN_words = {};
  if (!data.chunkMeta.BN_words) data.chunkMeta.BN_words = {};
  if (!data.chunkMeta.PH_words) data.chunkMeta.PH_words = {};
  if (!data.chunkMeta.ERROR_words) data.chunkMeta.ERROR_words = {};
}

function loadData() {
  return new Promise(resolve => {
    chrome.storage.local.get("vocabData", result => {
        if (result.vocabData) {
        const data = result.vocabData;
        ensureChunkMeta(data);
        resolve(data);
      } else {
        // Initialize fresh structure
        resolve({
          meta: { totalWords: 0, lastUpdated: null, version: "1.0" },
          words: {
            EN_words: { 1: [] },
            BN_words: { 1: [] },
            PH_words: { 1: [] },
            ERROR_words: { 1: [] }
          },
          chunkMeta: {
            EN_words: { 1: { status: "running", completedAt: null, updatedAt: null } },
            BN_words: { 1: { status: "running", completedAt: null, updatedAt: null } },
            PH_words: { 1: { status: "running", completedAt: null, updatedAt: null } },
            ERROR_words: { 1: { status: "running", completedAt: null, updatedAt: null } }
          }
        });
      }
    });
  });
}

// Save data to storage
function saveData(data) {
  return new Promise(resolve => {
    chrome.storage.local.set({ vocabData: data }, resolve);
  });
}

// Send notification to content script
function sendNotification(tabId, message, type) {
  if (!tabId) return;
  chrome.tabs.sendMessage(tabId, {
    action: "showToast",
    message,
    type
  }).catch(() => {}); // Ignore if content script not ready
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getData") {
    loadData().then(data => sendResponse({ data }));
    return true;
  }

  if (message.action === "deleteWord") {
    const { lang, chunk, index } = message;
    loadData().then(data => {
      ensureChunkMeta(data);
          const langKey = lang === "en" ? "EN_words" : lang === "bn" ? "BN_words" : lang === "ph" ? "PH_words" : "ERROR_words";
          const metaKey = data.chunkMeta[langKey];
          if (data.words[langKey][chunk]) {
            data.words[langKey][chunk].splice(index, 1);
            // Update chunk metadata for remaining chunk
            if (data.words[langKey][chunk].length === 0) {
              delete data.words[langKey][chunk];
              delete metaKey[chunk];
            } else {
              metaKey[chunk] = metaKey[chunk] || { status: "running", completedAt: null, updatedAt: null };
              metaKey[chunk].status = data.words[langKey][chunk].length < 20 ? "running" : metaKey[chunk].status;
              metaKey[chunk].updatedAt = new Date().toISOString();
            }
            const remainingChunks = Object.keys(data.words[langKey]).length;
            if (remainingChunks === 0) {
              data.words[langKey] = { 1: [] };
              metaKey[1] = { status: "running", completedAt: null, updatedAt: new Date().toISOString() };
            }
            data.meta.totalWords = Math.max(0, (data.meta.totalWords || 1) - 1);
            data.meta.lastUpdated = new Date().toISOString();
          }
          saveData(data).then(() => sendResponse({ success: true }));
        });
        return true;
      }

      if (message.action === "deleteChunk") {
        const { lang, chunk } = message;
        loadData().then(data => {
          ensureChunkMeta(data);
          const langKey = lang === "en" ? "EN_words" : lang === "bn" ? "BN_words" : lang === "ph" ? "PH_words" : "ERROR_words";
          const metaKey = data.chunkMeta[langKey];
          const removedCount = (data.words[langKey][chunk] || []).length;
          if (data.words[langKey][chunk]) {
            delete data.words[langKey][chunk];
          }
          if (metaKey[chunk]) {
            delete metaKey[chunk];
          }
          const remainingChunks = Object.keys(data.words[langKey]).length;
          if (remainingChunks === 0) {
            data.words[langKey] = { 1: [] };
            metaKey[1] = { status: "running", completedAt: null, updatedAt: new Date().toISOString() };
          }
          data.meta.totalWords = Math.max(0, (data.meta.totalWords || 0) - removedCount);
          data.meta.lastUpdated = new Date().toISOString();
          saveData(data).then(() => sendResponse({ success: true }));
        });
        return true;
      }

      if (message.action === "updateChunkStatus") {
        const { lang, chunk, status } = message;
        loadData().then(data => {
          ensureChunkMeta(data);
          const langKey = lang === "en" ? "EN_words" : lang === "bn" ? "BN_words" : lang === "ph" ? "PH_words" : "ERROR_words";
          const metaKey = data.chunkMeta[langKey];
          if (!metaKey[chunk]) {
            metaKey[chunk] = { status: "unread", completedAt: null, updatedAt: null };
          }
          metaKey[chunk].status = status;
          const now = new Date().toISOString();
          metaKey[chunk].updatedAt = now;
          if (status === "read" && !metaKey[chunk].completedAt) {
            metaKey[chunk].completedAt = now;
          }
          data.meta.lastUpdated = now;
          saveData(data).then(() => sendResponse({ success: true }));
        });
        return true;
      }

      if (message.action === "clearAll") {
        const freshData = {
          meta: { totalWords: 0, lastUpdated: new Date().toISOString(), version: "1.0" },
          words: {
            EN_words: { 1: [] },
            BN_words: { 1: [] },
            PH_words: { 1: [] },
            ERROR_words: { 1: [] }
          },
          chunkMeta: {
            EN_words: { 1: { status: "running", completedAt: null, updatedAt: new Date().toISOString() } },
            BN_words: { 1: { status: "running", completedAt: null, updatedAt: new Date().toISOString() } },
            PH_words: { 1: { status: "running", completedAt: null, updatedAt: new Date().toISOString() } },
            ERROR_words: { 1: { status: "running", completedAt: null, updatedAt: new Date().toISOString() } }
          }
        };
        saveData(freshData).then(() => sendResponse({ success: true }));
        return true;
      }
    });
