<template>
  <button :class="['button', buttonVariantClass, customClass]">
    <slot />
  </button>
</template>

<script setup>
  import { computed } from "vue";
  const props = defineProps({
    variant: {
      type: String,
      default: "primary",
    },
    customClass: {
      type: String,
      default: "",
    },
  });

  const buttonVariantClass = computed(() => {
    const variants = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
      secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-400",
      danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
      success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
    };

    return variants[props.variant] || "";
  });
</script>

<style scoped>
  @reference "../assets/main.css";

  .button {
    @apply cursor-pointer rounded-md px-4 py-2 font-medium transition-all duration-200 ease-in-out focus:ring-2 focus:ring-offset-2 focus:outline-none;
  }
</style>
