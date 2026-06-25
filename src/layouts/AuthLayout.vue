<template>
  <div class="auth-layout">
    <div class="auth-layout__shell">
      <main class="auth-layout__body">
        <router-view />
      </main>
      <AppFooter />
    </div>
  </div>
</template>

<script setup>
import AppFooter from '../components/common/AppFooter.vue'
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
  padding: 12px 16px;
  background: #fafafa;
}

.auth-layout__shell {
  min-height: calc(100vh - 24px);
  display: grid;
  grid-template-rows: 1fr auto;
  background: #f7f8fb;
}

.auth-layout__body {
  min-height: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: clamp(56px, 10vh, 96px);
}
</style>
