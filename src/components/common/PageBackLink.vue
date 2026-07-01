<template>
  <button class="page-back-link" type="button" @click="$emit('click')">
    <v-icon icon="mdi-chevron-left" size="18" />
    <span>{{ label }}</span>
  </button>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
})

defineEmits(['click'])
</script>

<style scoped>
.page-back-link {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--text-secondary, #64748b);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.35;
  cursor: pointer;
  transition:
    color 0.2s ease,
    transform 0.2s ease;
}

.page-back-link:hover {
  color: var(--text-primary, #334155);
  transform: translateX(3px);
}
</style>
