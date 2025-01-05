import { defineBackground } from "wxt/sandbox";

interface SavedItem {
  id: number;
  timestamp: string;
  url: string;
  title: string;
  type?: "text" | "image" | "link" | "note";
  text?: string;
}

export default defineBackground(() => {
  // 创建右键菜单
  chrome.contextMenus.create({
    id: "saveToCollection",
    title: "保存到收藏夹",
    contexts: ["selection", "image", "link"],
  });

  // 监听菜单点击事件
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "saveToCollection") {
      let savedItem: SavedItem = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        url: tab?.url || "",
        title: tab?.title || "",
      };

      // 处理图片
      if (info.mediaType === "image") {
        savedItem = {
          ...savedItem,
          type: "image",
          text: info.srcUrl || "",
        };
      }
      // 处理链接
      else if (info.linkUrl) {
        savedItem = {
          ...savedItem,
          type: "link",
          text: info.linkUrl,
          title: info.linkUrl,
        };
      }
      // 处理文本
      else if (info.selectionText) {
        savedItem = {
          ...savedItem,
          type: "text",
          text: info.selectionText,
        };
      }

      // 保存到存储
      chrome.storage.local.get(["savedTexts"]).then((result) => {
        const savedItems = result.savedTexts || [];
        savedItems.push(savedItem);
        chrome.storage.local.set({ savedTexts: savedItems }).then(() => {
          if (tab?.id) {
            chrome.tabs.sendMessage(tab.id, { type: "showSaveNotification" });
          }
        });
      });
    }
  });
});
