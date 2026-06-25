<template>
  <section class="placeholder-page">
    <div class="placeholder-page__hero">
      <div>
        <p class="placeholder-page__eyebrow">{{ roleText }}</p>
        <h2>{{ title }}</h2>
        <p>{{ description }}</p>
      </div>
      <v-chip color="primary" variant="flat">Draft Screen</v-chip>
    </div>

    <v-row>
      <v-col cols="12" md="7">
        <v-card class="placeholder-page__card" rounded="xl" elevation="0">
          <h3>구현 메모</h3>
          <ul>
            <li>현재 화면은 권한별 라우팅과 레이아웃 검증을 위한 기본 골격입니다.</li>
            <li>다음 단계에서 디자인 레퍼런스와 API 스펙에 맞춰 실제 기능을 연결합니다.</li>
            <li>공통 레이아웃은 AppLayout 내부에서만 렌더링되도록 구성되어 있습니다.</li>
          </ul>
        </v-card>
      </v-col>
      <v-col cols="12" md="5">
        <v-card class="placeholder-page__summary" rounded="xl" elevation="0">
          <div>
            <span>Route Name</span>
            <strong>{{ route.name }}</strong>
          </div>
          <div>
            <span>Path</span>
            <strong>{{ route.path }}</strong>
          </div>
          <div>
            <span>권한 범위</span>
            <strong>{{ (roles ?? []).join(', ') }}</strong>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { ROLE_LABELS } from '../../constants/auth'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  roles: {
    type: Array,
    default: () => [],
  },
})

const route = useRoute()
const roleText = computed(() => props.roles.map((role) => ROLE_LABELS[role] ?? role).join(' / '))
</script>

<style scoped>
.placeholder-page {
  display: grid;
  gap: 20px;
}

.placeholder-page__hero {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  padding: 28px;
  border-radius: 28px;
  background:
    linear-gradient(135deg, rgba(24, 64, 116, 0.96), rgba(33, 124, 196, 0.88)),
    #184074;
  color: white;
  box-shadow: 0 22px 48px rgba(15, 23, 42, 0.14);
}

.placeholder-page__eyebrow {
  margin: 0 0 8px;
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
}

.placeholder-page__hero h2 {
  margin: 0 0 10px;
  font-size: clamp(1.8rem, 2.8vw, 2.4rem);
}

.placeholder-page__hero p {
  margin: 0;
  max-width: 52ch;
  color: rgba(255, 255, 255, 0.84);
}

.placeholder-page__card,
.placeholder-page__summary {
  height: 100%;
  padding: 24px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.9);
}

.placeholder-page__card h3 {
  margin: 0 0 12px;
  font-size: 1.05rem;
}

.placeholder-page__card ul {
  margin: 0;
  padding-left: 18px;
  color: #475569;
}

.placeholder-page__summary {
  display: grid;
  gap: 16px;
}

.placeholder-page__summary span {
  display: block;
  margin-bottom: 4px;
  font-size: 0.8rem;
  color: #64748b;
}

.placeholder-page__summary strong {
  color: #0f172a;
}

@media (max-width: 720px) {
  .placeholder-page__hero {
    padding: 20px;
    flex-direction: column;
  }
}
</style>
