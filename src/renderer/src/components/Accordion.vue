<script setup>
  import { AccordionRoot, AccordionItem, AccordionTrigger, AccordionContent } from "radix-vue";
  import { ref } from "vue";

  const props = defineProps({
    title: {
      type: String,
      required: true,
    },
  });

  const isOpen = ref(false);

  const toggleAccordion = () => {
    isOpen.value = !isOpen.value;
  };
</script>

<template>
  <AccordionRoot type="single" collapsible @update:value="toggleAccordion">
    <AccordionItem value="item-1">
      <AccordionTrigger
        class="flex w-full cursor-pointer items-center justify-between border-b-2 border-gray-200 bg-white p-4 leading-none outline-none"
      >
        {{ title }}
        <Icon
          icon="radix-icons:chevron-down"
          class="text-green10 transition-transform duration-300 ease-[cubic-bezier(0.87,_0,_0.13,_1)] group-data-[state=open]:rotate-180"
          aria-label="Expand/Collapse"
        />
      </AccordionTrigger>
      <AccordionContent
        class="text-mauve11 bg-mauve2 data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp mt-4 overflow-hidden text-[15px]"
      >
        <slot />
      </AccordionContent>
    </AccordionItem>
  </AccordionRoot>
</template>
