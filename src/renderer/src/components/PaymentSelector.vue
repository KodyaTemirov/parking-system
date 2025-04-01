<script setup>
  import { ref } from "vue";
  import { Icon } from "@iconify/vue";

  const props = defineProps(["modelValue"]);
  const emit = defineEmits(["update:modelValue"]);

  // To'lov turlari va ularning ikonkalari
  const paymentMethods = ref([
    { id: 1, name: "Naqd", icon: "mdi:cash", state: props.modelValue === 1 },
    { id: 2, name: "Karta", icon: "mdi:credit-card", state: props.modelValue === 2 },
  ]);

  // To'lov turini tanlash funksiyasi
  const selectPayment = (id) => {
    emit("update:modelValue", id);
    paymentMethods.value = paymentMethods.value.map((method) => ({
      ...method,
      state: method.id === id,
    }));
  };
</script>

<template>
  <div class="flex gap-2">
    <button
      v-for="method in paymentMethods"
      :key="method.id"
      @click="selectPayment(method.id)"
      :class="[
        'flex w-full items-center gap-3 rounded-lg border-2 p-3 text-lg transition hover:bg-gray-200',
        method.state ? 'border-blue-600 hover:bg-white' : 'border-gray-200 text-black',
      ]"
    >
      <div class="icon-wrapper">
        <Icon :icon="method.icon" class="text-blue-600" />
      </div>
      {{ method.name }}
    </button>
  </div>
</template>

<style scoped>
  @reference "../assets/main.css";

  button {
    cursor: pointer;
  }

  .icon-wrapper {
    @apply flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm;
  }
</style>
