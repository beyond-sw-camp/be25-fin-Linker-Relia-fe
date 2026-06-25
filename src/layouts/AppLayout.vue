<template>
  <div class="app-layout">
    <AppSidebar />
    <div class="app-layout__content">
      <AppHeader />
      <main class="app-layout__page">
        <router-view />
      </main>
      <AppFooter />
    </div>
  </div>
</template>

<script setup>
import AppFooter from '../components/common/AppFooter.vue'
import AppHeader from '../components/common/AppHeader.vue'
import AppSidebar from '../components/common/AppSidebar.vue'
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: auto 1fr;
  background: #f9fafb;
}

.app-layout__content {
  min-width: 0;
  display: grid;
  grid-template-rows: auto 1fr auto;
  background: #ffffff;
}

.app-layout__page {
  padding: 24px 28px 40px;
  background: #ffffff;
}

@media (max-width: 768px) {
  .app-layout__page {
    padding: 16px;
  }
}
</style>
