<script setup>
  import { useToast } from "../composables/useToast";
  import axios from "axios";
  import { ipServer } from "@/config";
  import SubTitle from "./SubTitle.vue";
  import Button from "./Button.vue";
  import CarPlate from "./CarPlate.vue";
  import Plans from "./Plans.vue";
  import PaymentSelector from "./PaymentSelector.vue";
  import Accordion from "./Accordion.vue";
  import { ref, watch } from "vue";
  import { pricesData } from "@/helpers";

  const { success } = useToast();

  const props = defineProps({
    modelValue: {
      type: Boolean,
      required: true,
    },
    newCar: {
      type: Object,
      required: true,
    },
  });

  const emit = defineEmits(["update:modelValue", "update:newCar"]);

  const isOpen = ref(props.modelValue);

  watch(
    () => props.modelValue,
    (newValue) => {
      isOpen.value = newValue;
    }
  );

  watch(isOpen, (newValue) => {
    emit("update:modelValue", newValue);
  });

  const addSessionHandler = async () => {
    const { number, plateImage, fullImage, eventName, paymentMethod, tariffType, cameraIp } =
      props.newCar;

    try {
      await axios.post(`${ipServer}/api/register-session`, {
        number,
        plateImage,
        fullImage,
        eventName: eventName || "input",
        paymentMethod,
        tariffType: tariffType || 1,
        cameraIp,
      });

      isOpen.value = false;
    } catch (error) {
      console.error(error);
    }
  };
</script>

<template>
  <Drawer title="Новый въезд" v-model="isOpen" position="left">
    <div class="drawer-content">
      <div class="rows">
        <div class="row">
          <span>Гос-номер:</span>
          <span class="flex items-center">
            <CarPlate :plateNumber="newCar.number" />
          </span>
        </div>
      </div>

      <SubTitle>Выберите тип тарифа</SubTitle>
      <Plans v-model="newCar.tariffType" />
      <SubTitle>Выберите метод оплаты</SubTitle>
      <PaymentSelector v-model="newCar.paymentMethod" />

      <Accordion class="mt-4" title="Дополнительная информация">
        <div class="flex flex-col gap-4">
          <img :src="newCar.fullImage" alt="" class="w-full rounded-lg" />
          <img :src="newCar.plateImage" alt="" class="w-full rounded-lg" />
        </div>

        <SubTitle>
          IP камеры:
          <span class="text-sm font-medium text-black">{{ newCar.cameraIp }}</span>
        </SubTitle>
        <SubTitle>
          Событие:

          <span class="text-sm font-medium text-black">
            {{ newCar.eventName ? "Въезд" : "Выезд" }}
          </span>
        </SubTitle>
        <SubTitle>
          Оператор:

          <span class="text-sm font-medium text-black">
            {{ newCar.operatorId }}
          </span>
        </SubTitle>
      </Accordion>
    </div>

    <div class="fixed-button">
      <SubTitle class="flex justify-between">
        Итого к оплате:
        <span class="text-2xl font-bold text-black">
          {{ pricesData[newCar.tariffType - 1].price }} сум
        </span>
      </SubTitle>
      <Button @click="addSessionHandler" class="w-full">Открыть ворота</Button>
    </div>
  </Drawer>
</template>

<style scoped>
  @reference "@/assets/main.css";

  .drawer-content {
    @apply w-full pb-24;
  }

  .rows {
    @apply flex flex-col gap-4;
  }

  .row {
    @apply flex items-center justify-between gap-2 rounded-md bg-blue-100 p-4;
  }

  .fixed-button {
    @apply fixed right-0 bottom-0 left-0 border-t-2 border-gray-200 bg-white px-4 pb-4;
  }
</style>
