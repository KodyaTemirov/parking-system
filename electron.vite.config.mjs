import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  main: {
    resolve: {
      alias: {
        "@/db": resolve("src/main/db"),
        "@/server": resolve("src/main/server"),
        "@/events": resolve("src/main/events"),
        "@/utils": resolve("src/main/utils"),
        "@/helpers": resolve("src/main/src/helpers"),
      },
    },

    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin(), tailwindcss()],
  },
  renderer: {
    resolve: {
      alias: {
        "@/ui": resolve("src/renderer/src/"),
        "@/helpers": resolve("src/renderer/src/helpers"),
        "@/components": resolve("src/renderer/src/components"),
        "@/assets": resolve("src/renderer/src/assets"),
        "@/views": resolve("src/renderer/src/views"),
        "@/store": resolve("src/renderer/src/store"),
        "@/router": resolve("src/renderer/src/router"),
        "@/services": resolve("src/renderer/src/services"),
      },
    },
    plugins: [vue(), tailwindcss()],
  },
});
