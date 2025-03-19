<template>
  <div
    v-if="isOpen"
    class="relative z-10"
    aria-labelledby="slide-over-title"
    role="dialog"
    aria-modal="true"
  >
    <div class="fixed inset-0 z-10 bg-black/50 transition-opacity" @click.self="closeDrawer">
      <div
        class="fixed inset-y-0 flex max-w-full"
        :class="position === 'left' ? 'left-0 pr-10' : 'right-0 pl-10'"
      >
        <transition :name="position === 'left' ? 'slide-left' : 'slide-right'" appear>
          <div
            v-if="isOpen"
            class="pointer-events-auto relative w-screen max-w-md transform bg-white shadow-xl transition-transform"
            :style="{ zIndex }"
          >
            <div
              class="absolute top-0"
              :class="position === 'left' ? 'right-0 pr-2' : 'left-0 -ml-8 sm:-ml-10 sm:pr-4'"
            >
              <button
                type="button"
                class="relative rounded-md text-gray-300 hover:text-white focus:ring-2 focus:ring-white focus:outline-none"
                @click="closeDrawer"
              >
                <span class="absolute -inset-2.5"></span>
                <span class="sr-only">Close panel</span>
                <svg
                  class="size-6"
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
            <div class="flex h-full flex-col overflow-y-scroll py-6">
              <div class="px-4 sm:px-6">
                <h2 class="text-base font-semibold text-gray-900" id="slide-over-title">
                  {{ props.title }}
                </h2>
              </div>
              <div class="relative mt-6 flex-1 px-4 sm:px-6">
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
  .slide-right-enter-active,
  .slide-right-leave-active {
    transition: transform 0.3s ease-in-out;
  }
  .slide-right-enter-from,
  .slide-right-leave-to {
    transform: translateX(100%);
  }

  .slide-left-enter-active,
  .slide-left-leave-active {
    transition: transform 0.3s ease-in-out;
  }
  .slide-left-enter-from,
  .slide-left-leave-to {
    transform: translateX(-100%);
  }
</style>
