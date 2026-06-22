<template>
  <section class="insurance-product-create-page">
    <div class="insurance-product-create-page__breadcrumb">
      <span>보험 상품 관리</span>
      <span class="insurance-product-create-page__breadcrumb-separator">/</span>
      <button type="button" @click="goToList">보험 상품 목록</button>
      <span class="insurance-product-create-page__breadcrumb-separator">/</span>
      <strong>보험 상품 등록</strong>
    </div>

    <header class="insurance-product-create-page__header">
      <div>
        <h2>보험 상품 등록</h2>
        <p>보험 상품 정보를 입력하고 보종을 함께 관리할 수 있습니다.</p>
      </div>

      <v-btn
        variant="outlined"
        class="insurance-product-create-page__back-button"
        @click="goToList"
      >
        <v-icon icon="mdi-arrow-left" size="16" start />
        목록으로 돌아가기
      </v-btn>
    </header>

    <div class="insurance-product-create-layout">
      <div class="insurance-product-create-layout__main">
        <section class="insurance-product-create-section">
          <div class="insurance-product-create-section__title">1. 보험사 및 보종</div>
          <div class="insurance-product-create-section__body">
            <div class="insurance-product-create-grid insurance-product-create-grid--two">
              <label class="insurance-product-create-field">
                <span>보험사 <em>*</em></span>
                <select v-model="form.companyName" class="insurance-product-create-input">
                  <option value="">보험사를 선택하세요</option>
                  <option v-for="company in companyOptions" :key="company" :value="company">
                    {{ company }}
                  </option>
                </select>
              </label>

              <label class="insurance-product-create-field">
                <span>보종 <em>*</em></span>
                <select v-model="form.categoryName" class="insurance-product-create-input">
                  <option value="">보종을 선택하세요</option>
                  <option
                    v-for="category in categoryOptions"
                    :key="category.id"
                    :value="category.name"
                  >
                    {{ category.name }}
                  </option>
                </select>
                <small>우측 보종 관리에서 추가, 수정, 삭제할 수 있습니다.</small>
              </label>
            </div>
          </div>
        </section>

        <section class="insurance-product-create-section">
          <div class="insurance-product-create-section__title">2. 상품 기본 정보</div>
          <div class="insurance-product-create-section__body">
            <div class="insurance-product-create-grid insurance-product-create-grid--single-row">
              <label class="insurance-product-create-field">
                <span>보험상품명 <em>*</em></span>
                <input
                  v-model.trim="form.productName"
                  type="text"
                  class="insurance-product-create-input"
                  placeholder="보험상품명을 입력하세요"
                />
              </label>
            </div>

            <div class="insurance-product-create-grid insurance-product-create-grid--product-meta">
              <div class="insurance-product-create-field">
                <span>상태</span>
                <div class="insurance-product-create-toggle">
                  <button
                    type="button"
                    :class="{ 'is-active': form.saleStatus === 'ON_SALE' }"
                    @click="form.saleStatus = 'ON_SALE'"
                  >
                    활성
                  </button>
                  <button
                    type="button"
                    :class="{ 'is-active': form.saleStatus === 'ENDED' }"
                    @click="form.saleStatus = 'ENDED'"
                  >
                    비활성
                  </button>
                </div>
              </div>

              <label class="insurance-product-create-field">
                <span>출시일 <em>*</em></span>
                <input
                  v-model="form.saleStartDate"
                  type="date"
                  class="insurance-product-create-input"
                />
              </label>

              <label class="insurance-product-create-field">
                <span>판매 종료일</span>
                <input
                  v-model="form.saleEndDate"
                  type="date"
                  class="insurance-product-create-input"
                />
              </label>
            </div>
          </div>
        </section>

        <section class="insurance-product-create-section">
          <div class="insurance-product-create-section__title">3. 보장 정보</div>
          <div class="insurance-product-create-section__body">
            <div class="insurance-product-create-field">
              <span>보장기간 유형</span>
              <div class="insurance-product-create-segment">
                <button
                  v-for="type in coverageTypeOptions"
                  :key="type.value"
                  type="button"
                  :class="{ 'is-active': form.coverageType === type.value }"
                  @click="handleCoverageTypeChange(type.value)"
                >
                  {{ type.label }}
                </button>
              </div>
            </div>

            <div class="insurance-product-create-grid insurance-product-create-grid--coverage-main insurance-product-create-grid--spaced">
              <label class="insurance-product-create-field">
                <span>보장 기간 (년)</span>
                <div class="insurance-product-create-inline">
                  <input
                    v-model.trim="form.coveragePeriodYears"
                    type="text"
                    class="insurance-product-create-input"
                    placeholder="예) 20"
                    :disabled="form.coverageType === 'WHOLE_LIFE'"
                  />
                  <span>년</span>
                </div>
              </label>

              <label class="insurance-product-create-field">
                <span>최대 보장 나이</span>
                <input
                  v-model.trim="form.maxCoverageAge"
                  type="text"
                  class="insurance-product-create-input"
                  placeholder="-"
                  :disabled="form.coverageType === 'WHOLE_LIFE'"
                />
              </label>

              <div class="insurance-product-create-field">
                <span>종신 보장 여부</span>
                <div class="insurance-product-create-toggle">
                  <button
                    type="button"
                    :class="{ 'is-active': form.wholeLifeCoverage === true }"
                    @click="setWholeLifeCoverage(true)"
                  >
                    예
                  </button>
                  <button
                    type="button"
                    :class="{ 'is-active': form.wholeLifeCoverage === false }"
                    @click="setWholeLifeCoverage(false)"
                  >
                    아니오
                  </button>
                </div>
              </div>
            </div>

            <div class="insurance-product-create-grid insurance-product-create-grid--coverage-sub">
              <div class="insurance-product-create-field">
                <span>갱신 여부</span>
                <div class="insurance-product-create-toggle">
                  <button
                    type="button"
                    :class="{ 'is-active': form.renewable === true }"
                    @click="setRenewable(true)"
                  >
                    예
                  </button>
                  <button
                    type="button"
                    :class="{ 'is-active': form.renewable === false }"
                    @click="setRenewable(false)"
                  >
                    아니오
                  </button>
                </div>
              </div>

              <label class="insurance-product-create-field">
                <span>갱신 주기 (월)</span>
                <input
                  v-model.trim="form.renewalCycleMonths"
                  type="text"
                  class="insurance-product-create-input"
                  placeholder="-"
                  :disabled="!form.renewable"
                />
              </label>
            </div>
          </div>
        </section>

        <section class="insurance-product-create-section">
          <div class="insurance-product-create-section__title">4. 상품 설명</div>
          <div class="insurance-product-create-section__body insurance-product-create-section__body--description">
            <textarea
              v-model.trim="form.description"
              class="insurance-product-create-textarea"
              rows="6"
              placeholder="보험 상품에 대한 설명을 입력하세요. (주요 보장 내용, 가입 조건, 특이사항 등)"
            />
          </div>
        </section>
      </div>

      <aside class="insurance-product-create-side">
        <section class="insurance-product-create-side__panel">
          <header class="insurance-product-create-side__header">
            <div>
              <h3>보종 관리</h3>
              <p>목록에서 선택하고 바로 추가, 수정, 삭제할 수 있습니다.</p>
            </div>
            <span class="insurance-product-create-side__count">
              총 {{ categoryOptions.length }}개
            </span>
          </header>

          <div class="insurance-product-create-side__editor">
            <label class="insurance-product-create-field">
              <span>보종명</span>
              <input
                v-model.trim="categoryEditor.name"
                type="text"
                class="insurance-product-create-input"
                placeholder="보종명을 입력하세요"
              />
            </label>

            <div class="insurance-product-create-side__buttons">
              <v-btn class="insurance-product-create-side__primary" @click="handleCategoryAdd">
                추가
              </v-btn>
              <v-btn
                variant="outlined"
                class="insurance-product-create-side__secondary"
                :disabled="!selectedCategoryId"
                @click="handleCategoryUpdate"
              >
                수정
              </v-btn>
              <v-btn
                variant="outlined"
                class="insurance-product-create-side__danger"
                :disabled="!selectedCategoryId"
                @click="handleCategoryDelete"
              >
                삭제
              </v-btn>
            </div>

            <button
              v-if="selectedCategoryId"
              type="button"
              class="insurance-product-create-side__clear"
              @click="clearCategorySelection"
            >
              선택 해제
            </button>
          </div>

          <ul class="insurance-product-create-side__list">
            <li
              v-for="category in categoryOptions"
              :key="category.id"
              :class="{ 'is-selected': selectedCategoryId === category.id }"
              @click="selectCategory(category)"
            >
              <div>
                <strong>{{ category.name }}</strong>
                <p v-if="form.categoryName === category.name">현재 상품에 선택됨</p>
                <p v-else>클릭해서 편집 가능</p>
              </div>
            </li>
          </ul>
        </section>
      </aside>
    </div>

    <footer class="insurance-product-create-page__actions">
      <v-btn
        variant="outlined"
        class="insurance-product-create-page__cancel-button"
        @click="goToList"
      >
        취소
      </v-btn>
      <v-btn
        class="insurance-product-create-page__submit-button"
        @click="handleSubmit"
      >
        등록
      </v-btn>
    </footer>
  </section>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const companyOptions = [
  '한화생명',
  '삼성화재해상보험',
  '현대해상화재보험',
  'KB손해보험',
]

const categoryOptions = ref([
  { id: 1, name: '종신보험' },
  { id: 2, name: '정기보험' },
  { id: 3, name: '연금보험' },
  { id: 4, name: '저축보험' },
  { id: 5, name: '변액보험' },
  { id: 6, name: '암보험' },
  { id: 7, name: '건강보험' },
  { id: 8, name: '실손의료보험' },
  { id: 9, name: '어린이보험' },
  { id: 10, name: 'CI보험' },
])

const coverageTypeOptions = [
  { label: '연단위', value: 'YEAR' },
  { label: '나이 기준', value: 'AGE' },
  { label: '종신', value: 'WHOLE_LIFE' },
]

const form = reactive({
  companyName: '',
  categoryName: '',
  productName: '',
  saleStatus: 'ON_SALE',
  saleStartDate: '',
  saleEndDate: '',
  coverageType: 'YEAR',
  coveragePeriodYears: '',
  maxCoverageAge: '',
  wholeLifeCoverage: false,
  renewable: false,
  renewalCycleMonths: '',
  description: '',
})

const categoryEditor = reactive({
  name: '',
})

const selectedCategoryId = ref(null)

function goToList() {
  router.push({ name: 'insurance-products' })
}

function handleCoverageTypeChange(value) {
  form.coverageType = value

  if (value === 'WHOLE_LIFE') {
    form.wholeLifeCoverage = true
    form.coveragePeriodYears = ''
    form.maxCoverageAge = ''
    return
  }

  if (form.wholeLifeCoverage) {
    form.wholeLifeCoverage = false
  }
}

function setWholeLifeCoverage(value) {
  form.wholeLifeCoverage = value

  if (value) {
    form.coverageType = 'WHOLE_LIFE'
    form.coveragePeriodYears = ''
    form.maxCoverageAge = ''
  }
}

function setRenewable(value) {
  form.renewable = value

  if (!value) {
    form.renewalCycleMonths = ''
  }
}

function selectCategory(category) {
  selectedCategoryId.value = category.id
  categoryEditor.name = category.name
  form.categoryName = category.name
}

function clearCategorySelection() {
  selectedCategoryId.value = null
  categoryEditor.name = ''
}

function handleCategoryAdd() {
  const name = categoryEditor.name.trim()
  if (!name) {
    window.alert('보종명을 입력하세요.')
    return
  }

  const exists = categoryOptions.value.some((category) => category.name === name)
  if (exists) {
    window.alert('이미 존재하는 보종명입니다.')
    return
  }

  const nextId = Math.max(0, ...categoryOptions.value.map((category) => category.id)) + 1
  const nextCategory = { id: nextId, name }
  categoryOptions.value.push(nextCategory)
  selectCategory(nextCategory)
}

function handleCategoryUpdate() {
  if (!selectedCategoryId.value) return

  const name = categoryEditor.name.trim()
  if (!name) {
    window.alert('보종명을 입력하세요.')
    return
  }

  const duplicate = categoryOptions.value.some(
    (category) => category.id !== selectedCategoryId.value && category.name === name,
  )
  if (duplicate) {
    window.alert('이미 존재하는 보종명입니다.')
    return
  }

  const target = categoryOptions.value.find((category) => category.id === selectedCategoryId.value)
  if (!target) return

  target.name = name
  form.categoryName = name
}

function handleCategoryDelete() {
  if (!selectedCategoryId.value) return

  const target = categoryOptions.value.find((category) => category.id === selectedCategoryId.value)
  if (!target) return

  categoryOptions.value = categoryOptions.value.filter(
    (category) => category.id !== selectedCategoryId.value,
  )

  if (form.categoryName === target.name) {
    form.categoryName = ''
  }

  clearCategorySelection()
}

function handleSubmit() {
  window.alert('보험 상품 등록 API 연결 전 단계로, 현재는 화면만 구현되어 있습니다.')
}
</script>

<style scoped>
.insurance-product-create-page {
  display: grid;
  gap: 22px;
  min-width: 0;
}

.insurance-product-create-page__breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #9ca3af;
  font-size: 13px;
}

.insurance-product-create-page__breadcrumb button {
  border: 0;
  padding: 0;
  background: transparent;
  color: #4b5563;
  cursor: pointer;
  font: inherit;
}

.insurance-product-create-page__breadcrumb strong {
  color: #111827;
  font-weight: 700;
}

.insurance-product-create-page__breadcrumb-separator {
  color: #d1d5db;
}

.insurance-product-create-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.insurance-product-create-page__header h2 {
  margin: 0;
  font-size: 18px;
  line-height: 1.25;
  color: #111827;
  font-weight: 800;
}

.insurance-product-create-page__header p {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.insurance-product-create-page__back-button,
.insurance-product-create-page__cancel-button,
.insurance-product-create-page__submit-button {
  height: 40px;
  border-radius: 10px;
  padding: 0 18px;
  box-shadow: none;
}

.insurance-product-create-page__back-button,
.insurance-product-create-page__cancel-button {
  border-color: #d1d5db;
  color: #475569;
}

.insurance-product-create-page__submit-button {
  background: #f97316;
  color: #ffffff;
  font-weight: 700;
}

.insurance-product-create-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 24px;
  align-items: start;
}

.insurance-product-create-layout__main {
  display: grid;
  gap: 22px;
}

.insurance-product-create-section,
.insurance-product-create-side__panel {
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}

.insurance-product-create-section__title {
  padding: 16px 24px;
  border-bottom: 1px solid #eef2f7;
  background: #f8fafc;
  color: #1f2937;
  font-size: 15px;
  font-weight: 800;
}

.insurance-product-create-section__body {
  padding: 30px 32px;
}

.insurance-product-create-grid {
  display: grid;
  gap: 24px 24px;
  align-items: start;
}

.insurance-product-create-grid--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.insurance-product-create-grid--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.insurance-product-create-grid--single-row {
  max-width: 760px;
}

.insurance-product-create-grid--product-meta {
  grid-template-columns: minmax(0, 180px) repeat(2, minmax(0, 1fr));
  margin-top: 28px;
}

.insurance-product-create-grid--coverage-main {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.insurance-product-create-grid--coverage-sub {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 28px;
}

.insurance-product-create-grid--spaced {
  margin-top: 28px;
}

.insurance-product-create-section__body--description {
  padding-top: 26px;
}

.insurance-product-create-field {
  display: grid;
  gap: 10px;
}

.insurance-product-create-field span {
  color: #374151;
  font-size: 13px;
  font-weight: 700;
}

.insurance-product-create-field em {
  color: #ef4444;
  font-style: normal;
}

.insurance-product-create-field small {
  color: #9ca3af;
  font-size: 12px;
}

.insurance-product-create-input,
.insurance-product-create-textarea {
  width: 100%;
  border: 1px solid #dbe2ea;
  border-radius: 10px;
  background: #ffffff;
  color: #111827;
  font: inherit;
}

.insurance-product-create-input {
  height: 44px;
  padding: 0 14px;
}

.insurance-product-create-textarea {
  min-height: 180px;
  padding: 14px 16px;
  line-height: 1.6;
  resize: vertical;
}

.insurance-product-create-inline {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
}

.insurance-product-create-inline span {
  color: #6b7280;
  font-size: 13px;
  font-weight: 700;
}

.insurance-product-create-toggle,
.insurance-product-create-segment {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
}

.insurance-product-create-toggle button,
.insurance-product-create-segment button {
  min-width: 58px;
  height: 44px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #4b5563;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  padding: 0 16px;
}

.insurance-product-create-toggle button:first-child,
.insurance-product-create-segment button:first-child {
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
}

.insurance-product-create-toggle button:last-child,
.insurance-product-create-segment button:last-child {
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
}

.insurance-product-create-toggle button + button,
.insurance-product-create-segment button + button {
  border-left: 0;
}

.insurance-product-create-toggle button.is-active,
.insurance-product-create-segment button.is-active {
  background: #f97316;
  border-color: #f97316;
  color: #ffffff;
}

.insurance-product-create-side__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #eef2f7;
  background: #f8fafc;
}

.insurance-product-create-side__header h3 {
  margin: 0;
  font-size: 15px;
  color: #111827;
  font-weight: 800;
}

.insurance-product-create-side__header p {
  margin: 6px 0 0;
  color: #9ca3af;
  font-size: 12px;
  line-height: 1.4;
}

.insurance-product-create-side__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: #fff7ed;
  color: #f97316;
  font-size: 12px;
  font-weight: 700;
}

.insurance-product-create-side__editor {
  display: grid;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #eef2f7;
}

.insurance-product-create-side__buttons {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.insurance-product-create-side__primary,
.insurance-product-create-side__secondary,
.insurance-product-create-side__danger {
  height: 34px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  box-shadow: none;
}

.insurance-product-create-side__primary {
  background: #f97316;
  color: #ffffff;
}

.insurance-product-create-side__secondary {
  border-color: #d1d5db;
  color: #475569;
}

.insurance-product-create-side__danger {
  border-color: #fecaca;
  color: #dc2626;
}

.insurance-product-create-side__clear {
  justify-self: flex-end;
  border: 0;
  padding: 0;
  background: transparent;
  color: #f97316;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
}

.insurance-product-create-side__list {
  list-style: none;
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 14px 16px 16px;
  max-height: 520px;
  overflow-y: auto;
}

.insurance-product-create-side__list li {
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  color: #374151;
  cursor: pointer;
}

.insurance-product-create-side__list li strong {
  display: block;
  color: #111827;
  font-size: 14px;
}

.insurance-product-create-side__list li p {
  margin: 4px 0 0;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.4;
}

.insurance-product-create-side__list li.is-selected {
  border-color: #fdba74;
  background: #fff7ed;
}

.insurance-product-create-page__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 1180px) {
  .insurance-product-create-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .insurance-product-create-grid--two,
  .insurance-product-create-grid--three,
  .insurance-product-create-grid--product-meta,
  .insurance-product-create-grid--coverage-main,
  .insurance-product-create-grid--coverage-sub {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .insurance-product-create-page__header {
    display: grid;
    grid-template-columns: 1fr;
  }

  .insurance-product-create-side__buttons {
    grid-template-columns: 1fr;
  }
}
</style>
