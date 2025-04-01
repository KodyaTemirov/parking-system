<template>
  <div class="plate" v-if="plateNumber">
    <div class="left">{{ region }}</div>
    <div class="center">{{ formattedSerial }}</div>
    <div class="right">
      <div class="flag"></div>
      <div class="country">UZ</div>
    </div>
  </div>
  <div v-else class="plate not-specified px-6">Kiritilmagan</div>
</template>

<script setup>
  import { computed } from "vue";

  const props = defineProps({
    plateNumber: {
      type: String,
      required: false,
      default: null,
    },
  });

  const region = computed(() => (props.plateNumber ? props.plateNumber.slice(0, 2) : ""));

  const formattedSerial = computed(() => {
    if (!props.plateNumber) return "";

    const serial = props.plateNumber.slice(2);
    const firstChar = serial.charAt(0);

    if (isNaN(parseInt(firstChar))) {
      return `${firstChar} ${serial.slice(1, serial.length - 2)} ${serial.slice(-2)}`;
    } else {
      return serial.slice(0, serial.length - 3) + " " + serial.slice(-3);
    }
  });
</script>

<style scoped>
  .plate {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 40px;
    border: 2px solid black;
    border-radius: 8px;
    background-color: white;
    font-family: Arial, sans-serif;
    font-size: 24px;
    font-weight: bold;
  }

  .left {
    padding: 0 5px;
    border-right: 2px solid black;
  }

  .center {
    flex-grow: 1;
    padding: 0 5px;
    text-align: center;
  }

  .right {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 0 10px;
  }

  .flag {
    width: 16px;
    height: 10px;
    background: linear-gradient(to bottom, #007fff 33%, white 33%, white 66%, #1eb53a 66%);
  }

  .country {
    font-size: 12px;
    line-height: 14px;
    color: blue;
  }

  .not-specified {
    width: 100%;
    text-align: center;
    color: gray;
    font-size: 18px;
  }
</style>
