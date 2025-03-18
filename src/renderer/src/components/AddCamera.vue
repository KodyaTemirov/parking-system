<script setup>
  import axios from "axios";
  import { onMounted, ref, watch } from "vue";
  import Button from "./Button.vue";
  import {
    DialogContent,
    DialogOverlay,
    DialogPortal,
    DialogRoot,
    DialogTrigger,
    DialogTitle,
    DialogClose,
  } from "radix-vue";
  import { Icon } from "@iconify/vue";

  const isDialogOpen = ref(true);
  const backendURL = "http://10.20.10.157:9061";

  const cameraInfo = ref({
    name: "",
    ip: "",
    login: "",
    password: "",
    operatorId: "",
    type: "",
  });

  const props = defineProps({
    id: {
      type: String,
      default: "",
    },
  });

  const operators = ref([]); // Храним список операторов

  const addCamera = () => {
    if (cameraInfo.value.ip.trim() && cameraInfo.value.name.trim() && cameraInfo.value.operatorId) {
      window.api.send("add-camera", { ...cameraInfo.value });

      isDialogOpen.value = false;
      cameraInfo.value = {
        name: "",
        login: "",
        ip: "",
        password: "",
        operatorId: "",
        type: "",
      };
    }
  };

  const getAllOperators = async () => {
    try {
      const { data } = await axios.get(`${backendURL}/api/operator`);
      operators.value = data; // Записываем операторов в состояние
    } catch (error) {
      console.error("Ошибка при получении операторов:", error);
    }
  };

  onMounted(() => {
    getAllOperators();
  });

  watch(
    () => props.id,
    (newValue) => {
      cameraInfo.value.operatorId = newValue;
    }
  );
</script>

<template>
  <DialogRoot v-model="isDialogOpen">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-30 bg-black/50" />
      <DialogContent
        class="fixed top-1/2 left-1/2 z-50 w-[90vw] max-w-[450px] -translate-x-1/2 -translate-y-1/2 transform rounded-md bg-white p-6 shadow-lg"
      >
        <DialogTitle class="text-lg font-semibold">Добавить камеру</DialogTitle>

        <div class="mt-4 space-y-2">
          <input
            v-model="cameraInfo.name"
            placeholder="Название"
            class="w-full rounded border p-2"
          />
          <input v-model="cameraInfo.ip" placeholder="IP-адрес" class="w-full rounded border p-2" />
          <input v-model="cameraInfo.login" placeholder="Логин" class="w-full rounded border p-2" />
          <input
            v-model="cameraInfo.password"
            placeholder="Пароль"
            type="password"
            class="w-full rounded border p-2"
          />

          <select v-model="cameraInfo.operatorId" class="w-full rounded border p-2">
            <option value="" disabled>Выберите оператора</option>
            <option v-for="operator in operators" :key="operator.id" :value="operator.id">
              {{ operator.name }}
            </option>
          </select>

          <select v-model="cameraInfo.type" class="w-full rounded border p-2">
            <option value="" disabled>Выберите тип камеры</option>
            <option value="input">Input</option>
            <option value="output">Output</option>
          </select>
        </div>

        <div class="mt-4 flex justify-end space-x-2">
          <DialogClose as="button" class="rounded bg-gray-200 px-4 py-2">Отмена</DialogClose>
          <Button @click="addCamera">Добавить</Button>
        </div>

        <DialogClose class="absolute top-2 right-2">
          <Icon icon="lucide:x" class="text-gray-500 hover:text-gray-700" />
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
