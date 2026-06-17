// popup.js

let vocabData = null;

// ── Init ──
document.addEventListener("DOMContentLoaded", () => {
  loadAndRender();
  setupTabs();
  setupButtons();
});

function loadAndRender() {
  chrome.runtime.sendMessage({ action: "getData" }, (response) => {
    vocabData = response.data;
    renderAll();
  });
}

function renderAll() {
  renderStats();
  renderChunks("en");
  renderChunks("bn");
  renderChunks("ph");
}

// ── Stats ──
function renderStats() {
  const enWords = getAllWords("en");
  const bnWords = getAllWords("bn");
  const phWords = getAllWords("ph");
  const total = enWords.length + bnWords.length + phWords.length;

  const enChunks = Object.keys(vocabData.words.EN_words).filter(k => vocabData.words.EN_words[k].length > 0);
  const bnChunks = Object.keys(vocabData.words.BN_words).filter(k => vocabData.words.BN_words[k].length > 0);
  const phChunks = Object.keys(vocabData.words.PH_words).filter(k => vocabData.words.PH_words[k].length > 0);
  const totalChunks = enChunks.length + bnChunks.length + phChunks.length;

  document.getElementById("totalCount").textContent = total;
  document.getElementById("enCount").textContent = enWords.length;
  document.getElementById("bnCount").textContent = bnWords.length;
  document.getElementById("chunkCount").textContent = totalChunks;
  document.getElementById("enBadge").textContent = enWords.length;
  document.getElementById("bnBadge").textContent = bnWords.length;
  document.getElementById("phBadge").textContent = phWords.length;

  const lu = vocabData.meta.lastUpdated;
  if (lu) {
    const d = new Date(lu);
    document.getElementById("lastUpdated").textContent =
      `Last updated: ${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
}

function getAllWords(lang) {
  const langKey = lang === "en" ? "EN_words" : lang === "bn" ? "BN_words" : "PH_words";
  return Object.values(vocabData.words[langKey]).flat();
}

function getChunkMeta(lang, chunkNum) {
  const langKey = lang === "en" ? "EN_words" : lang === "bn" ? "BN_words" : "PH_words";
  return vocabData.chunkMeta?.[langKey]?.[chunkNum] || { status: "running", completedAt: null, updatedAt: null };
}

function formatChunkStatus(words, meta) {
  if (words.length < 20) {
    return { label: "Running", className: "running" };
  }
  if (meta.status === "read") {
    return { label: "Read", className: "read" };
  }
  return { label: "Unread", className: "unread" };
}

// ── Render Chunks ──
function renderChunks(lang) {
  const langKey = lang === "en" ? "EN_words" : lang === "bn" ? "BN_words" : "PH_words";
  const container = document.getElementById(lang === "en" ? "enChunks" : lang === "bn" ? "bnChunks" : "phChunks");
  const emptyId = lang === "en" ? "enEmpty" : lang === "bn" ? "bnEmpty" : "phEmpty";
  const chunks = vocabData.words[langKey];
  const chunkEntries = Object.keys(chunks).map(Number).map(chunkNum => ({
    chunkNum,
    words: chunks[chunkNum] || [],
    meta: getChunkMeta(lang, chunkNum)
  }));

  // Clear old chunk cards (keep empty state)
  Array.from(container.querySelectorAll(".chunk-card")).forEach(el => el.remove());

  const allWords = chunkEntries.flatMap(entry => entry.words);
  const emptyEl = document.getElementById(emptyId);

  if (allWords.length === 0) {
    if (emptyEl) emptyEl.style.display = "";
    return;
  }

  if (emptyEl) emptyEl.style.display = "none";

  const runningChunks = chunkEntries
    .filter(entry => entry.words.length < 20)
    .sort((a, b) => a.chunkNum - b.chunkNum);

  const unreadCompleted = chunkEntries
    .filter(entry => entry.words.length >= 20 && entry.meta.status !== "read")
    .sort((a, b) => new Date(b.meta.completedAt || b.meta.updatedAt || 0) - new Date(a.meta.completedAt || a.meta.updatedAt || 0));

  const readCompleted = chunkEntries
    .filter(entry => entry.words.length >= 20 && entry.meta.status === "read")
    .sort((a, b) => new Date(b.meta.completedAt || b.meta.updatedAt || 0) - new Date(a.meta.completedAt || a.meta.updatedAt || 0));

  const sortedChunks = [...runningChunks, ...unreadCompleted, ...readCompleted];

  sortedChunks.forEach(entry => {
    if (entry.words.length === 0 && entry.chunkNum > 1) return;
    const card = buildChunkCard(lang, entry.chunkNum, entry.words, entry.meta);
    container.appendChild(card);
  });
}

function buildChunkCard(lang, chunkNum, words, meta = null) {
  const card = document.createElement("div");
  card.className = "chunk-card";
  card.dataset.lang = lang;
  card.dataset.chunk = chunkNum;

  const isFull = words.length >= 20;
  const containsBangla = words.some(w => /[\u0980-\u09FF]/.test(w));
  const statusMeta = meta || getChunkMeta(lang, chunkNum);
  const statusInfo = formatChunkStatus(words, statusMeta);
  const isStatusToggleEnabled = isFull;
  const statusButtonLabel = isStatusToggleEnabled
    ? (statusMeta.status === "read" ? "Mark Unread" : "Mark Read")
    : "Running";

  // Preview: first 4 words joined
  const previewWords = words.slice(0, 4);
  const preview = previewWords.join(", ") + (words.length > 4 ? "…" : "");

  card.innerHTML = `
    <div class="chunk-header">
      <span class="chunk-number">Chunk ${chunkNum}</span>
      <span class="chunk-status ${statusInfo.className}">${statusInfo.label}</span>
      <span class="chunk-preview ${containsBangla ? 'bn-font' : ''}">${preview || "Empty"}</span>
      <span class="chunk-count ${isFull ? 'full' : ''}">${words.length}/20</span>
      <span class="chunk-arrow">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </span>
    </div>
    <div class="chunk-body">
      <div class="word-pills" id="pills-${lang}-${chunkNum}"></div>
      <div class="array-display" id="array-${lang}-${chunkNum}"></div>
      <div class="chunk-actions">
        <button class="copy-btn" data-lang="${lang}" data-chunk="${chunkNum}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
          </svg>
          Copy Array
        </button>
        <button class="status-btn${isStatusToggleEnabled ? '' : ' disabled'}" data-lang="${lang}" data-chunk="${chunkNum}" data-status="${statusMeta.status}">
          ${statusButtonLabel}
        </button>
        <button class="delete-chunk-btn danger" data-lang="${lang}" data-chunk="${chunkNum}">
          Delete Chunk
        </button>
      </div>
    </div>
  `;

  // Toggle open/close
  card.querySelector(".chunk-header").addEventListener("click", () => {
    const wasOpen = card.classList.contains("open");
    card.classList.toggle("open");
    if (!wasOpen) {
      renderPills(lang, chunkNum, words, card);
      renderArray(lang, chunkNum, words, card);
    }
  });

  // Copy button
  card.querySelector(".copy-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    copyChunkAsArray(lang, chunkNum);
  });

  // Status toggle button
  const statusBtn = card.querySelector(".status-btn");
  if (isStatusToggleEnabled) {
    statusBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const currentStatus = statusMeta.status || "unread";
      const newStatus = currentStatus === "read" ? "unread" : "read";
      updateChunkStatus(lang, chunkNum, newStatus);
    });
  } else {
    statusBtn.setAttribute("disabled", "disabled");
  }

  // Delete chunk button
  card.querySelector(".delete-chunk-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    confirmDelete(`Delete chunk ${chunkNum}? This will remove all words in this chunk.`, () => {
      deleteChunk(lang, chunkNum);
    });
  });

  return card;
}

function renderPills(lang, chunkNum, words, card) {
  const pillsEl = card.querySelector(`#pills-${lang}-${chunkNum}`);
  pillsEl.innerHTML = "";
  const isBn = lang === "bn";

  words.forEach((word, idx) => {
    const pill = document.createElement("div");
    pill.className = `word-pill ${isBn ? "bn-pill" : ""}`;
    pill.innerHTML = `
      <span>${word}</span>
      <button class="del-word-btn" title="Remove word">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;
    pill.querySelector(".del-word-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      confirmDelete(`Remove "${word}" from your list?`, () => {
        deleteWord(lang, chunkNum, idx);
      });
    });
    pillsEl.appendChild(pill);
  });
}

function renderArray(lang, chunkNum, words, card) {
  const arrayEl = card.querySelector(`#array-${lang}-${chunkNum}`);
  const isBn = lang === "bn";
  const colorClass = isBn ? "bn" : "";

  const items = words.map(w => `<span class="array-string ${colorClass}">"${w}"</span>`).join('<span class="array-comma">, </span>');
  arrayEl.innerHTML = `<span class="array-bracket">[</span>${items}<span class="array-bracket">]</span>`;
}

function copyChunkAsArray(lang, chunkNum) {
  const langKey = lang === "en" ? "EN_words" : lang === "bn" ? "BN_words" : "PH_words";
  const words = vocabData.words[langKey][chunkNum] || [];
  const arrayStr = JSON.stringify(words, null, 0);
  navigator.clipboard.writeText(arrayStr).then(() => {
    showPopupToast("✓ Copied to clipboard!", "success");
    // Visual feedback on button
    const btn = document.querySelector(`.copy-btn[data-lang="${lang}"][data-chunk="${chunkNum}"]`);
    if (btn) {
      btn.classList.add("copied");
      btn.textContent = "✓ Copied!";
      setTimeout(() => {
        btn.classList.remove("copied");
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy Array`;
      }, 2000);
    }
  });
}

// ── Delete Word ──
function deleteWord(lang, chunkNum, index) {
  chrome.runtime.sendMessage({ action: "deleteWord", lang, chunk: chunkNum, index }, () => {
    loadAndRender();
    showPopupToast("Word removed", "success");
  });
}

function updateChunkStatus(lang, chunkNum, status) {
  chrome.runtime.sendMessage({ action: "updateChunkStatus", lang, chunk: chunkNum, status }, () => {
    loadAndRender();
    showPopupToast(`Chunk ${chunkNum} marked ${status}`, "success");
  });
}

function deleteChunk(lang, chunkNum) {
  chrome.runtime.sendMessage({ action: "deleteChunk", lang, chunk: chunkNum }, () => {
    loadAndRender();
    showPopupToast(`Chunk ${chunkNum} deleted`, "warn");
  });
}

// ── Tabs ──
function setupTabs() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`panel-${tab}`).classList.add("active");
    });
  });
}

// ── Buttons ──
function setupButtons() {
  // Export buttons
  document.getElementById("exportBtn").addEventListener("click", exportData);
  document.getElementById("exportBtnSettings").addEventListener("click", exportData);

  // Clear English
  document.getElementById("clearEnBtn").addEventListener("click", () => {
    confirmDelete("Clear all English words?", () => clearLang("en"));
  });

  // Clear Bangla
  document.getElementById("clearBnBtn").addEventListener("click", () => {
    confirmDelete("Clear all Bangla words?", () => clearLang("bn"));
  });

  // Clear Phrase
  document.getElementById("clearPhraseBtn").addEventListener("click", () => {
    confirmDelete("Clear all phrases?", () => clearLang("ph"));
  });

  // Clear All
  document.getElementById("clearAllBtn").addEventListener("click", () => {
    confirmDelete("Clear ALL words? This cannot be undone.", () => {
      chrome.runtime.sendMessage({ action: "clearAll" }, () => {
        loadAndRender();
        showPopupToast("All words cleared", "warn");
      });
    });
  });

  // Settings tab button in header
  document.getElementById("settingsBtn").addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    document.querySelector('[data-tab="settings"]').classList.add("active");
    document.getElementById("panel-settings").classList.add("active");
  });

  // Shortcut link
  document.getElementById("openShortcutsPage").addEventListener("click", (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
  });

  // Confirm dialog
  document.getElementById("confirmCancel").addEventListener("click", () => {
    document.getElementById("confirmOverlay").classList.add("hidden");
  });
}

function clearLang(lang) {
  const langKey = lang === "en" ? "EN_words" : lang === "bn" ? "BN_words" : "PH_words";
  vocabData.words[langKey] = { 1: [] };
  if (lang === "ph") {
    vocabData.meta.totalWords = getAllWords("en").length + getAllWords("bn").length;
  } else {
    const other = lang === "en" ? "bn" : "en";
    vocabData.meta.totalWords = getAllWords(other).length + getAllWords("ph").length;
  }
  vocabData.meta.lastUpdated = new Date().toISOString();

  chrome.storage.local.set({ vocabData }, () => {
    loadAndRender();
    const label = lang === "en" ? "English" : lang === "bn" ? "Bangla" : "Phrase";
    showPopupToast(`${label} words cleared`, "warn");
  });
}

// ── Export ──
function exportData() {
  const json = JSON.stringify(vocabData, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const timestamp = new Date().toISOString().slice(0, 10);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vocab-vault-${timestamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showPopupToast("✓ Database exported!", "success");
}

// ── Confirm Dialog ──
let confirmCallback = null;

function confirmDelete(msg, callback) {
  confirmCallback = callback;
  document.getElementById("confirmMsg").textContent = msg;
  document.getElementById("confirmOverlay").classList.remove("hidden");
  document.getElementById("confirmOk").onclick = () => {
    document.getElementById("confirmOverlay").classList.add("hidden");
    if (confirmCallback) confirmCallback();
    confirmCallback = null;
  };
}

// ── Popup Toast ──
let toastTimeout = null;

function showPopupToast(msg, type = "success") {
  const toast = document.getElementById("popupToast");
  toast.textContent = msg;
  toast.className = `popup-toast ${type}`;
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2500);
}
