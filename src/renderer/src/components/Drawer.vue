<template>
  <div
    v-if="isOpen"
    class="drawer-container"
    aria-labelledby="slide-over-title"
    role="dialog"
    aria-modal="true"
  >
    <div class="drawer-overlay" @click.self="closeDrawer">
      <div class="drawer-wrapper" :class="position === 'left' ? 'left-0 pr-10' : 'right-0 pl-10'">
        <transition :name="position === 'left' ? 'slide-left' : 'slide-right'" appear>
          <div v-if="isOpen" class="drawer-content" :style="{ zIndex }">
            <div
              class="drawer-close-button-container"
              :class="position === 'left' ? '-right-10 pr-2' : 'left-0 -ml-8 sm:-ml-10 sm:pr-4'"
            >
              <button type="button" class="drawer-close-button" @click="closeDrawer">
                <span class="drawer-close-button-inset"></span>
                <span class="sr-only">Close panel</span>
                <svg
                  class="drawer-close-icon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="drawer-body">
              <div class="drawer-header">
                <h2 class="drawer-title" id="slide-over-title">
                  {{ props.title }}
                </h2>
              </div>
              <div class="drawer-content-wrapper">
                <slot></slot>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, watch } from "vue";

  const props = defineProps({
    title: {
      type: String,
      default: "Panel title",
    },
    modelValue: {
      type: Boolean,
      default: false,
    },
    position: {
      type: String,
      default: "right", // Возможные значения: 'left', 'right'
      validator: (value) => ["left", "right"].includes(value),
    },
    zIndex: {
      type: Number,
      default: 50,
    },
  });

  const isOpen = ref(props.modelValue);
  const emit = defineEmits();

  watch(
    () => props.modelValue,
    (newValue) => {
      isOpen.value = newValue;
    }
  );

  const openDrawer = () => {
    isOpen.value = true;
    emit("update:modelValue", true);
  };

  const closeDrawer = () => {
    isOpen.value = false;
    emit("update:modelValue", false);
  };
</script>

<style>
  @reference "@/assets/main.css";

  .drawer-container {
    @apply relative z-10;
  }

  .drawer-overlay {
    @apply fixed inset-0 z-10 bg-black/50 transition-opacity;
  }

  .drawer-wrapper {
    @apply fixed inset-y-0 flex max-w-full;
  }

  .drawer-content {
    @apply pointer-events-auto relative w-screen max-w-md transform bg-white transition-transform;
  }

  .drawer-close-button-container {
    @apply absolute top-2;
  }

  .drawer-close-button {
    @apply relative rounded-md text-gray-300 hover:text-white focus:ring-2 focus:ring-white focus:outline-none;
  }

  .drawer-close-button-inset {
    @apply absolute -inset-2.5;
  }

  .drawer-close-icon {
    @apply size-6;
  }

  .drawer-body {
    @apply flex h-full flex-col overflow-y-scroll py-6;
  }

  .drawer-header {
    @apply px-4 sm:px-6;
  }

  .drawer-title {
    @apply text-base font-semibold text-gray-900;
  }

  .drawer-content-wrapper {
    @apply relative mt-6 flex-1 px-4 sm:px-6;
  }

  .slide-right-enter-active,
  .slide-right-leave-active {
    @apply transition-transform duration-300 ease-in-out;
  }
  .slide-right-enter-from,
  .slide-right-leave-to {
    @apply translate-x-full;
  }

  .slide-left-enter-active,
  .slide-left-leave-active {
    @apply transition-transform duration-300 ease-in-out;
  }
  .slide-left-enter-from,
  .slide-left-leave-to {
    @apply -translate-x-full;
  }
</style>
