<template>
  <div class="notification-bell">
    <v-menu
      v-model="isDropdownOpen"
      location="bottom end"
      offset="10"
      :close-on-content-click="false"
      @update:model-value="handleDropdownToggle"
    >
      <template #activator="{ props }">
        <button class="notification-bell__button" type="button" aria-label="알림" v-bind="props">
          <v-badge
            :model-value="unreadCount > 0"
            :content="unreadCountLabel"
            color="#f97316"
            offset-x="2"
            offset-y="2"
          >
            <v-icon icon="mdi-bell-outline" size="20" />
          </v-badge>
        </button>
      </template>

      <section class="notification-dropdown" aria-label="알림 미리보기">
        <header class="notification-dropdown__header">
          <div class="notification-dropdown__left">
            <strong>알림</strong>
          </div>
          <span>안읽음 {{ unreadCountLabel }}건</span>
        </header>

        <div class="notification-dropdown__list">
          <button
            v-for="notification in dropdownNotifications"
            :key="notification.id"
            class="notification-dropdown__item"
            :class="{ 'is-unread': !notification.isRead }"
            type="button"
            @click.stop="handleDropdownItemClick(notification)"
          >
            <span class="notification-dropdown__dot-wrap">
              <span v-if="!notification.isRead" class="notification-dropdown__dot" aria-hidden="true"></span>
            </span>
            <span class="notification-dropdown__content">
              <strong>{{ notification.content }}</strong>
              <small>{{ notification.relativeTime }}</small>
            </span>
          </button>

          <div v-if="isLoading && dropdownNotifications.length === 0" class="notification-dropdown__state">
            알림을 불러오는 중입니다.
          </div>
          <div v-else-if="dropdownNotifications.length === 0" class="notification-dropdown__state">
            알림이 없습니다.
          </div>
        </div>

        <button class="notification-dropdown__more" type="button" @click="openModalAfterReadAll">
          전체 알림 보기
        </button>
      </section>
    </v-menu>

    <v-dialog v-model="isModalOpen" width="500" max-width="calc(100vw - 16px)" scrollable>
      <section class="notification-modal" aria-label="전체 알림">
        <header class="notification-modal__header">
          <h2>전체 알림</h2>
          <div class="notification-modal__header-actions">
            <button type="button" aria-label="전체 알림 닫기" @click="closeModal">
              <v-icon icon="mdi-close" size="18" />
            </button>
          </div>
        </header>

        <div ref="modalListRef" class="notification-modal__list" @scroll="handleModalScroll">
          <div v-if="showFloatingDateLabel && floatingDateLabel" class="notification-modal__floating-date">
            {{ floatingDateLabel }}
          </div>

          <template v-for="group in groupedNotifications" :key="group.dateKey">
            <div
              :ref="(element) => setDateMarkerRef(group.dateKey, element)"
              class="notification-modal__date"
              :data-date-key="group.dateKey"
            >
              {{ group.dateLabel }}
            </div>

            <button
              v-for="notification in group.items"
              :id="`notification-${notification.id}`"
              :key="notification.id"
              class="notification-modal__item"
              :class="[
                { 'is-unread': !notification.isRead },
                `notification-modal__item--${notification.tone}`,
              ]"
              type="button"
              @click="handleModalItemClick(notification)"
            >
              <span class="notification-modal__icon">
                <v-icon :icon="notification.icon" size="15" />
              </span>

              <span class="notification-modal__bubble">
                <strong>{{ notification.content }}</strong>
              </span>

              <span class="notification-modal__meta">
                <span v-if="notification.isRead">읽음</span>
                <time>{{ notification.createdTime }}</time>
              </span>
            </button>
          </template>

          <div v-if="isLoadingMore" class="notification-modal__state">다음 알림을 불러오는 중입니다.</div>
          <div v-else-if="hasNext" class="notification-modal__more-hint">스크롤하여 더 보기...</div>
          <div v-if="!isLoading && notifications.length === 0" class="notification-modal__empty">
            알림이 없습니다.
          </div>
        </div>
      </section>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import {
  createNotificationStream,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../../api/notifications'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const isDropdownOpen = ref(false)
const isModalOpen = ref(false)
const isLoading = ref(false)
const isLoadingMore = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
const nextCursor = ref(null)
const hasNext = ref(false)
const modalListRef = ref(null)
const focusedNotificationId = ref(null)
const showFloatingDateLabel = ref(false)
const floatingDateLabel = ref('')
const dateMarkerRefs = new Map()
let dateObserver = null
let notificationStream = null

const unreadCountLabel = computed(() => (unreadCount.value > 99 ? '99+' : String(unreadCount.value)))
const dropdownNotifications = computed(() => notifications.value.slice(0, 8))
const modalNotifications = computed(() =>
  [...notifications.value].sort((a, b) => a.createdAtTime - b.createdAtTime),
)

const groupedNotifications = computed(() => {
  const groups = []

  modalNotifications.value.forEach((notification) => {
    let group = groups.find((item) => item.dateKey === notification.dateKey)

    if (!group) {
      group = {
        dateKey: notification.dateKey,
        dateLabel: notification.dateLabel,
        items: [],
      }
      groups.push(group)
    }

    group.items.push(notification)
  })

  return groups
})

onMounted(() => {
  loadFirstPage()
  subscribeNotifications()
})

onBeforeUnmount(() => {
  notificationStream?.close()
  dateObserver?.disconnect()
})

watch(isModalOpen, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      setupDateMarkerObserver()
      scrollModalToInitialPosition()
    })
    return
  }

  showFloatingDateLabel.value = false
  dateObserver?.disconnect()
})

watch(groupedNotifications, () => {
  if (isModalOpen.value) {
    nextTick(() => {
      setupDateMarkerObserver()
      updateFloatingDateLabel()
    })
  }
})

function handleDropdownToggle(isOpen) {
  if (isOpen && notifications.value.length === 0) {
    loadFirstPage()
  }
}

async function loadFirstPage() {
  const shouldKeepAtBottom = isModalOpen.value && isModalNearBottom()
  isLoading.value = true

  try {
    const data = unwrapResult(await getNotifications())
    notifications.value = normalizeNotifications(data.notifications)
    nextCursor.value = data.nextCursor ?? null
    hasNext.value = Boolean(data.hasNext)
    unreadCount.value = Number(data.unreadCount ?? countUnread(notifications.value))
  } catch {
    notifications.value = []
    unreadCount.value = 0
    nextCursor.value = null
    hasNext.value = false
  } finally {
    isLoading.value = false

    if (shouldKeepAtBottom) {
      await nextTick()
      scrollModalToBottom()
    }
  }
}

async function loadNextPage() {
  if (!hasNext.value || !nextCursor.value || isLoadingMore.value) {
    return
  }

  const list = modalListRef.value
  const previousScrollHeight = list?.scrollHeight ?? 0
  const previousScrollTop = list?.scrollTop ?? 0

  isLoadingMore.value = true

  try {
    const data = unwrapResult(await getNotifications({ cursor: nextCursor.value }))
    notifications.value = mergeNotifications(notifications.value, normalizeNotifications(data.notifications))
    nextCursor.value = data.nextCursor ?? null
    hasNext.value = Boolean(data.hasNext)
    unreadCount.value = Number(data.unreadCount ?? countUnread(notifications.value))

    await nextTick()

    if (list) {
      list.scrollTop = list.scrollHeight - previousScrollHeight + previousScrollTop
    }
  } finally {
    isLoadingMore.value = false
  }
}

function subscribeNotifications() {
  if (!authStore.accessToken || notificationStream) {
    return
  }

  notificationStream = createNotificationStream({
    getAccessToken: () => authStore.accessToken,
    applyAccessToken: (token) => authStore.setAccessToken(token),
    onAuthFailure: async () => {
      authStore.clearAuth()
      await router.push('/login')
    },
    onEvent: handleNotificationEvent,
    onError: () => {},
  })
}

function handleNotificationEvent(event) {
  if (['connect', 'heartbeat'].includes(event.event)) {
    return
  }

  if (!['HANDOVER_REQUEST', 'HANDOVER_RECEIVED'].includes(event.event)) {
    return
  }

  loadFirstPage()
}

async function markAllAsRead() {
  await markAllNotificationsAsRead()
  notifications.value = notifications.value.map((notification) => ({ ...notification, isRead: true }))
  unreadCount.value = 0
}

async function openModalAfterReadAll() {
  focusedNotificationId.value = null
  openModal()

  try {
    await markAllAsRead()
  } catch {
    // 전체 알림 진입은 읽음 처리 실패와 분리한다.
  }
}

async function handleDropdownItemClick(notification) {
  const targetRoute = resolveNotificationRoute(notification)

  try {
    await markAsRead(notification.id)
  } catch {
    // 상세 이동은 알림 읽음 처리 실패 여부와 별개로 시도한다.
  }

  isDropdownOpen.value = false

  if (targetRoute) {
    router.push(targetRoute)
    return
  }

  focusedNotificationId.value = notification.id
  openModal()
}

function openModal() {
  isDropdownOpen.value = false
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  focusedNotificationId.value = null
}

async function handleModalItemClick(notification) {
  const targetRoute = resolveNotificationRoute(notification)

  try {
    await markAsRead(notification.id)
  } catch {
    // 상세 이동은 알림 읽음 처리 실패 여부와 별개로 시도한다.
  }

  if (targetRoute) {
    closeModal()
    router.push(targetRoute)
  }
}

function resolveNotificationRoute(notification) {
  if (!isHandoverNotification(notification) || !notification.targetId) {
    return null
  }

  return {
    name: 'handover-detail',
    params: { handoverRequestId: notification.targetId },
  }
}

function isHandoverNotification(notification) {
  return (
    String(notification.targetType ?? '').toUpperCase() === 'HANDOVER' ||
    String(notification.notificationType ?? '').startsWith('HANDOVER')
  )
}

async function markAsRead(notificationId) {
  const notification = notifications.value.find((item) => item.id === notificationId)

  if (!notification) {
    return
  }

  await markNotificationAsRead(notificationId)

  if (!notification.isRead) {
    unreadCount.value = Math.max(unreadCount.value - 1, 0)
  }

  notifications.value = notifications.value.map((item) =>
    item.id === notificationId ? { ...item, isRead: true } : item,
  )
}

function handleModalScroll() {
  const element = modalListRef.value

  if (!element) {
    return
  }

  if (element.scrollTop < 80) {
    loadNextPage()
  }

  updateFloatingDateLabel()
}

function unwrapResult(response) {
  return response?.result ?? response ?? {}
}

function normalizeNotifications(source = []) {
  if (!Array.isArray(source)) {
    return []
  }

  return source.map(normalizeNotification).sort((a, b) => b.createdAtTime - a.createdAtTime)
}

function normalizeNotification(source = {}) {
  const createdAt = source.createdAt ? new Date(source.createdAt) : new Date()
  const notificationType = source.notificationType ?? source.type ?? 'NOTICE'
  const typeMeta = getTypeMeta(notificationType)

  return {
    id: source.id ?? source.referenceId ?? `${notificationType}-${createdAt.getTime()}`,
    notificationType,
    content: source.content ?? source.message ?? '',
    targetType: source.targetType ?? null,
    targetId: source.targetId ?? source.handoverRequestId ?? source.referenceId ?? null,
    isRead: Boolean(source.readYn),
    createdAt,
    createdAtTime: createdAt.getTime(),
    createdTime: formatTime(createdAt),
    relativeTime: formatRelativeTime(createdAt),
    dateKey: formatDateKey(createdAt),
    dateLabel: formatDateLabel(createdAt),
    icon: typeMeta.icon,
    tone: typeMeta.tone,
    label: typeMeta.label,
  }
}

function mergeNotifications(base, incoming) {
  const byId = new Map()

  ;[...base, ...incoming].forEach((notification) => {
    if (notification.id) {
      byId.set(notification.id, notification)
    }
  })

  return Array.from(byId.values()).sort((a, b) => b.createdAtTime - a.createdAtTime)
}

function countUnread(items) {
  return items.filter((notification) => !notification.isRead).length
}

function getTypeMeta(type) {
  if (String(type).startsWith('HANDOVER')) {
    return {
      icon: 'mdi-file-document-outline',
      tone: 'handover',
      label: type === 'HANDOVER_RECEIVED' ? '인수인계 완료' : '인수인계 요청',
    }
  }

  if (String(type).startsWith('COMMISSION')) {
    return {
      icon: 'mdi-calculator-variant-outline',
      tone: 'commission',
      label: '수수료 정산',
    }
  }

  return {
    icon: 'mdi-bell-outline',
    tone: 'notice',
    label: '알림',
  }
}

function setDateMarkerRef(dateKey, element) {
  if (!element) {
    dateMarkerRefs.delete(dateKey)
    return
  }

  dateMarkerRefs.set(dateKey, element)
}

function setupDateMarkerObserver() {
  dateObserver?.disconnect()

  if (!modalListRef.value) {
    return
  }

  dateObserver = new IntersectionObserver(updateFloatingDateLabel, {
    root: modalListRef.value,
    threshold: 0.01,
  })

  dateMarkerRefs.forEach((element) => {
    dateObserver.observe(element)
  })

  updateFloatingDateLabel()
}

function updateFloatingDateLabel() {
  const list = modalListRef.value

  if (!list) {
    showFloatingDateLabel.value = false
    floatingDateLabel.value = ''
    return
  }

  const listRect = list.getBoundingClientRect()
  const markers = groupedNotifications.value
    .map((group) => ({
      group,
      element: dateMarkerRefs.get(group.dateKey),
    }))
    .filter((item) => item.element)

  const visibleMarker = markers.find(({ element }) => {
    const rect = element.getBoundingClientRect()
    return rect.bottom > listRect.top && rect.top < listRect.bottom
  })

  if (visibleMarker) {
    showFloatingDateLabel.value = false
    floatingDateLabel.value = ''
    return
  }

  const markerAbove = [...markers].reverse().find(({ element }) => {
    const rect = element.getBoundingClientRect()
    return rect.bottom <= listRect.top
  })

  showFloatingDateLabel.value = Boolean(markerAbove)
  floatingDateLabel.value = markerAbove?.group.dateLabel ?? ''
}

function scrollModalToInitialPosition() {
  const list = modalListRef.value

  if (!list) {
    return
  }

  if (focusedNotificationId.value) {
    document.getElementById(`notification-${focusedNotificationId.value}`)?.scrollIntoView({
      block: 'center',
    })
  } else {
    scrollModalToBottom()
  }

  updateFloatingDateLabel()
}

function scrollModalToBottom() {
  const list = modalListRef.value

  if (list) {
    list.scrollTop = list.scrollHeight
  }
}

function isModalNearBottom() {
  const list = modalListRef.value

  if (!list) {
    return true
  }

  return list.scrollHeight - list.scrollTop - list.clientHeight < 80
}

function formatRelativeTime(date) {
  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.max(Math.floor(diffMs / 60000), 0)

  if (diffMinutes < 1) {
    return '방금 전'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`
  }

  const diffHours = Math.floor(diffMinutes / 60)

  if (diffHours < 24) {
    return `${diffHours}시간 전`
  }

  if (diffHours < 48) {
    return '어제'
  }

  return `${Math.floor(diffHours / 24)}일 전`
}

function formatDateKey(date) {
  return date.toISOString().slice(0, 10)
}

function formatDateLabel(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}년 ${month}월 ${day}일`
}

function formatTime(date) {
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}
</script>

<style scoped>
.notification-bell__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 0;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
}

.notification-dropdown {
  width: 300px;
  height: 292px;
  overflow: hidden;
  border: 1px solid #d7dce3;
  border-radius: 7px;
  background: #ffffff;
  box-shadow: 0 8px 22px rgba(31, 41, 55, 0.16);
}

.notification-dropdown__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: 45px;
  padding: 0 14px;
  border-bottom: 1px solid #dfe3e8;
}

.notification-dropdown__left,
.notification-dropdown__tools {
  display: inline-flex;
  align-items: center;
  min-width: 0;
}

.notification-dropdown__left {
  gap: 7px;
}

.notification-dropdown__left strong {
  color: #1f2937;
  font-size: 14px;
  font-weight: 900;
}

.notification-dropdown__left button,
.notification-dropdown__more {
  border: 0;
  background: transparent;
  color: #f26522;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
}

.notification-dropdown__header > span {
  color: #4b5563;
  font-size: 12px;
  white-space: nowrap;
}

.notification-dropdown__list {
  display: grid;
  align-content: start;
  grid-auto-rows: min-content;
  height: 211px;
  overflow-y: auto;
}

.notification-dropdown__list::-webkit-scrollbar,
.notification-modal__list::-webkit-scrollbar {
  width: 14px;
}

.notification-dropdown__list::-webkit-scrollbar-track,
.notification-modal__list::-webkit-scrollbar-track {
  background: #f3f4f6;
}

.notification-dropdown__list::-webkit-scrollbar-thumb,
.notification-modal__list::-webkit-scrollbar-thumb {
  border: 4px solid #f3f4f6;
  border-radius: 999px;
  background: #8b8f95;
}

.notification-dropdown__item {
  display: grid;
  grid-template-columns: 12px minmax(0, 1fr);
  gap: 5px;
  width: 100%;
  min-height: 58px;
  padding: 10px 16px 9px;
  border: 0;
  border-bottom: 1px solid #dde2e8;
  background: #ffffff;
  text-align: left;
  cursor: pointer;
}

.notification-dropdown__item.is-unread {
  background: #fff1e8;
}

.notification-dropdown__dot-wrap {
  display: flex;
  justify-content: center;
  padding-top: 7px;
}

.notification-dropdown__dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #ff6b2b;
}

.notification-dropdown__content {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.notification-dropdown__content strong {
  overflow: hidden;
  color: #9aa2af;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-dropdown__item.is-unread .notification-dropdown__content strong {
  color: #1f2937;
  font-weight: 500;
}

.notification-dropdown__content small,
.notification-dropdown__state {
  color: #8a8a8a;
  font-size: 12px;
}

.notification-dropdown__state {
  padding: 32px 12px;
  text-align: center;
}

.notification-dropdown__more {
  display: block;
  width: 100%;
  height: 36px;
  border-top: 1px solid #dfe3e8;
  color: #1f2937;
  font-size: 12px;
  font-weight: 800;
}

.notification-modal {
  width: min(560px, calc(100vw - 16px));
  height: 470px;
  overflow: hidden;
  border-radius: 7px;
  background: #f8f9fb;
}

.notification-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 18px;
  border-bottom: 1px solid #dfe3e8;
  background: #ffffff;
}

.notification-modal__header h2 {
  margin: 0;
  color: #111827;
  font-size: 15px;
  font-weight: 700;
}

.notification-modal__header-actions {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.notification-modal__header-actions button {
  border: 0;
  background: transparent;
  color: #f26522;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
}

.notification-modal__header-actions button:last-child {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  color: #333333;
}

.notification-modal__list {
  position: relative;
  display: grid;
  align-content: start;
  grid-auto-rows: min-content;
  gap: 13px;
  height: 422px;
  overflow-y: auto;
  padding: 14px 20px 20px;
  background: #f8f9fb;
}

.notification-modal__floating-date,
.notification-modal__date {
  justify-self: center;
  font-size: 10px;
  font-weight: 500;
}

.notification-modal__floating-date {
  position: sticky;
  top: 0;
  z-index: 2;
  border-radius: 999px;
  color: #ffffff;
  min-width: 80px;
  min-height: 18px;
  padding: 3px 10px;
  margin-bottom: -30px;
  background: rgba(107, 114, 128, 0.88);
}

.notification-modal__date {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 8px;
  justify-self: stretch;
  min-height: 18px;
  color: #8a8f98;
  white-space: nowrap;
}

.notification-modal__date::before,
.notification-modal__date::after {
  content: '';
  height: 1px;
  background: #d5d9df;
}

.notification-modal__item {
  display: grid;
  grid-template-columns: 22px minmax(0, max-content) 44px;
  gap: 11px;
  align-items: center;
  width: max-content;
  max-width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.notification-modal__icon {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: #ffffff;
  color: #777777;
}

.notification-modal__item--handover .notification-modal__icon {
  background: #ffe9dc;
  color: #ff6b2b;
}

.notification-modal__item--commission .notification-modal__icon {
  background: #def7e8;
  color: #22a559;
}

.notification-modal__bubble {
  display: block;
  min-width: 0;
  min-height: 34px;
  padding: 8px 13px;
  border: 1px solid #e1e5eb;
  border-radius: 8px;
  background: #eef2f6;
  box-shadow: 0 1px 2px rgba(17, 24, 39, 0.05);
}

.notification-modal__item--handover .notification-modal__bubble {
  border-color: #ffd7c2;
  background: rgba(255, 240, 229, 0.82);
}

.notification-modal__item--handover.is-unread .notification-modal__bubble {
  border-color: #ffd7c2;
  background: #fff0e5;
}

.notification-modal__item--commission.is-unread .notification-modal__bubble {
  border-color: #bfeccc;
  background: #e1f8e9;
}

.notification-modal__bubble strong {
  overflow-wrap: anywhere;
  color: #111827;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.25;
}

.notification-modal__item--handover.is-unread .notification-modal__bubble strong {
  color: #ff6b2b;
}

.notification-modal__item--commission.is-unread .notification-modal__bubble strong {
  color: #22a559;
}

.notification-modal__meta {
  display: grid;
  gap: 2px;
  color: #6b7280;
  font-size: 11px;
  font-weight: 400;
  line-height: 1.1;
  white-space: nowrap;
}

.notification-modal__meta span {
  color: #9aa2af;
}

.notification-modal__state,
.notification-modal__empty,
.notification-modal__more-hint {
  padding: 2px 12px;
  color: #777777;
  font-size: 11px;
  text-align: center;
}
</style>
