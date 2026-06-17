// content.js - Injected into pages for toast notifications

(function () {
  // Inject toast styles once
  if (!document.getElementById("vocab-vault-styles")) {
    const style = document.createElement("style");
    style.id = "vocab-vault-styles";
    style.textContent = `
      #vocab-vault-toast-container {
        position: fixed;
        bottom: 28px;
        right: 28px;
        z-index: 2147483647;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
        font-family: 'Segoe UI', system-ui, sans-serif;
      }

      .vocab-vault-toast {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 13px 18px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 500;
        max-width: 340px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.22);
        backdrop-filter: blur(12px);
        pointer-events: auto;
        animation: vv-slide-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        line-height: 1.4;
      }

      .vocab-vault-toast.vv-success {
        background: rgba(20, 20, 30, 0.95);
        color: #a8f0c6;
        border: 1px solid rgba(100, 220, 150, 0.3);
      }

      .vocab-vault-toast.vv-error {
        background: rgba(20, 20, 30, 0.95);
        color: #f5a9a9;
        border: 1px solid rgba(220, 100, 100, 0.3);
      }

      .vocab-vault-toast.vv-warn {
        background: rgba(20, 20, 30, 0.95);
        color: #fce6a4;
        border: 1px solid rgba(240, 190, 80, 0.3);
      }

      .vocab-vault-toast.vv-fadeout {
        animation: vv-slide-out 0.3s ease forwards;
      }

      @keyframes vv-slide-in {
        from { opacity: 0; transform: translateY(20px) scale(0.95); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }

      @keyframes vv-slide-out {
        from { opacity: 1; transform: translateY(0) scale(1); }
        to   { opacity: 0; transform: translateY(-10px) scale(0.95); }
      }
    `;
    document.head.appendChild(style);
  }

  // Create container
  if (!document.getElementById("vocab-vault-toast-container")) {
    const container = document.createElement("div");
    container.id = "vocab-vault-toast-container";
    document.body.appendChild(container);
  }

  function showToast(message, type = "success") {
    const container = document.getElementById("vocab-vault-toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `vocab-vault-toast vv-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("vv-fadeout");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Listen for messages from background
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "showToast") {
      showToast(message.message, message.type);
    }
  });
})();
