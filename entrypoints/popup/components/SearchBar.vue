<template>
  <div class="mb-4">
    <input
      type="text"
      v-model="searchQuery"
      @input="$emit('search', searchQuery)"
      placeholder="搜索内容..."
      class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";

const searchQuery = ref("");
defineEmits(["search"]);
</script>
