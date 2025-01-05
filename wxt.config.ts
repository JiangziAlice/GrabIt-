import { defineConfig } from "wxt";

export default defineConfig({
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-vue"],
  manifest: {
    name: "GrabIt!",
    description: "A browser extension to collect and manage selected text",
    version: "1.0.0",
    permissions: ["storage", "activeTab", "contextMenus"],
    host_permissions: ["<all_urls>"],
  },
  runner: {
    disabled: true,
  },
});
