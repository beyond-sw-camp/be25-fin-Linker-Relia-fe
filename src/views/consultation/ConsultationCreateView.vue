<template>
  <section class="journal-page">
    <nav class="journal-breadcrumb" aria-label="breadcrumb">
      <button type="button" @click="goBack">
        <v-icon icon="mdi-arrow-left" size="14" />
        상담 관리로 돌아가기
      </button>
      <span>/</span>
      <strong>{{ isEditMode ? '임시저장 상담일지 수정' : '상담일지 작성' }}</strong>
    </nav>

    <form class="journal-workspace" @submit.prevent="submitConsultation">
      <aside class="journal-side">
        <section class="side-card">
          <h3>상담 정보</h3>

          <label class="field">
            <span>상담 일시</span>
            <input v-model="form.consultedAt" class="control" type="datetime-local" />
          </label>

          <div class="field">
            <span>상담 형식</span>
            <div class="pill-row">
              <button
                v-for="option in channelOptions"
                :key="option.value"
                type="button"
                class="pill"
                :class="{ 'is-active': form.consultationChannel === option.value }"
                @click="form.consultationChannel = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div class="field">
            <span>상담 유형</span>
            <div class="pill-row">
              <button
                v-for="option in typeOptions"
                :key="option.value"
                type="button"
                class="pill pill--type"
                :class="{ 'is-active': form.consultationType === option.value }"
                @click="selectType(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
        </section>

        <section class="side-card">
          <h3>고객 기본 정보</h3>

          <div v-if="isNewContract" class="segmented">
            <button
              type="button"
              :class="{ 'is-active': customerMode === 'EXISTING' }"
              @click="customerMode = 'EXISTING'"
            >
              기존 고객
            </button>
            <button
              type="button"
              :class="{ 'is-active': customerMode === 'PROSPECT' }"
              @click="customerMode = 'PROSPECT'"
            >
              신규 고객
            </button>
          </div>

          <template v-if="needsExistingCustomer">
            <label class="field">
              <span>기존 고객 불러오기</span>
              <div class="search-control">
                <input
                  v-model.trim="customerKeyword"
                  class="control"
                  placeholder="고객명 검색"
                  @keyup.enter.prevent="loadCustomers"
                />
                <button type="button" @click="loadCustomers">
                  <v-icon icon="mdi-magnify" size="15" />
                </button>
              </div>
            </label>

            <div class="customer-list">
              <button
                v-for="customer in customers"
                :key="customer.customerId"
                type="button"
                :class="{ 'is-selected': selectedCustomer?.customerId === customer.customerId }"
                @click="selectCustomer(customer)"
              >
                <strong>{{ customer.customerName }}</strong>
                <span>{{ formatPhoneDisplay(customer.phoneNumber || customer.customerPhone || '') || '-' }}</span>
              </button>
              <p v-if="!customers.length">검색된 고객이 없습니다.</p>
            </div>
          </template>

          <template v-else>
            <div class="prospect-grid">
              <label class="field">
                <span>고객명</span>
                <input v-model.trim="customerInfo.customerName" class="control" />
              </label>

              <label class="field">
                <span>성별</span>
                <select v-model="customerInfo.customerGender" class="control">
                  <option value="">선택</option>
                  <option value="MALE">남성</option>
                  <option value="FEMALE">여성</option>
                </select>
              </label>

              <label class="field">
                <span>생년월일</span>
                <input v-model="customerInfo.customerBirthDate" class="control" type="date" />
              </label>

              <label class="field">
                <span>연락처</span>
                <input
                  :value="customerInfo.customerPhone"
                  class="control"
                  inputmode="numeric"
                  maxlength="13"
                  placeholder="010-1234-5678"
                  @input="updatePhone($event.target.value)"
                />
              </label>

              <div class="field field--wide">
                <span>이메일</span>
                <div class="email-row">
                  <input v-model.trim="emailLocalPart" class="control" placeholder="email" />
                  <span>@</span>
                  <input
                    v-if="emailDomainMode === 'custom'"
                    v-model.trim="emailDomainCustom"
                    class="control"
                    placeholder="domain.com"
                  />
                  <select v-else v-model="emailDomainSelected" class="control">
                    <option v-for="option in emailDomainOptions" :key="option" :value="option">
                      {{ option }}
                    </option>
                  </select>
                  <select v-model="emailDomainMode" class="control email-row__mode">
                    <option value="selected">도메인 선택</option>
                    <option value="custom">직접 입력</option>
                  </select>
                </div>
              </div>

              <div class="field field--wide">
                <span>주소</span>
                <div class="address-box">
                  <div class="address-box__search">
                    <input
                      v-model.trim="addressSearchKeyword"
                      class="control"
                      placeholder="도로명주소를 검색하세요"
                      @focus="showAddressResults = true"
                      @input="showAddressResults = true"
                    />
                    <button type="button" class="address-box__button" @click="showAddressResults = true">
                      주소 검색
                    </button>
                  </div>
                  <div v-if="showAddressResults" class="address-results">
                    <button
                      v-for="address in filteredAddressOptions"
                      :key="`${address.zipcode}-${address.road}`"
                      type="button"
                      class="address-results__item"
                      @click="selectAddress(address)"
                    >
                      <strong>{{ address.road }}</strong>
                      <span>{{ address.zipcode }} · {{ address.jibun }}</span>
                    </button>
                    <p v-if="filteredAddressOptions.length === 0">검색 결과가 없습니다.</p>
                  </div>
                  <div class="address-box__inputs">
                    <input
                      v-model.trim="customerInfo.customerZipcode"
                      class="control address-box__zipcode"
                      placeholder="우편번호"
                      readonly
                    />
                    <input
                      v-model.trim="customerInfo.customerAddressRoad"
                      class="control"
                      placeholder="도로명주소"
                      readonly
                    />
                    <input
                      v-model.trim="customerInfo.customerAddressDetail"
                      class="control"
                      placeholder="상세주소 입력"
                    />
                  </div>
                </div>
              </div>

              <label class="field">
                <span>직업</span>
                <select v-model="customerInfo.customerJob" class="control">
                  <option value="">선택</option>
                  <option v-for="option in jobOptions" :key="option" :value="option">{{ option }}</option>
                </select>
              </label>

              <label v-if="customerInfo.customerJob === '기타/직접입력'" class="field">
                <span>직업 직접 입력</span>
                <input v-model.trim="customerInfo.customerJobCustom" class="control" />
              </label>

              <label class="field">
                <span>회사명</span>
                <input v-model.trim="customerInfo.customerCompanyName" class="control" />
              </label>

              <label class="field">
                <span>연 소득</span>
                <input
                  :value="formatMoneyDisplay(customerInfo.customerAnnualIncome)"
                  class="control"
                  inputmode="numeric"
                  placeholder="68,000,000"
                  @input="updateMoneyField('customerAnnualIncome', $event.target.value)"
                />
              </label>

              <label class="field">
                <span>자산 규모</span>
                <input
                  :value="formatMoneyDisplay(customerInfo.customerAssetSize)"
                  class="control"
                  inputmode="numeric"
                  placeholder="150,000,000"
                  @input="updateMoneyField('customerAssetSize', $event.target.value)"
                />
              </label>

              <label class="field field--wide">
                <span>부채 현황</span>
                <input v-model.trim="customerInfo.customerDebtStatus" class="control" />
              </label>

              <label class="field">
                <span>혼인 상태</span>
                <select v-model="customerInfo.customerMaritalStatus" class="control">
                  <option value="">선택</option>
                  <option value="SINGLE">미혼</option>
                  <option value="MARRIED">기혼</option>
                </select>
              </label>

              <label class="field">
                <span>부양가족 수</span>
                <input v-model="customerInfo.customerDependentsCount" class="control" inputmode="numeric" />
              </label>

              <label class="check-line">
                <input v-model="customerInfo.customerIsSmoker" type="checkbox" />
                흡연 여부
              </label>

              <label class="check-line">
                <input v-model="customerInfo.customerIsDrinker" type="checkbox" />
                음주 여부
              </label>

              <div class="field field--wide">
                <span>기저질환</span>
                <div class="disease-picker">
                  <select v-model="selectedDisease" class="control">
                    <option value="">기저질환 선택</option>
                    <option v-for="option in diseaseOptions" :key="option" :value="option">{{ option }}</option>
                  </select>
                  <button type="button" class="address-box__button" @click="addDisease">
                    추가
                  </button>
                </div>
                <div class="selected-disease-list">
                  <span v-for="disease in customerInfo.underlyingDiseases" :key="disease" class="selected-disease-chip">
                    {{ disease }}
                    <button type="button" @click="removeDisease(disease)">×</button>
                  </span>
                </div>
              </div>
            </div>
          </template>
        </section>
      </aside>

      <main class="journal-main">
        <section v-if="isEditMode" class="draft-banner">
          <div>
            <span>임시저장 상담일지</span>
            <strong>저장된 내용을 이어서 수정 중입니다.</strong>
          </div>
          <div class="draft-progress">
            <span></span>
          </div>
        </section>

        <section class="stt-card">
          <v-icon icon="mdi-microphone-outline" size="18" />
          <div>
            <strong>STT 녹취 - 텍스트 기능 준비</strong>
            <p>상담 녹취를 텍스트로 변환해 상담일지 초안을 만드는 영역입니다.</p>
          </div>
          <div class="stt-actions">
            <button type="button">STT 녹음 시작</button>
            <button type="button">파일 내용 불러오기</button>
            <button type="button">텍스트 검토</button>
          </div>
        </section>

        <section v-if="needsContract" class="form-card">
          <h3>1. 계약 정보 선택</h3>
          <div class="contract-grid">
            <label
              v-for="contract in contracts"
              :key="contract.contractId"
              class="contract-option"
              :class="{ 'is-selected': form.contractId === contract.contractId }"
            >
              <input v-model="form.contractId" type="radio" :value="contract.contractId" />
              <span>
                <strong>{{ contract.insuranceProductName || contract.contractCode || contract.contractId }}</strong>
                <em>{{ contract.insuranceCompanyName || '보험사 미지정' }}</em>
              </span>
            </label>
            <p v-if="!contracts.length" class="empty-text">고객을 선택하면 보유 계약을 불러옵니다.</p>
          </div>
        </section>

        <section class="form-card">
          <h3>{{ needsContract ? '2' : '1' }}. {{ typeTitle }}</h3>
          <div v-if="form.consultationType === 'NEW_CONTRACT'" class="compact-grid">
            <label class="field">
              <span>월 소득</span>
              <input
                :value="formatMoneyDisplay(newDetail.monthlyIncome)"
                class="control"
                inputmode="numeric"
                placeholder="5,600,000"
                @input="updateMoneyField('monthlyIncome', $event.target.value, newDetail)"
              />
            </label>

            <label class="field">
              <span>월 보험료 지출</span>
              <input
                :value="formatMoneyDisplay(newDetail.monthlyInsurancePremium)"
                class="control"
                inputmode="numeric"
                placeholder="210,000"
                @input="updateMoneyField('monthlyInsurancePremium', $event.target.value, newDetail)"
              />
            </label>

            <label class="field">
              <span>보험 우선순위</span>
              <input
                v-model.trim="newDetail.insurancePriority"
                class="control"
                placeholder="가족 보장과 3대 질환 보장 강화 희망"
              />
            </label>

            <label class="check-line">
              <input v-model="newDetail.hasExistingInsurance" type="checkbox" />
              기존 보험 보유
            </label>

            <label class="field field--wide">
              <span>희망 보장 유형</span>
              <input v-model.trim="newDetail.coverageTypesText" class="control" placeholder="CANCER, HEART, LIFE, DEATH" />
            </label>

            <label class="field field--wide">
              <span>제안 상품 코드</span>
              <input v-model.trim="newDetail.proposedProductCodesText" class="control" placeholder="LP005" />
            </label>

            <label class="field field--wide">
              <span>기존 보험 메모</span>
              <textarea
                v-model.trim="newDetail.existingInsuranceNote"
                class="control textarea"
                placeholder="종신보험 1건, 실손보험 1건 유지 중"
              ></textarea>
            </label>
          </div>

          <div v-else-if="form.consultationType === 'CLAIM'" class="compact-grid">
            <label class="field">
              <span>청구 사유</span>
              <input v-model.trim="claimDetail.claimReason" class="control" />
            </label>
            <label class="field">
              <span>사고일</span>
              <input v-model="claimDetail.incidentDate" class="control" type="date" />
            </label>
            <label class="field">
              <span>예상 청구 금액</span>
              <input v-model="claimDetail.claimAmount" class="control" inputmode="numeric" />
            </label>
            <label class="field field--wide">
              <span>필요 서류 및 메모</span>
              <textarea v-model.trim="claimDetail.memo" class="control textarea"></textarea>
            </label>
          </div>

          <div v-else-if="form.consultationType === 'RENEWAL'" class="compact-grid">
            <label class="field">
              <span>갱신 사유</span>
              <input v-model.trim="renewalDetail.renewalReason" class="control" />
            </label>
            <label class="field">
              <span>희망 갱신일</span>
              <input v-model="renewalDetail.desiredRenewalDate" class="control" type="date" />
            </label>
            <label class="field">
              <span>예상 보험료</span>
              <input v-model="renewalDetail.expectedPremium" class="control" inputmode="numeric" />
            </label>
            <label class="field field--wide">
              <span>갱신 검토 메모</span>
              <textarea v-model.trim="renewalDetail.memo" class="control textarea"></textarea>
            </label>
          </div>

          <div v-else class="cancel-grid">
            <label v-for="field in cancelBooleanFields" :key="field.key" class="check-tile">
              <input v-model="cancelDetail[field.key]" type="checkbox" />
              <span>{{ field.label }}</span>
            </label>
            <label class="field">
              <span>유지 가능성</span>
              <select v-model="cancelDetail.retentionPossibility" class="control">
                <option value="HIGH">높음</option>
                <option value="MEDIUM">보통</option>
                <option value="LOW">낮음</option>
              </select>
            </label>
          </div>
        </section>

        <section class="form-card">
          <h3>{{ needsContract ? '3' : '2' }}. 특이사항</h3>
          <label class="field">
            <span>상담 내용</span>
            <textarea
              v-model.trim="form.specialNote"
              class="control textarea textarea--large"
              placeholder="고객 요구사항, 설명 내용, 후속 조치 계획을 입력하세요."
            ></textarea>
          </label>
          <label class="field">
            <span>후속 상담 예정일</span>
            <input v-model="form.nextScheduledAt" class="control" type="datetime-local" />
          </label>
        </section>

        <p v-if="message" class="message" :class="`message--${messageType}`">{{ message }}</p>

        <div class="journal-actions">
          <span>입력 내용은 저장 또는 임시저장 전까지 서버에 전송되지 않습니다.</span>
          <div>
            <button type="button" class="subtle-button" @click="goBack">취소</button>
            <button type="button" class="outline-button" :disabled="isSubmitting" @click="saveDraft">임시저장</button>
            <button type="submit" class="save-button" :disabled="isSubmitting">
              {{ isSubmitting ? '저장 중' : '저장' }}
            </button>
          </div>
        </div>
      </main>
    </form>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { createConsultation } from '../../api/consultations'
import { getCustomerContracts } from '../../api/contracts'
import { getCustomers } from '../../api/customers'
import { getConsultationDraft, saveConsultationDraft } from '../../utils/consultationDrafts'

const route = useRoute()
const router = useRouter()

const typeOptions = [
  { label: '신규', value: 'NEW_CONTRACT' },
  { label: '청구', value: 'CLAIM' },
  { label: '갱신', value: 'RENEWAL' },
  { label: '해지', value: 'TERMINATION' },
]

const channelOptions = [
  { label: '방문', value: 'VISIT' },
  { label: '전화', value: 'PHONE' },
  { label: '메시지', value: 'MESSAGE' },
]

const jobOptions = [
  '학생',
  '직장인',
  '공무원·교직원',
  '전문직',
  '자영업자',
  '프리랜서',
  '군인',
  '주부',
  '무직',
  '은퇴자',
  '기타/직접입력',
]

const diseaseOptions = [
  '고혈압',
  '당뇨병',
  '고지혈증',
  '협심증',
  '심근경색',
  '뇌졸중',
  '암',
  '갑상선암',
  '간질환',
  '신장질환',
  '우울증',
  '불안장애',
  '디스크',
  '천식',
  '갑상선질환',
]

const diseaseCodeMap = {
  고혈압: 'HYPERTENSION',
  당뇨병: 'DIABETES',
  고지혈증: 'HYPERLIPIDEMIA',
  협심증: 'ANGINA',
  심근경색: 'MYOCARDIAL_INFARCTION',
  뇌졸중: 'STROKE',
  암: 'CANCER',
  갑상선암: 'THYROID_CANCER',
  간질환: 'LIVER_DISEASE',
  신장질환: 'KIDNEY_DISEASE',
  우울증: 'DEPRESSION',
  불안장애: 'ANXIETY_DISORDER',
  디스크: 'DISC_DISEASE',
  천식: 'ASTHMA',
  갑상선질환: 'THYROID_DISEASE',
}

const emailDomainOptions = ['naver.com', 'gmail.com', 'daum.net', 'kakao.com', 'outlook.com']

const addressOptions = [
  { zipcode: '06236', road: '서울특별시 강남구 테헤란로 152', jibun: '역삼동 737' },
  { zipcode: '04147', road: '서울특별시 마포구 양화로 45', jibun: '서교동 374-10' },
  { zipcode: '07242', road: '서울특별시 영등포구 여의대로 24', jibun: '여의도동 23' },
  { zipcode: '48058', road: '부산광역시 해운대구 센텀중앙로 97', jibun: '우동 1495' },
  { zipcode: '35229', road: '대전광역시 서구 둔산로 100', jibun: '둔산동 1413' },
]

const cancelBooleanFields = [
  { key: 'premiumBurden', label: '보험료 부담' },
  { key: 'renewalPremiumBurden', label: '갱신 보험료 부담' },
  { key: 'paymentDifficulty', label: '납입 유지 어려움' },
  { key: 'coverageDissatisfaction', label: '보장 불만' },
  { key: 'duplicateInsurance', label: '중복 가입' },
  { key: 'productRemodelingReview', label: '상품 리모델링 검토' },
  { key: 'comparingOtherCompany', label: '타사 상품 비교' },
  { key: 'movingToOtherCompany', label: '타사 이동 예정' },
  { key: 'plannerContactDissatisfaction', label: '설계사 연락 불만' },
  { key: 'managementDissatisfaction', label: '관리 부족 불만' },
]

const isSubmitting = ref(false)
const message = ref('')
const messageType = ref('error')
const customerMode = ref('EXISTING')
const customerKeyword = ref('')
const customers = ref([])
const selectedCustomer = ref(null)
const contracts = ref([])
const selectedDisease = ref('')
const addressSearchKeyword = ref('')
const showAddressResults = ref(false)
const emailLocalPart = ref('')
const emailDomainSelected = ref(emailDomainOptions[0])
const emailDomainCustom = ref('')
const emailDomainMode = ref('selected')

const form = reactive({
  consultationType: 'NEW_CONTRACT',
  consultationChannel: 'VISIT',
  consultedAt: toLocalInputValue(new Date()),
  consultationContent: '',
  specialNote: '',
  nextScheduledAt: '',
  contractId: '',
})

const customerInfo = reactive({
  customerName: '',
  customerGender: '',
  customerBirthDate: '',
  customerPhone: '',
  customerEmail: '',
  customerZipcode: '',
  customerAddressRoad: '',
  customerAddressDetail: '',
  customerJob: '',
  customerJobCustom: '',
  customerCompanyName: '',
  customerAnnualIncome: '',
  customerAssetSize: '',
  customerDebtStatus: '',
  customerIsSmoker: false,
  customerIsDrinker: false,
  customerMaritalStatus: '',
  customerDependentsCount: '',
  underlyingDiseases: [],
})

const newDetail = reactive({
  monthlyIncome: '',
  hasExistingInsurance: false,
  monthlyInsurancePremium: '',
  existingInsuranceNote: '',
  insurancePriority: '',
  coverageTypesText: '',
  proposedProductCodesText: '',
})

const claimDetail = reactive({
  claimReason: '',
  incidentDate: '',
  claimAmount: '',
  memo: '',
})

const renewalDetail = reactive({
  renewalReason: '',
  desiredRenewalDate: '',
  expectedPremium: '',
  memo: '',
})

const cancelDetail = reactive({
  premiumBurden: false,
  renewalPremiumBurden: false,
  paymentDifficulty: false,
  coverageDissatisfaction: false,
  duplicateInsurance: false,
  productRemodelingReview: false,
  comparingOtherCompany: false,
  movingToOtherCompany: false,
  plannerContactDissatisfaction: false,
  managementDissatisfaction: false,
  retentionPossibility: 'MEDIUM',
})

const isEditMode = computed(() => route.name === 'consultation-draft-edit')
const isNewContract = computed(() => form.consultationType === 'NEW_CONTRACT')
const needsExistingCustomer = computed(() => !isNewContract.value || customerMode.value === 'EXISTING')
const needsContract = computed(() => ['CLAIM', 'RENEWAL', 'TERMINATION'].includes(form.consultationType))
const typeTitle = computed(() => ({
  NEW_CONTRACT: '신규 가입 상담',
  CLAIM: '보험금 청구 상담',
  RENEWAL: '갱신 상담',
  TERMINATION: '해지 상담',
})[form.consultationType])
const filteredAddressOptions = computed(() => {
  const keyword = addressSearchKeyword.value.trim().toLowerCase()
  if (!keyword) return addressOptions
  return addressOptions.filter((item) => (
    item.road.toLowerCase().includes(keyword) ||
    item.jibun.toLowerCase().includes(keyword) ||
    item.zipcode.includes(keyword)
  ))
})

watch(
  () => form.consultationType,
  () => {
    if (!isNewContract.value) customerMode.value = 'EXISTING'
    form.contractId = ''
    contracts.value = []
  },
)

watch(
  () => selectedCustomer.value?.customerId,
  async (customerId) => {
    form.contractId = ''
    contracts.value = []
    if (customerId && needsContract.value) await loadContracts(customerId)
  },
)

watch(needsContract, async (value) => {
  form.contractId = ''
  contracts.value = []
  if (value && selectedCustomer.value?.customerId) await loadContracts(selectedCustomer.value.customerId)
})

watch(
  () => [emailLocalPart.value, emailDomainSelected.value, emailDomainCustom.value, emailDomainMode.value],
  () => {
    const domain = emailDomainMode.value === 'custom' ? emailDomainCustom.value.trim() : emailDomainSelected.value
    customerInfo.customerEmail = emailLocalPart.value && domain ? `${emailLocalPart.value.trim()}@${domain}` : ''
  },
)

onMounted(async () => {
  if (isEditMode.value) hydrateDraft()
  await loadCustomers()
})

function selectType(type) {
  form.consultationType = type
}

async function loadCustomers() {
  try {
    const response = await getCustomers({
      page: 1,
      size: 5,
      ...(customerKeyword.value ? { customerName: customerKeyword.value } : {}),
    })
    const pageResult = response?.result?.customers ?? response?.result
    const rows = Array.isArray(pageResult?.content) ? pageResult.content : pageResult
    customers.value = Array.isArray(rows) ? rows : []
  } catch {
    customers.value = []
  }
}

function selectCustomer(customer) {
  selectedCustomer.value = {
    customerId: customer.customerId,
    customerName: customer.customerName,
    customerPhone: customer.customerPhone,
    phoneNumber: customer.phoneNumber,
  }
}

async function loadContracts(customerId) {
  try {
    const response = await getCustomerContracts(customerId)
    contracts.value = Array.isArray(response?.result) ? response.result : []
  } catch {
    contracts.value = []
  }
}

function hydrateDraft() {
  const draft = getConsultationDraft(route.params.draftId)
  if (!draft) {
    message.value = '임시저장 상담일지를 찾을 수 없습니다.'
    return
  }

  Object.assign(form, {
    consultationType: draft.consultationType || 'NEW_CONTRACT',
    consultationChannel: draft.consultationChannel || 'VISIT',
    consultedAt: draft.consultedAt || toLocalInputValue(new Date()),
    consultationContent: draft.consultationContent || draft.specialNote || '',
    specialNote: draft.specialNote || draft.consultationContent || '',
    nextScheduledAt: draft.nextScheduledAt || '',
    contractId: draft.contractId || '',
  })

  customerMode.value = draft.customerMode || 'EXISTING'
  selectedCustomer.value = draft.selectedCustomer || null

  if (draft.customerInfo) {
    Object.assign(customerInfo, draft.customerInfo)
    hydrateEmailFields(draft.customerInfo.customerEmail)
  }

  Object.assign(newDetail, draft.newDetail || {})
  Object.assign(claimDetail, draft.claimDetail || {})
  Object.assign(renewalDetail, draft.renewalDetail || {})
  Object.assign(cancelDetail, draft.cancelDetail || {})
}

function hydrateEmailFields(emailValue) {
  const email = String(emailValue || '')
  if (!email.includes('@')) return
  const [localPart, domain] = email.split('@')
  emailLocalPart.value = localPart
  if (emailDomainOptions.includes(domain)) {
    emailDomainMode.value = 'selected'
    emailDomainSelected.value = domain
    emailDomainCustom.value = ''
  } else {
    emailDomainMode.value = 'custom'
    emailDomainCustom.value = domain
  }
}

function buildDraftPayload() {
  return {
    consultationType: form.consultationType,
    consultationChannel: form.consultationChannel,
    consultedAt: form.consultedAt,
    consultationContent: form.specialNote,
    specialNote: form.specialNote,
    nextScheduledAt: form.nextScheduledAt,
    contractId: form.contractId,
    customerMode: customerMode.value,
    selectedCustomer: selectedCustomer.value,
    customerInfo: { ...customerInfo },
    newDetail: { ...newDetail },
    claimDetail: { ...claimDetail },
    renewalDetail: { ...renewalDetail },
    cancelDetail: { ...cancelDetail },
    customerName: selectedCustomer.value?.customerName || customerInfo.customerName,
  }
}

function saveDraft() {
  const saved = saveConsultationDraft(buildDraftPayload(), route.params.draftId)
  messageType.value = 'success'
  message.value = '상담일지를 임시저장했습니다.'
  if (!isEditMode.value) {
    router.replace({ name: 'consultation-draft-edit', params: { draftId: saved.id } })
  }
}

async function submitConsultation() {
  const validationMessage = validateForm()
  if (validationMessage) {
    messageType.value = 'error'
    message.value = validationMessage
    return
  }

  isSubmitting.value = true

  try {
    await createConsultation(buildSubmitPayload())
    messageType.value = 'success'
    message.value = '상담일지를 저장했습니다.'
    window.setTimeout(() => router.push({ name: 'fp-consultations' }), 500)
  } catch (error) {
    messageType.value = 'error'
    message.value = error.response?.data?.message || error.message || '상담일지 저장에 실패했습니다.'
  } finally {
    isSubmitting.value = false
  }
}

function buildSubmitPayload() {
  const payload = {
    consultationType: form.consultationType,
    consultationChannel: form.consultationChannel,
    consultedAt: toApiDateTime(form.consultedAt),
    consultationContent: form.specialNote,
    specialNote: form.specialNote,
    nextScheduledAt: form.nextScheduledAt ? toApiDateTime(form.nextScheduledAt) : null,
    customerId: needsExistingCustomer.value ? selectedCustomer.value?.customerId : null,
    contractId: needsContract.value ? form.contractId : null,
  }

  if (!needsExistingCustomer.value) {
    payload.customerInfo = buildCustomerInfoPayload()
  }

  if (form.consultationType === 'NEW_CONTRACT') {
    payload.newDetail = {
      monthlyIncome: parseMoneyOrNull(newDetail.monthlyIncome),
      hasExistingInsurance: Boolean(newDetail.hasExistingInsurance),
      monthlyInsurancePremium: parseMoneyOrNull(newDetail.monthlyInsurancePremium),
      existingInsuranceNote: newDetail.existingInsuranceNote || null,
      insurancePriority: newDetail.insurancePriority || null,
      coverageTypes: splitCommaList(newDetail.coverageTypesText),
      proposedProductCodes: splitCommaList(newDetail.proposedProductCodesText),
    }
  }

  if (form.consultationType === 'CLAIM') {
    payload.claimDetail = {
      claimReason: claimDetail.claimReason || null,
      incidentDate: claimDetail.incidentDate || null,
      claimAmount: parseMoneyOrNull(claimDetail.claimAmount),
      memo: claimDetail.memo || null,
    }
  }

  if (form.consultationType === 'RENEWAL') {
    payload.renewalDetail = {
      renewalReason: renewalDetail.renewalReason || null,
      desiredRenewalDate: renewalDetail.desiredRenewalDate || null,
      expectedPremium: parseMoneyOrNull(renewalDetail.expectedPremium),
      memo: renewalDetail.memo || null,
    }
  }

  if (form.consultationType === 'TERMINATION') {
    payload.cancelDetail = { ...cancelDetail }
  }

  return payload
}

function buildCustomerInfoPayload() {
  return {
    customerName: customerInfo.customerName,
    customerGender: customerInfo.customerGender || null,
    customerBirthDate: customerInfo.customerBirthDate || null,
    customerPhone: customerInfo.customerPhone || null,
    customerEmail: customerInfo.customerEmail || null,
    customerZipcode: customerInfo.customerZipcode || null,
    customerAddressRoad: customerInfo.customerAddressRoad || null,
    customerAddressDetail: customerInfo.customerAddressDetail || null,
    customerJob: customerInfo.customerJob === '기타/직접입력'
      ? (customerInfo.customerJobCustom || null)
      : (customerInfo.customerJob || null),
    customerCompanyName: customerInfo.customerCompanyName || null,
    customerAnnualIncome: parseMoneyOrNull(customerInfo.customerAnnualIncome),
    customerAssetSize: parseMoneyOrNull(customerInfo.customerAssetSize),
    customerDebtStatus: customerInfo.customerDebtStatus || null,
    customerIsSmoker: Boolean(customerInfo.customerIsSmoker),
    customerIsDrinker: Boolean(customerInfo.customerIsDrinker),
    customerMaritalStatus: customerInfo.customerMaritalStatus || null,
    customerDependentsCount: parseIntegerOrNull(customerInfo.customerDependentsCount),
    underlyingDiseaseCodes: customerInfo.underlyingDiseases.map((item) => diseaseCodeMap[item] || item),
  }
}

function validateForm() {
  if (!form.consultedAt) return '상담 일시를 입력해주세요.'
  if (!form.specialNote) return '상담 내용을 입력해주세요.'
  if (needsExistingCustomer.value && !selectedCustomer.value) return '고객을 선택해주세요.'
  if (!needsExistingCustomer.value && (!customerInfo.customerName || !customerInfo.customerPhone)) {
    return '신규 고객의 이름과 연락처를 입력해주세요.'
  }
  if (!needsExistingCustomer.value && (!customerInfo.customerZipcode || !customerInfo.customerAddressRoad)) {
    return '주소 검색 후 주소를 선택해주세요.'
  }
  if (needsContract.value && !form.contractId) return '계약을 선택해주세요.'
  return ''
}

function updatePhone(rawValue) {
  customerInfo.customerPhone = formatPhoneDisplay(rawValue)
}

function updateMoneyField(key, rawValue, target = customerInfo) {
  target[key] = String(rawValue || '').replace(/[^\d]/g, '')
}

function formatPhoneDisplay(rawValue) {
  const digits = String(rawValue || '').replace(/[^\d]/g, '').slice(0, 11)
  if (digits.length < 4) return digits
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

function formatMoneyDisplay(rawValue) {
  const digits = String(rawValue || '').replace(/[^\d]/g, '')
  return digits ? Number(digits).toLocaleString('ko-KR') : ''
}

function addDisease() {
  if (!selectedDisease.value || customerInfo.underlyingDiseases.includes(selectedDisease.value)) return
  customerInfo.underlyingDiseases = [...customerInfo.underlyingDiseases, selectedDisease.value]
  selectedDisease.value = ''
}

function removeDisease(disease) {
  customerInfo.underlyingDiseases = customerInfo.underlyingDiseases.filter((item) => item !== disease)
}

function selectAddress(address) {
  customerInfo.customerZipcode = address.zipcode
  customerInfo.customerAddressRoad = address.road
  addressSearchKeyword.value = address.road
  showAddressResults.value = false
}

function goBack() {
  router.push(isEditMode.value ? { name: 'consultation-drafts' } : { name: 'fp-consultations' })
}

function parseMoneyOrNull(value) {
  const digits = String(value || '').replace(/[^\d]/g, '')
  const parsed = Number(digits)
  return parsed > 0 ? parsed : null
}

function parseIntegerOrNull(value) {
  const digits = String(value || '').replace(/[^\d]/g, '')
  const parsed = Number.parseInt(digits, 10)
  return Number.isNaN(parsed) ? null : parsed
}

function splitCommaList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function toLocalInputValue(value) {
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function toApiDateTime(value) {
  return value ? value.replace(' ', 'T') : value
}
</script>

<style scoped>
.prospect-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.email-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) 128px;
  gap: 8px;
  align-items: center;
}

.email-row span {
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}

.email-row__mode {
  min-width: 0;
}

.address-box {
  display: grid;
  gap: 8px;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fafafa;
}

.address-box__search {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 92px;
  gap: 8px;
}

.address-box__button {
  height: 34px;
  padding: 0 12px;
  border: 1px solid #f97316;
  border-radius: 6px;
  background: #fff7ed;
  color: #f97316;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.address-results {
  display: grid;
  gap: 6px;
  max-height: 180px;
  overflow-y: auto;
  padding: 4px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

.address-results__item {
  display: grid;
  gap: 2px;
  padding: 10px;
  border: 1px solid #f1f5f9;
  border-radius: 6px;
  background: #ffffff;
  text-align: left;
  cursor: pointer;
}

.address-results__item:hover {
  border-color: #fed7aa;
  background: #fff7ed;
}

.address-results__item strong {
  color: #111827;
  font-size: 12px;
}

.address-results__item span,
.address-results p {
  color: #64748b;
  font-size: 11px;
}

.address-box__inputs {
  display: grid;
  grid-template-columns: 108px minmax(0, 1fr);
  gap: 8px;
}

.address-box__zipcode {
  text-align: center;
}

.disease-picker {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 72px;
  gap: 8px;
}

.selected-disease-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.selected-disease-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: #fff7ed;
  color: #f97316;
  font-size: 11px;
  font-weight: 800;
}

.selected-disease-chip button {
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

@media (max-width: 900px) {
  .prospect-grid,
  .email-row,
  .address-box__search,
  .address-box__inputs,
  .disease-picker {
    grid-template-columns: 1fr;
  }
}
</style>
