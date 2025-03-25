import { defineStore } from "pinia";
import { ref } from "vue";

export const useAppStore = defineStore("appStore", () => {
  const selectedOperator = ref(null);

  const initSelectOperator = async () => {
    selectedOperator.value = await window.api.getSelectedOperator();

    window.api.onMessage("selected-operator", (operator) => {
      selectedOperator.value = operator;
    });
  };

  return {
    selectedOperator,
    initSelectOperator,
  };
});
