<script setup>
  import { useToast } from "@/composables";
  import axios from "axios";
  import { ipServer } from "@/config";
  import { ref, watch, onMounted } from "vue";
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
    operator: {
      type: Object,
      required: true,
    },
  });

  const emit = defineEmits(["update:modelValue", "update:newCar", "update:operator"]);

  const isOpen = ref(props.modelValue);
  const cameras = ref([]);
  const selectCam = ref(null);

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

  const getCams = async (operator) => {
    try {
      const { data } = await axios.get(`${ipServer}/api/camera/operators/${operator}`);
      cameras.value = data;
      console.log("console", cameras.value[0]);
    } catch (error) {
      console.error(error);
    }
  };

  watch(
    () => props.operator,
    (newValue) => {
      getCams(newValue);
    }
  );

  onMounted(() => {
    getCams(props.operator);
  });

  watch(
    () => selectCam.value,
    (newValue) => {
      console.log("selectCam", newValue);
    }
  );
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
      <div v-if="!newCar.number">
        <SubTitle>Выберите камеру</SubTitle>
        <div class="flex flex-col gap-4">
          <select name="" id="" v-model="selectCam">
            <option v-for="camera in cameras" :key="camera.id" :value="camera.id">
              {{ camera.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- <Accordion class="mt-4" title="Дополнительная информация">
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
      </Accordion> -->
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
