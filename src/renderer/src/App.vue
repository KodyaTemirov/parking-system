<script setup>
  import { onMounted, ref, watch } from "vue";
  import { socket } from "@/helpers";
  import { useSessionsStore } from "@/store";
  import axios from "axios";

  const sessionStore = useSessionsStore();
  const currentTariff = ref();
  const initialCar = { paymentMethod: 1, tariffType: 1, eventName: "output" };
  const newCar = ref({ ...initialCar });
  const selectedOperator = ref(null);
  const backendURL = "http://10.20.11.150:9061";
  const isOpenInput = ref(false);
  const isOpenOutput = ref(false);

  const addCam = ref({ open: false, id: null });

  const openModalHandler = (id) => {
    addCam.value = { open: true, id };
  };

  const addSessionHandler = async () => {
    const { number, plateImage, fullImage, eventName, paymentMethod, tariffType, cameraIp } =
      newCar.value;

    await axios.post(`${backendURL}/api/register-session`, {
      number,
      plateImage,
      fullImage,
      eventName: eventName || "input",
      paymentMethod,
      tariffType: tariffType || 1,
      cameraIp,
    });

    isOpenInput.value = false;
  };

  const openDrawer = () => {
    isOpenInput.value = true;
    newCar.value = { ...initialCar };
  };

  const openDrawerOutput = () => {
    isOpenOutput.value = true;
  };

  const getAllSession = async () => {
    try {
      const { data } = await axios.get(`${backendURL}/api/session`);
      sessionStore.setSessions(data.data);
    } catch (error) {
      console.log(error, "ERRROR");
    }
  };

  watch(selectedOperator, (newOperator, oldOperator) => {
    if (oldOperator) {
      socket.off(`inputCar-${oldOperator}`);
      socket.off(`outputCar-${oldOperator}`);
    }

    if (newOperator) {
      socket.connect();
      socket.on(`inputCar-${newOperator}`, async (data) => {
        console.log("inputCar", data);
        newCar.value = { ...initialCar, ...data };
        isOpenInput.value = true;
      });
      socket.on(`outputCar-${newOperator}`, async (data) => {
        newCar.value = data;
        isOpenOutput.value = true;
      });
    }
  });

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
    window.api.send("request-selected-operator");

    window.api.onMessage("add-camera", openModalHandler);
    window.api.onMessage("selected-operator", (operator) => {
      selectedOperator.value = operator;
    });
  });
</script>

<template>
  <div class="wrapper">
    <div class="sub-title">Оператор</div>
    {{ selectedOperator }}
    <div class="flex gap-4">
      <Button @click="openDrawer" class="flex items-center gap-2">
        <Icon icon="material-symbols:input-circle" />
        Новый въезд
      </Button>
      <Button @click="openDrawerOutput" class="flex items-center gap-2">
        <Icon icon="material-symbols:output-circle" />
        Новый выезд
      </Button>
    </div>

    <Drawer title="Новый въезд" ref="drawerRef" v-model="isOpenInput" position="left">
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

      <div class="sub-title">Снимок с камеры:</div>

      <img :src="newCar.fullImage" alt="" />

      <Button @click="addSessionHandler" class="my-4 w-full">Открыть ворота</Button>
    </Drawer>

    <Drawer title="Новый выезд" ref="drawerRef" v-model="isOpenOutput" position="right">
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
