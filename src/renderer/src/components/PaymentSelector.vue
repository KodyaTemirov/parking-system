<script setup>
  import { ref } from "vue";
  import { Icon } from "@iconify/vue";

  const props = defineProps(["modelValue"]);
  const emit = defineEmits(["update:modelValue"]);

  // Типы оплаты с иконками
  const paymentMethods = ref([
    { id: 1, name: "Наличные", icon: "mdi:cash", state: props.modelValue === 1 },
    { id: 2, name: "Карта", icon: "mdi:credit-card", state: props.modelValue === 2 },
  ]);

  // Функция выбора типа оплаты
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
        'flex w-full items-center gap-3 rounded-lg border p-3 text-lg transition',
        method.state ? 'bg-blue-500 text-white' : 'bg-gray-100 text-black',
      ]"
    >
      <Icon :icon="method.icon" class="text-2xl" />
      {{ method.name }}
    </button>
  </div>
</template>

<style scoped>
  button {
    cursor: pointer;
  }
</style>
