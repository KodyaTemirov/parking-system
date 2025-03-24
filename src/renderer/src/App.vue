<script setup>
  import { onMounted, ref, watch } from "vue";
  import { socket } from "@/helpers";
  import { useSessionsStore } from "@/store";
  import axios from "axios";
  import { ipServer } from "@/config";
  import { useToast } from "@/composables";
  const { success } = useToast();
  const sessionStore = useSessionsStore();
  const currentTariff = ref();
  const initialCar = { paymentMethod: 1, tariffType: 1, eventName: "output" };
  const inputCar = ref({ ...initialCar });
  const outputCar = ref({ ...initialCar });
  const selectedOperator = ref(null);
  const isOpenInput = ref(false);
  const isOpenOutput = ref(false);

  const addCam = ref({ open: false, id: null });
  const isSocketConnected = ref(false);

  const openModalHandler = (id) => {
    addCam.value = { open: true, id };
  };

  const addSessionHandler = async () => {
    const { number, plateImage, fullImage, eventName, paymentMethod, tariffType, cameraIp, price } =
      inputCar.value;

    if (eventName === "input") {
      await axios.post(`${ipServer}/api/register-session`, {
        number,
        plateImage,
        fullImage,
        eventName: eventName || "input",
        paymentMethod,
        tariffType: tariffType || 1,
        cameraIp,
      });
    } else {
      await axios.post(`${ipServer}/api/output-session`, {
        number,
        plateImage,
        fullImage,
        eventName: eventName || "input",
        paymentMethod,
        tariffType: tariffType || 1,
        cameraIp,
        outputCost: price,
      });
    }

    isOpenInput.value = false;
  };

  const openDrawer = () => {
    isOpenInput.value = true;
    inputCar.value = { ...initialCar };
  };

  const openDrawerOutput = () => {
    isOpenOutput.value = true;
  };

  const getAllSession = async () => {
    try {
      const { data } = await axios.get(`${ipServer}/api/session`);
      sessionStore.setSessions(data.data);
    } catch (error) {
      console.log(error, "ERRROR");
    }
  };

  watch(selectedOperator, (newOperator, oldOperator) => {
    if (oldOperator) {
      socket.off(`inputCar-${oldOperator}`);
      socket.off(`outputCar-${oldOperator}`);
      socket.off(`payedToday-${oldOperator}`);
    }

    if (newOperator) {
      socket.connect();
      socket.on(`inputCar-${newOperator}`, async (data) => {
        inputCar.value = { ...initialCar, ...data };
        isOpenInput.value = true;
      });

      // Выводим уведомление если ранее оплачивал
      socket.on(`payedToday-${newOperator}`, async (data) => {
        success("Ворота открываются", "ID: " + data.id + " ранее оплачивал");
      });

      socket.on(`outputCar-${newOperator}`, async (data) => {
        outputCar.value = data;
        isOpenOutput.value = true;
      });
    }
  });

  socket.on("newSession", async (info) => {
    try {
      sessionStore.addSession(info);
      inputCar.value = { ...initialCar };
    } catch (error) {
      console.error(error);
    }
  });

  onMounted(async () => {
    socket.connect();
    isSocketConnected.value = true;

    socket.on("connect", () => {
      isSocketConnected.value = true;
    });

    socket.on("disconnect", () => {
      isSocketConnected.value = false;
    });

    getAllSession();
    selectedOperator.value = await window.api.getSelectedOperator();

    window.api.onMessage("add-camera", openModalHandler);
    window.api.onMessage("selected-operator", (operator) => {
      selectedOperator.value = operator;
    });
  });
</script>

<template>
  <div class="wrapper">
    <SubTitle class="flex justify-between">
      Оператор {{ selectedOperator }}
      <div class="socket-wrapper">
        <div
          class="socket-status"
          :class="{ connected: isSocketConnected, disconnected: !isSocketConnected }"
        ></div>
        {{ isSocketConnected ? "Подключен" : "Отключен" }}
      </div>
    </SubTitle>
    <div class="flex gap-4">
      <Button @click="openDrawer" class="flex w-full flex-col items-center gap-2">
        <Icon icon="material-symbols:input-circle" class="text-7xl" />
        Новый въезд
      </Button>
      <Button
        variant="success"
        @click="openDrawerOutput"
        class="flex w-full flex-col items-center gap-2"
      >
        <Icon icon="material-symbols:output-circle" class="text-7xl" />
        Новый выезд
      </Button>
    </div>

    <InputDrawer
      v-model="isOpenInput"
      v-model:newCar="inputCar"
      v-model:operator="selectedOperator"
    />
    <OutputDrawer v-model="isOpenOutput" v-model:newCar="outputCar" />

    <Sessions />
  </div>

  <ToastContainer />

  <AddCamera v-model:open="addCam.open" :id="addCam.id" />
</template>
<style scoped>
  @reference "@/assets/main.css";

  .wrapper {
    @apply overflow-hidden p-4;
  }

  .container {
    @apply rounded-lg bg-white p-4 shadow-md;
  }

  .price {
    @apply grid grid-cols-1 gap-2;
  }

  .row {
    @apply flex items-center justify-between gap-2 rounded-md bg-blue-100 p-4;
  }

  .rows {
    @apply flex flex-col gap-4;
  }

  .socket-status {
    @apply h-3 w-3 rounded-full text-center;
  }

  .socket-wrapper {
    @apply flex items-center gap-2 text-base font-medium;
  }
  .connected {
    @apply bg-green-500 text-white;
  }

  .disconnected {
    @apply bg-red-500 text-white;
  }
</style>
