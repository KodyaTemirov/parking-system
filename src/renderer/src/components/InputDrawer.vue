<script setup>
  import { useToast } from "@/composables";
  import axios from "axios";
  import { ipServer } from "@/config";
  import { ref, watch, onMounted } from "vue";
  import { tariffs } from "@/config";

  import { useAppStore } from "@/store";

  const { success, error: showError } = useToast();

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

  const appStore = useAppStore();

  const emit = defineEmits(["update:modelValue", "update:newCar", "update:operator"]);

  const isOpen = ref(props.modelValue);

  const cameras = ref([]);
  const selectCam = ref(null);
  const checkId = ref("");

  const localNewCar = ref({ ...props.newCar });

  watch(
    () => props.modelValue,
    (newValue) => {
      isOpen.value = newValue;
    }
  );

  watch(
    () => props.newCar,
    (newValue) => {
      localNewCar.value = { ...newValue };
    },
    { immediate: true }
  );

  watch(isOpen, (newValue) => {
    emit("update:modelValue", newValue);
  });

  const getCheckData = async () => {
    if (!checkId.value) {
      showError("Ошибка", "Введите номер чека");
      return;
    }

    try {
      const { data } = await axios.get(
        `${ipServer}/api/input/${checkId.value}?cameraIp=${selectCam.value}`
      );

      if (data.eventName === "input") {
        showError("Ошибка", "Чек просрочен");
        return;
      } else if (data.eventName === "payedToday") isOpen.value = false;

      // Обновляем локальную копию и отправляем изменения в родительский компонент
      localNewCar.value = {
        ...data.session,
        price: data.price,
      };
      emit("update:newCar", localNewCar.value);
    } catch (err) {
      console.error(err);
      showError("Ошибка", "Не удалось найти данные по чеку");
    }
  };

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
        cameraIp: cameraIp || selectCam.value,
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
      selectCam.value = data[0] && data[0].ip;
    } catch (error) {
      console.error(error);
    }
  };

  watch(
    () => appStore.selectedOperator,
    (newValue) => {
      getCams(newValue);
    }
  );

  onMounted(() => {
    getCams(appStore.selectedOperator);
  });
</script>

<template>
  <Drawer title="Новый въезд" v-model="isOpen" position="left">
    <div class="drawer-content">
      <div class="rows">
        <div class="row" v-if="newCar.number">
          <span>Гос-номер:</span>
          <span class="flex items-center">
            <CarPlate :plateNumber="newCar.number" />
          </span>
        </div>
      </div>

      <form v-if="!newCar.number" @submit.prevent="getCheckData" class="flex gap-2">
        <Input placeholder="Введите номер чека" v-model="checkId" />
        <Button type="submit">Найти</Button>
      </form>

      <SubTitle>Выберите тип тарифа</SubTitle>
      <Plans v-model="newCar.tariffType" />
      <SubTitle>Выберите метод оплаты</SubTitle>
      <PaymentSelector v-model="newCar.paymentMethod" />
      <div v-if="!newCar.number">
        <SubTitle>Выберите камеру</SubTitle>
        <div class="camera-selector">
          <div
            v-for="camera in cameras"
            :key="camera.ip"
            class="camera-card"
            @click="selectCam = camera.ip"
            :class="{ selected: selectCam === camera.ip }"
          >
            <h3>{{ camera.name }}</h3>
          </div>
        </div>
      </div>

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
          {{ tariffs[newCar.tariffType - 1].price }} сум
        </span>
      </SubTitle>
      <Button @click="addSessionHandler" class="flex w-full items-center justify-center gap-2">
        <Icon icon="material-symbols:input-circle" />
        Открыть ворота
      </Button>
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

  .camera-selector {
    @apply grid grid-cols-2 gap-4;
  }

  .camera-card {
    transition: background-color 0.3s;

    @apply w-full cursor-pointer rounded-lg border-2 border-gray-200 p-4 transition-all ease-in-out hover:border-gray-200 hover:bg-gray-200;
  }

  .camera-card.selected {
    @apply border-blue-600 hover:bg-white;
  }
</style>
