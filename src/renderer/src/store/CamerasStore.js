import { defineStore } from "pinia";
import { ref } from "vue";

export const useCamerasStore = defineStore("camerasStore", () => {
  const newCamera = ref({
    name: "",
    ip: "",
    login: "",
    password: "",
    operatorId: "1",
    status: "",
    type: "",
  });

  return {};
});
