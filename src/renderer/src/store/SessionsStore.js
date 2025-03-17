import { defineStore } from "pinia";
import { ref } from "vue";

export const useSessionsStore = defineStore("sessionStore", () => {
  const sessions = ref([]);

  const addSession = (session) => {
    sessions.value = [session, ...sessions.value];
  };

  const setSessions = (newSessions) => {
    sessions.value = newSessions;
  };
  return { sessions, addSession, setSessions };
});
