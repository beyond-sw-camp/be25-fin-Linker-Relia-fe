<template>
  <section class="consultation-list-page">
    <div class="list-heading">
      <div>
        <p>상담 관리</p>
        <h2>임시저장 상담일지 목록</h2>
      </div>
      <v-btn class="primary-button" @click="router.push({ name: 'consultation-create' })">
        상담일지 작성
      </v-btn>
    </div>

    <section class="summary-strip">
      <article>
        <v-icon icon="mdi-file-clock-outline" size="18" />
        <strong>{{ drafts.length }}</strong>
        <span>전체 임시저장</span>
      </article>
      <article>
        <v-icon icon="mdi-calendar-today-outline" size="18" />
        <strong>{{ todayCount }}</strong>
        <span>오늘 저장</span>
      </article>
      <article>
        <v-icon icon="mdi-pencil-outline" size="18" />
        <strong>{{ editableCount }}</strong>
        <span>수정 가능</span>
      </article>
    </section>

    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

    <section class="list-panel">
      <div class="list-table">
        <table>
          <thead>
            <tr>
              <th>저장일시</th>
              <th>고객명</th>
              <th>상담 유형</th>
              <th>상담 방식</th>
              <th>상담일시</th>
              <th>상태</th>
              <th>수정</th>
              <th>삭제</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="draft in drafts"
              :key="draft.id"
              class="is-clickable"
              @click="router.push({ name: 'consultation-draft-detail', params: { draftId: draft.id } })"
            >
              <td>{{ formatDateTime(draft.updatedAt) }}</td>
              <td class="strong">{{ draft.customerName || '-' }}</td>
              <td><span class="badge">{{ getConsultationTypeLabel(draft.consultationType) }}</span></td>
              <td>{{ getConsultationChannelLabel(draft.consultationChannel) }}</td>
              <td>{{ formatDateTime(draft.consultedAt) }}</td>
              <td><span class="draft-badge">임시저장</span></td>
              <td>
                <button
                  type="button"
                  class="row-action"
                  @click.stop="router.push({ name: 'consultation-draft-edit', params: { draftId: draft.id } })"
                >
                  수정
                </button>
              </td>
              <td>
                <button
                  type="button"
                  class="row-action row-action--danger"
                  @click.stop="deleteDraft(draft.id)"
                >
                  삭제
                </button>
              </td>
            </tr>
            <tr v-if="!drafts.length">
              <td colspan="8" class="empty">임시저장된 상담일지가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  deleteConsultationDraftFromApi,
  getConsultationDraftsFromApi,
} from '../../api/consultations'
import { getConsultationChannelLabel, getConsultationTypeLabel } from '../../constants/customer'
import {
  deleteConsultationDraft,
  normalizeDraftResponse,
} from '../../utils/consultationDrafts'
import { formatDateTime } from '../../utils/formatters'

const router = useRouter()
const drafts = ref([])
const errorMessage = ref('')

const todayCount = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  return drafts.value.filter((draft) => String(draft.updatedAt).slice(0, 10) === today).length
})
const editableCount = computed(() => drafts.value.length)

onMounted(async () => {
  await loadDrafts()
})

async function loadDrafts() {
  errorMessage.value = ''
  try {
    const response = await getConsultationDraftsFromApi()
    const rawDrafts = Array.isArray(response?.result)
      ? response.result
      : Array.isArray(response)
        ? response
        : []
    drafts.value = rawDrafts
      .map(normalizeDraftResponse)
      .filter(Boolean)
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
  } catch (error) {
    drafts.value = []
    errorMessage.value = error.response?.data?.message || error.message || '서버 임시저장 목록을 불러오지 못했습니다.'
  }
}

async function deleteDraft(draftId) {
  const shouldDelete = window.confirm('임시저장 상담일지를 삭제할까요?')
  if (!shouldDelete) return
  try {
    await deleteConsultationDraftFromApi(draftId)
  } catch (error) {
    errorMessage.value = error.response?.data?.message || error.message || '서버 임시저장 삭제에 실패했습니다.'
    return
  }
  deleteConsultationDraft(draftId)
  await loadDrafts()
}
</script>

<style scoped>
.consultation-list-page {
  display: grid;
  gap: 16px;
  color: #111827;
}

.list-heading {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-end;
}

.list-heading p {
  margin: 0 0 4px;
  color: #64748b;
  font-size: 12px;
}

.list-heading h2 {
  margin: 0;
  font-size: 18px;
}

.primary-button {
  background: #f97316;
  color: #ffffff;
  box-shadow: none;
}

.error-message {
  margin: 0;
  padding: 12px 14px;
  border-radius: 8px;
  background: #fef2f2;
  color: #dc2626;
  font-size: 13px;
  font-weight: 800;
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.summary-strip article {
  display: grid;
  gap: 4px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

.summary-strip strong {
  font-size: 22px;
}

.summary-strip span {
  color: #64748b;
  font-size: 12px;
}

.list-panel {
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

.list-table {
  overflow-x: auto;
}

.list-table table {
  width: 100%;
  min-width: 860px;
  border-collapse: collapse;
}

.list-table th,
.list-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #e5e7eb;
  color: #475569;
  font-size: 13px;
  text-align: left;
  white-space: nowrap;
}

.list-table th {
  background: #f8fafc;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
}

.list-table tr:last-child td {
  border-bottom: 0;
}

.is-clickable {
  cursor: pointer;
}

.is-clickable:hover {
  background: #fff7ed;
}

.strong {
  color: #111827;
  font-weight: 800;
}

.badge,
.draft-badge {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 3px 8px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 800;
}

.badge {
  background: #eff6ff;
  color: #2563eb;
}

.draft-badge {
  background: #fff7ed;
  color: #f97316;
}

.row-action {
  height: 28px;
  padding: 0 10px;
  border: 1px solid #f97316;
  border-radius: 6px;
  background: #ffffff;
  color: #f97316;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.row-action--danger {
  border-color: #ef4444;
  color: #ef4444;
}

.empty {
  height: 140px;
  text-align: center;
}

@media (max-width: 720px) {
  .list-heading,
  .summary-strip {
    grid-template-columns: 1fr;
    display: grid;
  }
}
</style>
