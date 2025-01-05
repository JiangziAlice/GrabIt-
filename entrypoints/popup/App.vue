<template>
  <div class="min-h-screen bg-gray-100 p-4">
    <header class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800">文本收藏夹</h1>
      <SearchBar @search="handleSearch" />
      <div class="mt-4 flex gap-2">
        <button
          @click="clearAll"
          class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          清空全部
        </button>
        <button
          @click="exportData"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          导出
        </button>
      </div>
      <div class="mt-4 flex gap-2">
        <button
          v-for="type in ['all', 'text', 'url', 'email', 'code']"
          :key="type"
          @click="currentType = type"
          :class="[
            'px-3 py-1 rounded transition',
            currentType === type
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100',
          ]"
        >
          {{ typeLabels[type] }}
        </button>
      </div>
    </header>

    <div class="space-y-4">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="bg-white rounded-lg shadow p-4"
      >
        <div class="flex items-center gap-2 mb-2">
          <span
            :class="[
              'text-sm font-medium px-2 py-1 rounded',
              typeColors[item.type],
            ]"
          >
            {{ typeLabels[item.type] }}
          </span>
          <span class="text-sm text-gray-500">
            {{ new Date(item.timestamp).toLocaleString() }}
          </span>
        </div>

        <div
          :class="[
            'text-gray-800',
            item.type === 'code' ? 'font-mono bg-gray-50 p-2 rounded' : '',
          ]"
        >
          <template v-if="item.type === 'url'">
            <a
              :href="item.text"
              target="_blank"
              class="text-blue-600 hover:underline"
            >
              {{ item.text }}
            </a>
          </template>
          <template v-else>
            {{ item.text }}
          </template>
        </div>

        <div v-if="item.url" class="mt-2 text-sm text-gray-500">
          来源：
          <a
            :href="item.url"
            target="_blank"
            class="text-gray-600 hover:underline"
          >
            {{ item.title || item.url }}
          </a>
        </div>

        <div class="mt-2 flex justify-end">
          <button
            @click="deleteItem(item.id)"
            class="text-red-500 hover:text-red-600"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import SearchBar from "./components/SearchBar.vue";

const savedItems = ref([]);
const searchText = ref("");
const currentType = ref("all");

const typeLabels = {
  all: "全部",
  text: "文本",
  url: "链接",
  email: "邮箱",
  code: "代码",
};

const typeColors = {
  text: "bg-gray-100 text-gray-600",
  url: "bg-blue-100 text-blue-600",
  email: "bg-green-100 text-green-600",
  code: "bg-purple-100 text-purple-600",
};

const filteredItems = computed(() => {
  let items = savedItems.value;

  if (currentType.value !== "all") {
    items = items.filter((item) => item.type === currentType.value);
  }

  if (searchText.value) {
    const query = searchText.value.toLowerCase();
    items = items.filter(
      (item) =>
        item.text.toLowerCase().includes(query) ||
        (item.title && item.title.toLowerCase().includes(query))
    );
  }

  return items;
});

const loadItems = () => {
  chrome.storage.local.get(["savedTexts"], function (result) {
    const items = result.savedTexts || [];
    savedItems.value = items.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
  });
};

const deleteItem = (id) => {
  chrome.storage.local.get(["savedTexts"], function (result) {
    const items = result.savedTexts || [];
    const newItems = items.filter((item) => item.id !== id);
    chrome.storage.local.set({ savedTexts: newItems }, function () {
      savedItems.value = newItems;
    });
  });
};

const clearAll = () => {
  if (confirm("确定要清空所有内容吗？")) {
    chrome.storage.local.set({ savedTexts: [] }, function () {
      savedItems.value = [];
    });
  }
};

const handleSearch = (query) => {
  searchText.value = query;
};

const exportData = () => {
  const data = savedItems.value
    .map(
      (item) =>
        `类型: ${typeLabels[item.type]}\n内容: ${item.text}\n时间: ${new Date(
          item.timestamp
        ).toLocaleString()}\n来源: ${item.url || "无"}\n---`
    )
    .join("\n\n");

  const blob = new Blob([data], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "text-collection.txt";
  a.click();
  URL.revokeObjectURL(url);
};

onMounted(() => {
  loadItems();
  // 监听存储变化
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "local" && changes.savedTexts) {
      loadItems();
    }
  });
});
</script>
