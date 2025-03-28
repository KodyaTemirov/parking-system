<script setup>
  import { useToast } from "../composables/useToast";
  import axios from "axios";
  import { ipServer } from "@/config";
  import { ref, watch, onMounted } from "vue";
  import { tariffs } from "@/config";

  import { useAppStore } from "@/store";
  const { success, error: showError } = useToast();
  const appStore = useAppStore();
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

  const cameras = ref([]);
  const selectCam = ref(null);
  const checkId = ref("");

  const emit = defineEmits(["update:modelValue", "update:newCar"]);
  const isOpen = ref(props.modelValue);

  // Создаем локальную копию newCar
  const localNewCar = ref({ ...props.newCar });

  watch(
    () => props.newCar,
    (newValue) => {
      localNewCar.value = { ...newValue };
    },
    { immediate: true }
  );

  const getCams = async (operator) => {
    try {
      const { data } = await axios.get(`${ipServer}/api/camera/operators/${operator}`);
      cameras.value = data;
      selectCam.value = data.length > 0 ? data[0].ip : null;
    } catch (err) {
      console.error(err);
      showError("Ошибка", "Не удалось загрузить камеры");
    }
  };

  watch(
    () => appStore.selectedOperator,
    (newValue) => {
      if (newValue) getCams(newValue);
    }
  );

  watch(
    () => props.modelValue,
    (newValue) => {
      isOpen.value = newValue;
    }
  );

  watch(isOpen, (newValue) => {
    emit("update:modelValue", newValue);
    checkId.value = "";
  });

  const addSessionHandler = async () => {
    const { number, plateImage, fullImage, paymentMethod, tariffType, price, id } =
      localNewCar.value;

    if (!price) {
      showError("Ошибка", "Заполните все обязательные поля");
      return;
    }

    try {
      await axios.post(`${ipServer}/api/output-session`, {
        number,
        plateImage,
        fullImage,
        paymentMethod,
        tariffType: tariffType || 1,
        cameraIp: selectCam.value,
        outputCost: price,
        id: id || null,
      });

      console.log("localNewCar.value", localNewCar.value);

      success("Успех!", "Операция выполнена успешно");
      isOpen.value = false;
    } catch (err) {
      console.error(err);
      showError("Ошибка", "Не удалось завершить операцию");
    }
  };

  const getCheckData = async () => {
    if (!checkId.value) {
      showError("Ошибка", "Введите номер чека");
      return;
    }

    try {
      const { data } = await axios.get(
        `${ipServer}/api/output/${checkId.value}?cameraIp=${selectCam.value}`
      );

      if (data.eventName === "payedToday") isOpen.value = false;

      if (data) {
        console.log("data", data);
        localNewCar.value = {
          ...data.session,
          price: data.price,
        };
      }
      // Обновляем локальную копию и отправляем изменения в родительский компонент

      emit("update:newCar", localNewCar.value);
    } catch (err) {
      console.error(err);
      showError("Ошибка", "Не удалось найти данные по чеку");
    }
  };

  watch(selectCam, (newValue) => {
    if (newValue && checkId.value) getCheckData();
  });

  onMounted(() => {
    getCams(appStore.selectedOperator);
  });
</script>

<template>
  <Drawer title="Новый выезд" v-model="isOpen" position="right">
    <div class="rows">
      <div class="row" v-if="localNewCar.number">
        <span>Гос-номер:</span>
        <span class="flex items-center">
          <CarPlate :plateNumber="localNewCar.number" />
        </span>
      </div>
      <div v-else>
        <form @submit.prevent="getCheckData" class="flex gap-2">
          <Input placeholder="Введите номер чека" v-model="checkId" />
          <Button type="submit">Найти</Button>
        </form>
      </div>
    </div>

    <div v-if="!localNewCar.number">
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

    <SubTitle>
      Выбранный тариф:
      {{ localNewCar.session && tariffs[localNewCar.session.tariffType - 1]?.value }}
    </SubTitle>
    <SubTitle>Выберите метод оплаты</SubTitle>
    <PaymentSelector v-model="localNewCar.paymentMethod" />

    <div class="fixed-button">
      <SubTitle>Чек: {{ localNewCar.id }}</SubTitle>
      <SubTitle class="flex justify-between">
        Итого к оплате:
        <span class="text-2xl font-bold text-black">{{ localNewCar.price }} сум</span>
      </SubTitle>
      <Button
        @click="addSessionHandler"
        variant="success"
        class="flex w-full items-center justify-center gap-2"
      >
        <Icon icon="material-symbols:output-circle" />

        Открыть ворота
      </Button>
    </div>
  </Drawer>
</template>

<style scoped>
  @reference "@/assets/main.css";

  .rows {
    @apply flex flex-col gap-4;
  }

  .row {
    @apply flex items-center justify-between gap-2 rounded-md bg-blue-100 p-4;
  }

  .sub-title {
    @apply my-4 text-lg font-semibold;
  }
  .fixed-button {
    @apply fixed right-0 bottom-0 left-0 border-t-2 border-gray-200 bg-white px-4 pb-4;
  }

  .camera-card {
    @apply cursor-pointer rounded-lg border-2 border-gray-200 p-4 text-center;
  }
  .camera-selector {
    @apply grid grid-cols-2 gap-4;
  }
  .camera-card.selected {
    @apply border-blue-500 bg-blue-100;
  }
</style>
