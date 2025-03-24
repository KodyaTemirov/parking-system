<script setup lang="ts"></script>

<template>
  <div class="sub-title">
    <slot />
  </div>
</template>

<style scoped>
  @reference "@/assets/main.css";

  .sub-title {
    @apply my-4 text-lg font-semibold text-gray-800;
  }
</style>
