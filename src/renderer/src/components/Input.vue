<script setup>
  import { computed } from "vue";

  const props = defineProps({
    modelValue: {
      type: String,
      required: false,
      default: "",
    },
  });

  const emit = defineEmits(["update:modelValue"]);

  const updateValue = (event) => {
    emit("update:modelValue", event.target.value);
  };
</script>

<template>
  <input class="input" :value="modelValue" @input="updateValue" placeholder="Введите номер чека" />
</template>

<style scoped>
  @reference "../assets/main.css";

  .input {
    @apply w-full rounded-lg border-2 border-gray-200 p-4 text-lg;
  }
</style>
