<template>
  <div class="min-h-screen bg-gray-100 p-4">
    <header class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800">文本收藏夹</h1>
      <SearchBar @search="handleSearch" />
      <div class="mt-4 flex gap-2">
        <button
          v-if="filteredItems.length > 0"
          @click="toggleSelectAll"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          {{ isAllSelected ? "取消全选" : "全选" }}
        </button>
        <button
          v-if="selectedItems.length > 0"
          @click="deleteSelected"
          class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          删除选中 ({{ selectedItems.length }})
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
          v-for="type in ['all', 'text', 'image', 'link', 'note']"
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
      <div v-if="currentType === 'note'" class="mt-4">
        <button
          @click="createNewNote"
          class="w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition flex items-center justify-center gap-2"
        >
          <span class="text-xl">+</span> 新建随想
        </button>
      </div>
    </header>

    <div class="space-y-4">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="bg-white rounded-lg shadow p-4"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <input
              type="checkbox"
              :checked="selectedItems.includes(item.id)"
              @change="toggleSelect(item.id)"
              class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span
              :class="[
                'text-sm font-medium px-2 py-1 rounded',
                typeColors[item.type],
              ]"
            >
              {{ typeLabels[item.type] }}
            </span>
          </div>
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
          <template v-if="item.type === 'image'">
            <div class="relative group">
              <img
                :src="item.text"
                :alt="item.title || '图片'"
                class="w-full h-48 object-cover rounded cursor-pointer"
                @click="openImageViewer(item)"
              />
              <div
                class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"
              ></div>
            </div>
          </template>
          <template v-else-if="item.type === 'link'">
            <a
              :href="item.text"
              target="_blank"
              class="text-blue-600 hover:underline block"
            >
              {{ item.title || item.text }}
            </a>
          </template>
          <template v-else-if="item.type === 'note'">
            <div class="space-y-2">
              <div v-if="editingNoteId === item.id">
                <textarea
                  v-model="item.text"
                  class="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                  rows="4"
                ></textarea>
                <div class="flex justify-end gap-2">
                  <button
                    @click="cancelEdit()"
                    class="px-3 py-1 text-gray-600 hover:text-gray-800"
                  >
                    取消
                  </button>
                  <button
                    @click="saveNote(item)"
                    class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    保存
                  </button>
                </div>
              </div>
              <div v-else>
                <div class="whitespace-pre-wrap">{{ item.text }}</div>
                <button
                  @click="editingNoteId = item.id"
                  class="mt-2 text-blue-500 hover:text-blue-600 text-sm"
                >
                  编辑
                </button>
              </div>
            </div>
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
import { ref, computed } from "vue";
import SearchBar from "./components/SearchBar.vue";

const savedItems = ref([]);
const searchText = ref("");
const currentType = ref("all");
const selectedItems = ref([]);
const editingNoteId = ref(null);

const typeLabels = {
  all: "全部",
  text: "文本",
  image: "图片",
  link: "链接",
  note: "随想",
};

const typeColors = {
  text: "bg-gray-100 text-gray-600",
  image: "bg-green-100 text-green-600",
  link: "bg-blue-100 text-blue-600",
  note: "bg-yellow-100 text-yellow-600",
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
  chrome.storage.local.get(["savedTexts"]).then((result) => {
    savedItems.value = (result.savedTexts || []).sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
  });
};

const toggleSelect = (id) => {
  const index = selectedItems.value.indexOf(id);
  if (index === -1) {
    selectedItems.value.push(id);
  } else {
    selectedItems.value.splice(index, 1);
  }
};

const deleteSelected = () => {
  chrome.storage.local.get(["savedTexts"]).then((result) => {
    const items = result.savedTexts || [];
    const newItems = items.filter(
      (item) => !selectedItems.value.includes(item.id)
    );
    chrome.storage.local.set({ savedTexts: newItems }).then(() => {
      savedItems.value = newItems;
      selectedItems.value = [];
    });
  });
};

const deleteItem = (id) => {
  chrome.storage.local.get(["savedTexts"]).then((result) => {
    const items = result.savedTexts || [];
    const newItems = items.filter((item) => item.id !== id);
    chrome.storage.local.set({ savedTexts: newItems }).then(() => {
      savedItems.value = newItems;
    });
  });
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

const isAllSelected = computed(() => {
  return (
    filteredItems.value.length > 0 &&
    filteredItems.value.every((item) => selectedItems.value.includes(item.id))
  );
});

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedItems.value = [];
  } else {
    selectedItems.value = filteredItems.value.map((item) => item.id);
  }
};

const saveNote = (item) => {
  chrome.storage.local.get(["savedTexts"]).then((result) => {
    const items = result.savedTexts || [];
    const index = items.findIndex((i) => i.id === item.id);
    if (index !== -1) {
      items[index] = item;
      chrome.storage.local.set({ savedTexts: items }).then(() => {
        editingNoteId.value = null;
      });
    }
  });
};

const cancelEdit = () => {
  editingNoteId.value = null;
  loadItems();
};

const openImageViewer = (item) => {
  const viewer = document.createElement("div");
  viewer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    cursor: zoom-out;
  `;

  const img = document.createElement("img");
  img.src = item.text;
  img.style.cssText = `
    max-width: 90%;
    max-height: 90%;
    object-fit: contain;
  `;

  viewer.appendChild(img);
  viewer.onclick = () => viewer.remove();
  document.body.appendChild(viewer);
};

const createNewNote = () => {
  const newNote = {
    id: Date.now(),
    type: "note",
    text: "",
    timestamp: new Date().toISOString(),
    url: "",
    title: "新随想",
  };

  chrome.storage.local.get(["savedTexts"]).then((result) => {
    const items = result.savedTexts || [];
    items.unshift(newNote);
    chrome.storage.local.set({ savedTexts: items }).then(() => {
      savedItems.value = items;
      editingNoteId.value = newNote.id;
    });
  });
};

chrome.storage.onChanged.addListener((changes) => {
  if (changes.savedTexts) {
    loadItems();
  }
});

loadItems();
</script>
