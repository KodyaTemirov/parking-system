<template>
  <Toast>
    <ToastItem
      v-for="toast in toasts"
      :key="toast.id"
      :title="toast.title"
      :description="toast.description"
      :type="toast.type"
      :duration="toast.duration"
      @close="removeToast(toast.id)"
    />
  </Toast>
</template>

<script setup>
  import { useToast } from "../composables/useToast";
  import Toast from "./Toast.vue";
  import ToastItem from "./ToastItem.vue";

  const { toasts, removeToast } = useToast();
</script>
