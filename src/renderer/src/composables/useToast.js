import { ref } from "vue";

const toasts = ref([]);

export function useToast() {
  const addToast = ({ title, description, type = "default", duration = 2000 }) => {
    const id = Date.now();
    toasts.value.push({
      id,
      title,
      description,
      type,
      duration: 2000,
    });
    return id;
  };

  const removeToast = (id) => {
    toasts.value = toasts.value.filter((toast) => toast.id !== id);
  };

  const success = (title, description) => {
    return addToast({ title, description, type: "success" });
  };

  const error = (title, description) => {
    return addToast({ title, description, type: "error" });
  };

  const warning = (title, description) => {
    return addToast({ title, description, type: "warning" });
  };

  const info = (title, description) => {
    return addToast({ title, description, type: "info" });
  };

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
}
