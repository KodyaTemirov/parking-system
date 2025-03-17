<script setup>
  import { useSessionsStore } from "@/store/SessionsStore";
  import prices from "../helpers/prices";

  const sessionStore = useSessionsStore();

  const calculateDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();

    if (end < start) return "0м 0с";

    const durationMs = end - start;
    const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${days > 0 ? `${days}д ` : ""}${hours > 0 ? `${hours}ч ` : ""}${minutes > 0 ? `${minutes}м` : "Только что"}`;
  };
</script>

<template>
  <h1 class="my-4 text-2xl font-bold">Парковочные сессии {{ sessionStore.sessions.length }}</h1>
  <table class="min-w-full border border-gray-300 bg-white" v-if="sessionStore.sessions.length">
    <thead>
      <tr class="bg-gray-200 text-left">
        <th class="px-4 py-2">#</th>
        <th class="px-4 py-2">Гос-номер</th>
        <th class="px-4 py-2">Начало</th>
        <th class="px-4 py-2">Тип тарифа</th>
        <th class="px-4 py-2">Продолжительность</th>
        <th class="px-4 py-2">Стоимость</th>
        <th class="px-4 py-2">Метод оплаты</th>
        <th class="px-4 py-2">Статус</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="session in sessionStore.sessions"
        :key="session.id"
        class="border-b hover:bg-gray-100"
      >
        <td class="px-4 py-2">{{ session.id }}</td>
        <td class="px-4 py-2">{{ session.plateNumber }}</td>
        <td class="px-4 py-2">{{ new Date(session.startTime).toLocaleString() }}</td>
        <td class="px-4 py-2">{{ prices[session.tariffType - 1]?.value }}</td>
        <td class="px-4 py-2">{{ calculateDuration(session.startTime, session.endTime) }}</td>
        <td class="px-4 py-2">{{ session.cost }} сум</td>
        <td class="px-4 py-2">{{ session.paymentMethod === 1 ? "Наличные" : "Карта" }}</td>
        <td class="px-4 py-2">{{ session.event === "inputCar" ? "Въезд" : "Выезд" }}</td>
      </tr>
    </tbody>
  </table>
  <div v-else>Сессий нет</div>
</template>

<style scoped>
  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    text-align: left;
    padding: 8px;
  }
</style>
