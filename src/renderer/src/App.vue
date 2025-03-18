<script setup lang="ts">
  import { onMounted, reactive, ref, watch } from "vue";
  import Sessions from "./components/Sessions.vue";
  import Button from "./components/Button.vue";
  import Drawer from "./components/Drawer.vue";
  import CarPlate from "./components/CarPlate.vue";
  import Plans from "./components/Plans.vue";
  import PaymentSelector from "./components/PaymentSelector.vue";
  import AddCamera from "./components/AddCamera.vue";

  import socket from "./helpers/socket.js";
  import { useSessionsStore } from "@/store/SessionsStore";
  import axios from "axios";

  const sessionStore = useSessionsStore();
  const currentTariff = ref();
  const initialCar = { paymentMethod: 1, tariffType: 1, eventName: "output" };
  const newCar = ref({ ...initialCar });

  const backendURL = "http://10.20.10.157:9061";
  const isOpen = ref(false);

  const addCam = ref({
    open: false,
    id: null,
  });

  const openModalHandler = (id) => {
    addCam.value = { open: true, id };
  };

  socket.on("inputCar", async (data) => {
    try {
      console.log(data);

      newCar.value = data;
      // isOpen.value = true;
    } catch (error) {
      console.log("error при добавлении", error);
    }
  });

  socket.on("outputCar", async (data) => {
    try {
      newCar.value = { ...newCar.value, ...data };
      isOpen.value = true;
      console.log("outputCar", data);
    } catch (error) {
      console.log("error при добавлении", error);
    }
  });

  const addSessionHandler = async () => {
    const { number, plateImage, fullImage, eventName, paymentMethod, tariffType, cameraIp } =
      newCar.value;

    console.log("newCar.value", newCar.value);

    await axios.post(`${backendURL}/api/register-session`, {
      number,
      plateImage,
      fullImage,
      eventName: eventName || "input",
      paymentMethod,
      tariffType: tariffType || 1,
      cameraIp,
    });

    isOpen.value = false;
  };

  const openDrawer = () => {
    isOpen.value = true;
    newCar.value = { ...initialCar };
  };

  const selectPaymentMethod = (id) => {
    newCar.value = { ...newCar.value, paymentMethod: id };
  };

  const getAllSession = async () => {
    try {
      const { data } = await axios.get(`${backendURL}/api/session`);

      sessionStore.setSessions(data);
    } catch (error) {
      console.log(error, "ERRROR");
    }
  };

  socket.on("newSession", async (info) => {
    try {
      sessionStore.addSession(info);
      newCar.value = { ...initialCar };
    } catch (error) {
      console.error(error);
    }
  });

  onMounted(() => {
    socket.connect();
    getAllSession();

    window.api.onMessage("add-camera", openModalHandler);
  });

  watch(
    () => currentTariff.value,
    (newValue) => {
      console.log("newValue", newValue);
    }
  );
</script>

<template>
  <div class="wrapper">
    <Button @click="openDrawer">Новая сессия</Button>
    <Drawer title="Новая сессия" ref="drawerRef" v-model="isOpen">
      <div class="rows">
        <div class="row">
          <span>Гос-номер:</span>
          <span class="flex items-center">
            <CarPlate :plateNumber="newCar.number" />
          </span>
        </div>
      </div>

      <div class="sub-title">Выберите тип тарифа</div>
      <Plans v-model="newCar.tariffType" />
      <div class="sub-title">Выберите метод оплаты</div>
      <PaymentSelector v-model="newCar.paymentMethod" />
      <div class="sub-title">IP камеры: {{ newCar.cameraIp }}</div>

      <Button @click="addSessionHandler" class="my-4 w-full">Открыть ворота</Button>
    </Drawer>
    <Sessions />
  </div>
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
  .sub-title {
    @apply my-4 text-lg font-semibold;
  }
</style>
