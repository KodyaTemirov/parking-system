<script setup>
  import axios from "axios";
  import { ipServer } from "@/config";
  import { useSessionsStore } from "@/store/SessionsStore";
  import { pricesData, socket, calculateDuration } from "@/helpers";
  import { onMounted } from "vue";
  const sessionStore = useSessionsStore();

  socket.on("newSession", async (info) => {
    try {
      sessionStore.addSession(info);
    } catch (error) {
      console.error(error);
    }
  });

  const getAllSession = async () => {
    try {
      const { data } = await axios.get(`${ipServer}/api/session`);
      sessionStore.setSessions(data.data);
    } catch (error) {
      console.log(error, "ERRROR");
    }
  };

  onMounted(() => {
    getAllSession();
  });
</script>

<template>
  <SubTitle>Парковочные сессии {{ sessionStore.sessions.length }}</SubTitle>
  <table
    class="min-w-full overflow-hidden rounded-lg border border-gray-200 bg-white"
    v-if="sessionStore.sessions.length"
  >
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
        <td class="px-4 py-2">{{ pricesData[session.tariffType - 1]?.value }}</td>
        <td class="px-4 py-2">{{ calculateDuration(session.startTime, session.endTime) }}</td>
        <td class="px-4 py-2">{{ session.cost }} сум</td>
        <td class="px-4 py-2">{{ session.paymentMethod === 1 ? "Наличные" : "Карта" }}</td>
        <td class="px-4 py-2">{{ !session.endTime ? "Внутри" : "Выехал" }}</td>
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
