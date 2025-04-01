<script setup>
  import { onMounted, ref, watch } from "vue";
  import { socket } from "@/helpers";
  import { useSessionsStore, useAppStore } from "@/store";
  import axios from "axios";
  import { ipServer } from "@/config";
  import { useToast } from "@/composables";
  const { success, error } = useToast();

  const sessionStore = useSessionsStore();
  const appStore = useAppStore();

  const currentTariff = ref();
  const initialCar = { paymentMethod: 1, tariffType: 1, eventName: "output" };
  const inputCar = ref({ ...initialCar });
  const outputCar = ref({ ...initialCar });
  const stats = ref({});
  const isOpenInput = ref(false);
  const isOpenOutput = ref(false);

  const isSocketConnected = ref(false);

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
    outputCar.value = { ...initialCar };
  };

  const socketsConnect = (operator) => {
    if (!operator) return;
    socket.on(`inputCar-${operator}`, async (data) => {
      inputCar.value = { ...initialCar, ...data };
      isOpenInput.value = true;
    });

    // Выводим уведомление если ранее оплачивал
    socket.on(`notification-${operator}`, async (data) => {
      if (data.type === "error") {
        error("Ошибка", data.message);
      } else if (data.type === "success") {
        success("Успешно", data.message);
      }
    });

    socket.on(`outputCar-${operator}`, async (data) => {
      outputCar.value = data;
      isOpenOutput.value = true;
    });
  };

  const socketOff = (operator) => {
    socket.off(`inputCar-${operator}`);
    socket.off(`outputCar-${operator}`);
    socket.off(`notification-${operator}`);
  };

  watch(
    () => appStore.selectedOperator,
    (newValue, oldValue) => {
      if (newValue) {
        socketsConnect(newValue);
        socketOff(oldValue);
      }
    }
  );

  const getAllInfo = async () => {
    try {
      const { data } = await axios.get(`${ipServer}/api/session/info`);

      stats.value = data;
    } catch (error) {
      console.error(error);
    }
  };

  onMounted(async () => {
    socket.connect();
    isSocketConnected.value = true;

    getAllInfo();

    socket.on("parkStats", (data) => {
      stats.value = data;
    });
    socket.on("connect", () => {
      isSocketConnected.value = true;
    });

    socket.on("disconnect", () => {
      isSocketConnected.value = false;
    });

    appStore.initSelectOperator();
  });
</script>

<template>
  <div class="wrapper">
    <SubTitle class="flex justify-between">
      Operator {{ appStore.selectedOperator }}
      <div class="socket-wrapper">
        <div
          class="socket-status"
          :class="{ connected: isSocketConnected, disconnected: !isSocketConnected }"
        ></div>
        {{ isSocketConnected ? "Connected" : "Disconnected" }}
      </div>
    </SubTitle>
    <div class="flex gap-4">
      <Button @click="openDrawer" class="flex w-full flex-col items-center gap-2">
        <Icon icon="material-symbols:input-circle" class="text-7xl" />
        Kirish
      </Button>
      <Button
        variant="success"
        @click="openDrawerOutput"
        class="flex w-full flex-col items-center gap-2"
      >
        <Icon icon="material-symbols:output-circle" class="text-7xl" />
        Chiqish
      </Button>
    </div>

    <SubTitle class="flex justify-between">Bugungi statistika</SubTitle>

    <div class="stats">
      <div class="statCard">
        Sessiyalar soni
        <div class="statCount">
          {{ stats.allData }}
        </div>
      </div>
      <div class="statCard">
        Umumiy to'lov
        <div class="statCount">
          {{ stats.totalCostToday }}
        </div>
      </div>
      <div class="statCard">
        Chiqishlar soni
        <div class="statCount">
          {{ stats.outputData }}
        </div>
      </div>
      <div class="statCard">
        Ichkaridagilar soni
        <div class="statCount">
          {{ stats.totalCarInPark }}
        </div>
      </div>
    </div>

    <InputDrawer v-model="isOpenInput" v-model:newCar="inputCar" />
    <OutputDrawer v-model="isOpenOutput" v-model:newCar="outputCar" />

    <Sessions />
  </div>

  <ToastContainer />

  <AddCamera />
</template>
<style scoped>
  @reference "@/assets/main.css";
  .stats {
    @apply mt-4 grid grid-cols-4 gap-4;
  }
  .statCard {
    @apply w-full rounded-lg bg-white p-4 text-sm text-gray-400 shadow-md;
  }

  .statCount {
    @apply text-2xl font-semibold text-gray-600;
  }

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
