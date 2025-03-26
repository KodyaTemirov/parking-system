import { defineStore } from "pinia";
import { ref } from "vue";

export const useSessionsStore = defineStore("sessionStore", () => {
  const sessions = ref([]);
  const total = ref(0);
  const totalPages = ref(0);

  const addSession = (session) => {
    sessions.value = [session, ...sessions.value];
  };

  const setSessions = (newSessions) => {
    sessions.value = newSessions;
  };
  return { sessions, total, totalPages, addSession, setSessions };
});
