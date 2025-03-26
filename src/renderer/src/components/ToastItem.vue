<template>
  <ToastRoot
    :class="[
      'group data-[state=open]:animate-in data-[state=closed]:animate-out pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all',
      toastClass,
    ]"
  >
    <div class="grid gap-1">
      <ToastTitle class="text-sm font-semibold">{{ title }}</ToastTitle>
      <ToastDescription class="text-sm opacity-90">{{ description }}</ToastDescription>
    </div>
    <ToastClose
      class="absolute top-2 right-2 rounded-md p-1 text-gray-500 opacity-0 transition-opacity group-hover:opacity-100 hover:text-gray-900 focus:opacity-100 focus:ring-2 focus:outline-none"
    >
      <span class="sr-only">Закрыть</span>
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </ToastClose>
  </ToastRoot>
</template>

<script setup>
  import { ToastRoot, ToastTitle, ToastDescription, ToastClose } from "radix-vue";
  import { computed, watch } from "vue";

  const props = defineProps({
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: "default", // Возможные значения: "success", "error", "default"
    },
    duration: {
      type: Number,
      default: 3000,
    },
  });

  // Вычисляем классы для изменения стилей в зависимости от типа
  const toastClass = computed(() => {
    switch (props.type) {
      case "success":
        return "bg-green-100 border-green-500 text-green-800";
      case "error":
        return "bg-red-100 border-red-500 text-red-800";
      default:
        return "bg-gray-100 border-gray-200 text-gray-800";
    }
  });

  watch(
    () => props.type,
    (newValue) => {
      console.log("Тип изменился на:", newValue);
    }
  );
</script>
