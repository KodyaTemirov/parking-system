<template>
  <ToastRoot
    class="group data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border border-gray-200 bg-white p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none"
  >
    <div class="grid gap-1">
      <ToastTitle class="text-sm font-semibold">
        {{ title }}
      </ToastTitle>
      <ToastDescription class="text-sm opacity-90">
        {{ description }}
      </ToastDescription>
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

  defineProps({
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
      default: "default",
    },
    duration: {
      type: Number,
      default: 5000,
    },
  });
</script>
