document.addEventListener("mouseup", async () => {
  const selectedText = window.getSelection().toString().trim();

  if (selectedText) {
    const type = detectContentType(selectedText);

    chrome.storage.local.get(["savedTexts"], function (result) {
      const savedItems = result.savedTexts || [];
      savedItems.push({
        id: Date.now(),
        text: selectedText,
        timestamp: new Date().toISOString(),
        type: type,
        url: window.location.href,
        title: document.title,
      });

      chrome.storage.local.set({ savedTexts: savedItems }, function () {
        showSaveNotification();
      });
    });
  }
});

function detectContentType(text) {
  if (/^(http|https):\/\/[^ "]+$/.test(text)) {
    return "url";
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
    return "email";
  }
  if (
    text.includes("{") ||
    text.includes("function") ||
    text.includes("class")
  ) {
    return "code";
  }
  return "text";
}

function showSaveNotification() {
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4F46E5;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    z-index: 9999;
    font-family: system-ui;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  `;
  notification.textContent = "✓ 内容已保存";
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transition = "opacity 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}
