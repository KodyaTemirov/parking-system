<script setup>
  import axios from "axios";
  import { ipServer } from "@/config";
  import { useSessionsStore } from "@/store/SessionsStore";
  import { socket, calculateDuration } from "@/helpers";
  import { tariffs } from "@/config";

  import { onMounted, ref, watch } from "vue";

  const sessionStore = useSessionsStore();
  const page = ref(1);
  const size = ref(10);
  const observer = ref(null);
  const searchQuery = ref("");
  const searchPage = ref(1);
  const searchObserver = ref(null);

  socket.on("newSession", async (info) => {
    try {
      sessionStore.addSession(info);
    } catch (error) {
      console.error(error);
    }
  });

  const getAllSession = async () => {
    if (sessionStore.totalPages !== 0 && page.value > sessionStore.totalPages) return;
    try {
      const { data } = await axios.get(`${ipServer}/api/session`, {
        params: { page: page.value, size: size.value },
      });
      sessionStore.setSessions([...sessionStore.sessions, ...data.data]);
      sessionStore.total = data.total;
      sessionStore.totalPages = data.totalPages;
      page.value++;
    } catch (error) {
      console.log(error, "ERROR");
    }
  };

  const loadMoreSearchResults = async () => {
    if (!searchQuery.value) return;

    if (searchPage.value > sessionStore.totalPages) return;
    try {
      const { data } = await axios.get(`${ipServer}/api/session`, {
        params: { search: searchQuery.value, page: searchPage.value, size: size.value },
      });

      const newSessions = data.data.filter(
        (s) => !sessionStore.sessions.some((existing) => existing.id === s.id)
      );
      sessionStore.setSessions([...sessionStore.sessions, ...newSessions]);
      searchPage.value++;
    } catch (error) {
      console.log(error, "ERROR");
    }
  };

  const searchSessions = async () => {
    searchPage.value = 1; // Сбрасываем страницу поиска при новом запросе

    if (!searchQuery.value) {
      page.value = 1;
      setupObserver(); // Включаем основной Observer после очистки поиска
      return;
    }

    try {
      observer.value?.disconnect(); // Отключаем обычный Observer

      const { data } = await axios.get(`${ipServer}/api/session`, {
        params: { search: searchQuery.value, page: searchPage.value, size: size.value },
      });
      sessionStore.setSessions(data.data);
      sessionStore.total = data.total;
      sessionStore.totalPages = data.totalPages;
      searchPage.value++;
      setupSearchObserver(); // Включаем Observer для поиска
    } catch (error) {
      console.log(error, "ERROR");
    }
  };

  const setupObserver = () => {
    if (observer.value) observer.value.disconnect();

    observer.value = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        getAllSession();
      }
    });

    observer.value.observe(document.querySelector("#load-more"));
  };

  const setupSearchObserver = () => {
    if (searchObserver.value) searchObserver.value.disconnect();

    searchObserver.value = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        loadMoreSearchResults();
      }
    });

    searchObserver.value.observe(document.querySelector("#load-more"));
  };

  onMounted(() => {
    getAllSession();
    setupObserver();
  });

  watch(searchQuery, (newVal) => {
    if (!newVal) {
      setupObserver(); // Если поисковый запрос очистился — включаем обычный Observer
    }
  });
</script>

<template>
  <SubTitle class="flex items-center justify-between">
    Парковочные сессии {{ sessionStore.sessions.length }}

    <input
      v-model="searchQuery"
      @input="searchSessions"
      placeholder="Поиск по гос-номеру..."
      class="mb-4 rounded border border-gray-300 p-2"
    />
  </SubTitle>
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
        <td class="px-4 py-2">{{ tariffs[session.tariffType - 1]?.value }}</td>
        <td class="px-4 py-2">{{ calculateDuration(session.startTime, session.endTime) }}</td>
        <td class="px-4 py-2">{{ session.cost }} сум</td>
        <td class="px-4 py-2">{{ session.paymentMethod === 1 ? "Наличные" : "Карта" }}</td>
        <td class="px-4 py-2">{{ !session.endTime ? "Внутри" : "Выехал" }}</td>
      </tr>
    </tbody>
  </table>
  <div v-else>Сессий нет</div>
  <div id="load-more" class="h-10"></div>
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
