<template>
  <ToastProvider>
    <ToastViewport class="fixed right-0 bottom-0 z-50 flex flex-col gap-2 p-4" />
    <slot />
  </ToastProvider>
</template>

<script setup>
  import { ToastProvider, ToastViewport } from "radix-vue";
</script>
