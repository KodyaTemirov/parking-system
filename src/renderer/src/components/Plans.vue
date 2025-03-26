<script setup>
  import { ref, computed } from "vue";
  import PlanItem from "./PlanItem.vue";
  import { tariffs } from "@/config";

  const props = defineProps(["modelValue"]);
  const emit = defineEmits(["update:modelValue"]);

  // Делаем тариф с id = 1 активным по умолчанию
  const prices = ref(
    tariffs.map((item) => ({
      ...item,
      state: item.id === props.modelValue,
    }))
  );

  // Функция выбора тарифа
  const selectPrice = (id) => {
    emit("update:modelValue", id);
    prices.value = prices.value.map((price) => ({
      ...price,
      state: price.id === id,
    }));
  };
</script>

<template>
  <div class="flex flex-col gap-2">
    <PlanItem
      v-for="price in prices"
      :key="price.id"
      v-bind="price"
      @click="selectPrice(price.id)"
    />
  </div>
</template>
