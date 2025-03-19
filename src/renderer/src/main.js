import "./assets/main.css";
import { createPinia } from "pinia";
import { createApp } from "vue";
import globalComponents from "./components/index.js";
import App from "./App.vue";

const pinia = createPinia();
const app = createApp(App);

app.use(globalComponents);
app.use(pinia);
app.mount("#app");
