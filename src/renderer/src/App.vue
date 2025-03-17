<script setup lang="ts">
  import { onMounted, reactive, ref, watch } from "vue";
  import Sessions from "./components/Sessions.vue";
  import Button from "./components/Button.vue";
  import Drawer from "./components/Drawer.vue";
  import CarPlate from "./components/CarPlate.vue";
  import Plans from "./components/Plans.vue";
  import PaymentSelector from "./components/PaymentSelector.vue";

  import { Icon } from "@iconify/vue";

  import { useSessionsStore } from "@/store/SessionsStore";

  const sessionStore = useSessionsStore();
  const currentTariff = ref();
  const initialCar = {
    paymentMethod: 1,
    tariffType: 1,
  };
  const newCar = ref({
    ...initialCar,
  });

  //Событие Вход
  window.api.onMessage("inputCar", (data) => {
    try {
      newCar.value = data;
      isOpen.value = true;
    } catch (error) {
      console.log("error при добавлении", error);
    }
  });

  // Событие Выход
  window.api.onMessage("outputCar", (data) => {
    newCar.value = { ...newCar.value, ...data };
    isOpen.value = true;
    console.log("outputCar", data);
  });

  const addSessionHandler = () => {
    const { number, plateImage, fullImage, eventName, paymentMethod, tariffType } = newCar.value;
    window.api.send("new-session", {
      number,
      plateImage,
      fullImage,
      eventName,
      paymentMethod,
      tariffType: tariffType || 1,
    });

    window.api.onMessage("new-session", (data) => {
      sessionStore.addSession(data);
      newCar.value = {
        ...initialCar,
      };
    });

    isOpen.value = false;
  };

  const isOpen = ref(false);
  const openDrawer = () => {
    isOpen.value = true;
    newCar.value = {
      ...initialCar,
    };
  };

  const selectPaymentMethod = (id) => {
    newCar.value = { ...newCar.value, paymentMethod: id };
  };

  const getAllSession = () => {
    window.api.send("getSessions");
    window.api.onMessage("getSessions", (sessions) => {
      sessionStore.setSessions(sessions);
    });
  };
  onMounted(() => {
    getAllSession();
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

      <Button @click="addSessionHandler" class="my-4 w-full">Открыть ворота</Button>
    </Drawer>
    <Sessions />
  </div>
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
