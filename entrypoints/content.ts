import { defineContentScript } from "wxt/sandbox";

export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    // 监听来自后台脚本的消息
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === "showSaveNotification") {
        showSaveNotification();
      }
    });

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
  },
});
