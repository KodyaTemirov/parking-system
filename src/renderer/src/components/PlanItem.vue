<script setup>
  import { watch } from "vue";
  import { Icon } from "@iconify/vue";
  const props = defineProps({
    value: {
      type: String,
      default: "Не указано",
    },
    price: {
      type: Number,
      default: 20000,
    },
    id: {
      type: Number,
      default: 20000,
    },
    state: {
      type: Boolean,
      default: false,
    },
    pricePerDay: {
      type: Number,
      default: 10000,
    },
    icon: {
      type: String,
      default: "mdi-light:home",
    },
  });
</script>

<template>
  <button class="button-price" :class="{ '!border-blue-600 !bg-white text-white': state }">
    <div class="icon-wrapper">
      <Icon :icon="icon" />
    </div>
    <div>
      <div class="price-title">
        {{ props.value }}
      </div>
      <div class="price">Цена: {{ props.price }} сум</div>
      <div class="price">За дополнительные дни: {{ props.pricePerDay }} сум</div>
    </div>
  </button>
</template>

<style scoped>
  @reference "../assets/main.css";

  .button-price {
    @apply flex w-full cursor-pointer gap-4 rounded-md border-2 border-gray-200 px-4 py-2 text-left font-medium text-blue-600 hover:border-gray-200 hover:bg-gray-200;
  }
  .icon-wrapper {
    @apply flex h-14 w-14 flex-none items-center justify-center rounded-full bg-gray-100 text-3xl;
  }
  .price-title {
    @apply font-semibold text-gray-700;
  }
  .price {
    @apply text-sm text-gray-500;
  }
</style>
