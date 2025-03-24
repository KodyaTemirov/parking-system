<script setup>
import { useToast } from "../composables/useToast";
import axios from "axios";
import { ipServer } from "@/config";
import SubTitle from "./SubTitle.vue";
import Button from "./Button.vue";
import CarPlate from "./CarPlate.vue";
import Plans from "./Plans.vue";
import PaymentSelector from "./PaymentSelector.vue";
import { ref, watch } from "vue";

const { success } = useToast();

const props = defineProps({
    modelValue: {
        type: Boolean,
        required: true
    },
    newCar: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['update:modelValue', 'update:newCar']);

const isOpen = ref(props.modelValue);

watch(() => props.modelValue, (newValue) => {
    isOpen.value = newValue;
});

watch(isOpen, (newValue) => {
    emit('update:modelValue', newValue);
});

const addSessionHandler = async () => {
    const { number, plateImage, fullImage, eventName, paymentMethod, tariffType, cameraIp, price } = props.newCar;

    try {
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
        success("Успех!", "Операция выполнена успешно");
        isOpen.value = false;
    } catch (error) {
        console.error(error);
    }
};
</script>

<template>
    <Drawer title="Новый выезд" v-model="isOpen" position="right">
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
        <SubTitle>Стоимость простоя: {{ newCar.price }}</SubTitle>

        <Button @click="addSessionHandler" class="my-4 w-full">Открыть ворота</Button>
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
</style>