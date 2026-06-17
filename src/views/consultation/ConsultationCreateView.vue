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

            <div v-if="customerSearchTouched" class="customer-list">
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

            <div v-if="selectedCustomer" class="selected-customer-panel">
              <dl>
                <div>
                  <dt>고객명</dt>
                  <dd>{{ customerInfo.customerName || '-' }}</dd>
                </div>
                <div>
                  <dt>생년월일</dt>
                  <dd>{{ customerInfo.customerBirthDate || '-' }}</dd>
                </div>
                <div>
                  <dt>성별</dt>
                  <dd>{{ getGenderLabel(customerInfo.customerGender) }}</dd>
                </div>
                <div>
                  <dt>연락처</dt>
                  <dd>{{ customerInfo.customerPhone || '-' }}</dd>
                </div>
                <div>
                  <dt>이메일</dt>
                  <dd>{{ customerInfo.customerEmail || '-' }}</dd>
                </div>
                <div>
                  <dt>주소</dt>
                  <dd>{{ customerAddressText }}</dd>
                </div>
                <div>
                  <dt>직업 및 직무</dt>
                  <dd>{{ customerJobText }}</dd>
                </div>
                <div>
                  <dt>보유 계약 수</dt>
                  <dd>{{ selectedCustomer.contractCount ?? 0 }}건</dd>
                </div>
                <div>
                  <dt>최근 상담일</dt>
                  <dd>{{ selectedCustomer.lastConsultedAt || selectedCustomer.lastConsultationDate || '-' }}</dd>
                </div>
              </dl>
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
            <strong>STT (녹취 -> 텍스트) 기능 안내</strong>
            <p>STT 기능을 사용하면 상담 음성을 텍스트로 변환하여 상담일지 작성에 참고할 수 있습니다. 변환된 내용은 반드시 설계사가 검토한 후 최종 저장해야 합니다.</p>
          </div>
          <div class="stt-actions">
            <button type="button" aria-label="녹취 파일 첨부">
              <v-icon icon="mdi-file-upload-outline" size="16" />
            </button>
            <button type="button">텍스트로 추출하기</button>
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

        <template v-if="form.consultationType === 'NEW_CONTRACT'">
          <section class="form-card">
            <h3>1. 재무 및 가입 현황</h3>
            <div class="compact-grid">
              <label class="field">
                <span>월 평균 소득</span>
                <input
                  :value="formatMoneyDisplay(newDetail.monthlyIncome)"
                  class="control"
                  inputmode="numeric"
                  placeholder="5,600,000"
                  @input="updateMoneyField('monthlyIncome', $event.target.value, newDetail)"
                />
              </label>

              <div class="field">
                <span>기존 보험 가입 여부 <b>*</b></span>
                <div class="choice-row">
                  <button
                    type="button"
                    class="choice-button"
                    :class="{ 'is-active': newDetail.hasExistingInsurance === true }"
                    @click="setExistingInsurancetrue(true)"
                  >
                    있음
                  </button>
                  <button
                    type="button"
                    class="choice-button"
                    :class="{ 'is-active': newDetail.hasExistingInsurance === false }"
                    @click="setExistingInsurancetrue(false)"
                  >
                    없음
                  </button>
                </div>
              </div>

              <label class="field" :class="{ 'is-disabled': !newDetail.hasExistingInsurance }">
                <span>월 보험료 지출</span>
                <input
                  :value="formatMoneyDisplay(newDetail.monthlyInsurancePremium)"
                  class="control"
                  inputmode="numeric"
                  placeholder="210,000"
                  :disabled="!newDetail.hasExistingInsurance"
                  @input="updateMoneyField('monthlyInsurancePremium', $event.target.value, newDetail)"
                />
              </label>

              <label class="field field--wide" :class="{ 'is-disabled': !newDetail.hasExistingInsurance }">
                <span>기존 보험 간단히 입력</span>
                <textarea
                  v-model.trim="newDetail.existingInsuranceNote"
                  class="control textarea"
                  placeholder="회사명 / 상품명 / 월 납입액 입력"
                  :disabled="!newDetail.hasExistingInsurance"
                ></textarea>
              </label>
            </div>
          </section>

          <section class="form-card">
            <h3>2. 고객 니즈 및 성향</h3>
            <div class="field">
              <span>관심 보장 분야(복수 선택 가능)</span>
              <div class="option-chip-row">
                <button
                  v-for="option in coverageTypeOptions"
                  :key="option"
                  type="button"
                  class="option-chip"
                  :class="{ 'is-active': newDetail.coverageTypes.includes(option) }"
                  @click="toggleArraySelection(newDetail.coverageTypes, option)"
                >
                  {{ option }}
                </button>
              </div>
            </div>

            <div class="field">
              <span>보험 가입 기준(주요 1개 선택)</span>
              <div class="option-chip-row">
                <button
                  v-for="option in insurancePriorityOptions"
                  :key="option"
                  type="button"
                  class="option-chip"
                  :class="{ 'is-active': newDetail.insurancePriority === option }"
                  @click="newDetail.insurancePriority = toggleSingleSelection(newDetail.insurancePriority, option)"
                >
                  {{ option }}
                </button>
              </div>
            </div>
          </section>

          <section class="form-card">
            <h3>3. 맞춤형 가입 설계 제안</h3>
            <div class="field">
              <span>제안 상품 선택</span>
              <div class="product-search-row">
                <div class="product-search-input">
                  <v-icon icon="mdi-magnify" size="15" />
                  <input
                    v-model.trim="proposedProductKeyword"
                    class="control"
                    placeholder="상품명 검색 또는 선택..."
                    @keyup.enter.prevent="loadProposedProducts"
                  />
                </div>
                <button type="button" class="add-button" @click="loadProposedProducts">추가</button>
              </div>
              <div v-if="showProductOptions" class="product-option-list">
                <button
                  v-for="product in filteredProposedProducts"
                  :key="getProductKey(product)"
                  type="button"
                  :disabled="isProductSelected(product) || selectedProposedProducts.length >= 5"
                  @click="addProposedProduct(product)"
                >
                  <strong>{{ product.insuranceProductName || product.productName || product.name }}</strong>
                  <span>{{ product.insuranceCompanyName || product.companyName || product.insurer || '보험사 미지정' }}</span>
                </button>
                <p v-if="!filteredProposedProducts.length">
                  {{ isProductsLoading ? '상품을 불러오는 중입니다.' : '조건에 맞는 상품이 없습니다.' }}
                </p>
              </div>
            </div>

            <div class="field">
              <span>선택된 상품 목록 (최대 5개까지 Tag 형태로 표시)</span>
              <div class="selected-product-tags">
                <span v-for="product in selectedProposedProducts" :key="getProductKey(product)">
                  {{ product.insuranceProductName || product.productName || product.name }}
                  <button type="button" @click="removeProposedProduct(product)">×</button>
                </span>
                <p v-if="!selectedProposedProducts.length">선택된 상품이 없습니다.</p>
              </div>
            </div>
          </section>
        </template>

        <template v-else-if="form.consultationType === 'CLAIM'">
          <section class="form-card">
            <h3>2. 청구 유형</h3>
            <p class="section-help">해당하는 청구 유형을 선택하세요.</p>
            <div class="claim-type-grid">
              <button
                v-for="option in claimTypeOptions"
                :key="option"
                type="button"
                class="claim-type-button"
                :class="{ 'is-active': claimDetail.claimType === option }"
                @click="claimDetail.claimType = toggleSingleSelection(claimDetail.claimType, option)"
              >
                {{ option }}
              </button>
            </div>
          </section>

          <section class="form-card">
            <h3>3. 사고 / 질병 정보</h3>
            <div class="compact-grid">
              <label class="field">
                <span>청구 사유</span>
                <input v-model.trim="claimDetail.claimReason" class="control" />
              </label>
              <label class="field">
                <span>발생일 또는 진단일</span>
                <input v-model="claimDetail.incidentDate" class="control" type="date" />
              </label>
            </div>
          </section>

          <section class="form-card">
            <h3>4. 청구 가능 여부 검토</h3>
            <p class="section-help">해당 항목을 확인하여 체크하세요. (복수 선택 가능)</p>
            <div class="checkbox-chip-row">
              <button
                v-for="option in claimReviewOptions"
                :key="option"
                type="button"
                class="checkbox-chip"
                :class="{ 'is-active': claimDetail.reviewItems.includes(option) }"
                @click="toggleArraySelection(claimDetail.reviewItems, option)"
              >
                {{ option }}
              </button>
            </div>
          </section>

          <section class="form-card">
            <h3>5. 상담 결과</h3>
            <div class="claim-result-row">
              <button
                v-for="option in claimResultOptions"
                :key="option"
                type="button"
                class="claim-result-button"
                :class="{ 'is-active': claimDetail.result === option }"
                @click="claimDetail.result = toggleSingleSelection(claimDetail.result, option)"
              >
                {{ option }}
              </button>
            </div>
          </section>

          <section class="form-card">
            <h3>6. 다음 조치</h3>
            <p class="section-help">후속 처리 항목을 선택하세요. (복수 선택 가능)</p>
            <div class="checkbox-chip-row">
              <button
                v-for="option in claimNextActionOptions"
                :key="option"
                type="button"
                class="checkbox-chip"
                :class="{ 'is-active': claimDetail.nextActions.includes(option) }"
                @click="toggleArraySelection(claimDetail.nextActions, option)"
              >
                {{ option }}
              </button>
            </div>
          </section>
        </template>

        <template v-else-if="form.consultationType === 'RENEWAL'">
          <section class="form-card">
            <h3>2. 갱신 정보</h3>
            <div class="renewal-info-grid">
              <label class="field">
                <span>갱신 예정일</span>
                <input v-model="renewalDetail.renewalScheduledDate" class="control" type="date" />
              </label>
              <label class="field">
                <span>현재 보험료</span>
                <input
                  :value="formatMoneyDisplay(renewalDetail.currentPremium)"
                  class="control"
                  inputmode="numeric"
                  placeholder="45,000"
                  @input="updateMoneyField('currentPremium', $event.target.value, renewalDetail)"
                />
              </label>
              <label class="field">
                <span>갱신 보험료</span>
                <input
                  :value="formatMoneyDisplay(renewalDetail.renewalPremium)"
                  class="control"
                  inputmode="numeric"
                  placeholder="54,000"
                  @input="updateMoneyField('renewalPremium', $event.target.value, renewalDetail)"
                />
              </label>
              <label class="field">
                <span>보험료 변동률</span>
                <input :value="renewalPremiumChangeRate" class="control control--locked" readonly />
              </label>
            </div>
          </section>

          <section class="form-card">
            <h3>3. 보장 변경 내용</h3>
            <div class="renewal-change-layout">
              <div class="field">
                <span>변경 유형 선택</span>
                <div class="vertical-choice-row">
                  <button
                    v-for="option in renewalChangeTypeOptions"
                    :key="option"
                    type="button"
                    class="option-chip"
                    :class="{ 'is-active': renewalDetail.changeType === option }"
                    @click="renewalDetail.changeType = toggleSingleSelection(renewalDetail.changeType, option)"
                  >
                    {{ option }}
                  </button>
                </div>
              </div>
              <label class="field">
                <span>변경 상세 내용</span>
                <textarea
                  v-model.trim="renewalDetail.changeDetail"
                  class="control textarea textarea--large"
                  placeholder="예: 입원일당 특약 보험료 갱신, 일부 특약 보장금액 변경"
                ></textarea>
              </label>
            </div>
          </section>

          <section class="form-card">
            <h3>4. 보험료 변동 사유</h3>
            <p class="section-help">(복수 선택 가능)</p>
            <div class="checkbox-chip-row">
              <button
                v-for="option in renewalPremiumReasonOptions"
                :key="option"
                type="button"
                class="checkbox-chip"
                :class="{ 'is-active': renewalDetail.premiumChangeReasons.includes(option) }"
                @click="toggleArraySelection(renewalDetail.premiumChangeReasons, option)"
              >
                {{ option }}
              </button>
            </div>
          </section>

          <div class="renewal-two-column">
            <section class="form-card">
              <h3>5. 고객 반응</h3>
              <p class="section-help">(복수 선택 가능)</p>
              <div class="checkbox-chip-row">
                <button
                  v-for="option in renewalCustomerResponseOptions"
                  :key="option"
                  type="button"
                  class="checkbox-chip"
                  :class="{ 'is-active': renewalDetail.customerResponses.includes(option) }"
                  @click="toggleArraySelection(renewalDetail.customerResponses, option)"
                >
                  {{ option }}
                </button>
              </div>
            </section>

            <section class="form-card">
              <h3>6. 고객 관심사항</h3>
              <p class="section-help">(복수 선택 가능)</p>
              <div class="checkbox-chip-row">
                <button
                  v-for="option in renewalCustomerInterestOptions"
                  :key="option"
                  type="button"
                  class="checkbox-chip"
                  :class="{ 'is-active': renewalDetail.customerInterests.includes(option) }"
                  @click="toggleArraySelection(renewalDetail.customerInterests, option)"
                >
                  {{ option }}
                </button>
              </div>
            </section>
          </div>

          <section class="form-card">
            <h3>7. 상담 결과</h3>
            <div class="claim-result-row">
              <button
                v-for="option in renewalResultOptions"
                :key="option"
                type="button"
                class="claim-result-button"
                :class="{ 'is-active': renewalDetail.result === option }"
                @click="renewalDetail.result = toggleSingleSelection(renewalDetail.result, option)"
              >
                {{ option }}
              </button>
            </div>
          </section>

          <section class="form-card">
            <h3>8. 후속 조치</h3>
            <div class="checkbox-chip-row">
              <button
                v-for="option in renewalNextActionOptions"
                :key="option"
                type="button"
                class="checkbox-chip"
                :class="{ 'is-active': renewalDetail.nextActions.includes(option) }"
                @click="toggleArraySelection(renewalDetail.nextActions, option)"
              >
                {{ option }}
              </button>
            </div>
          </section>

          <section class="form-card">
            <h3>9. 고객 결정 예정일</h3>
            <label class="field renewal-decision-field">
              <span>고객 결정 예정일 (선택 사항)</span>
              <input v-model="renewalDetail.decisionExpectedDate" class="control" type="date" />
            </label>
          </section>
        </template>

        <template v-else-if="form.consultationType === 'TERMINATION'">
          <section class="form-card">
            <h3>2. 해지 검토 사유</h3>
            <p class="section-help">(복수 선택 가능)</p>
            <div class="checkbox-chip-row checkbox-chip-row--spaced">
              <button
                v-for="option in terminationReasonOptions"
                :key="option"
                type="button"
                class="checkbox-chip"
                :class="{ 'is-active': cancelDetail.reviewReasons.includes(option) }"
                @click="toggleArraySelection(cancelDetail.reviewReasons, option)"
              >
                {{ option }}
              </button>
            </div>
          </section>

          <section class="form-card">
            <h3>3. 해지 사유 상세</h3>
            <label class="field">
              <span>해지 사유 상세 내용</span>
              <textarea
                v-model.trim="cancelDetail.reasonDetail"
                class="control textarea textarea--large"
                placeholder="예: 고객이 최근 소득 감소로 보험료 부담을 느끼고 있음. 실손 보험을 유지 의사가 있으나 보험료나 보장 내용을 재검토 중"
              ></textarea>
            </label>
          </section>

          <section class="form-card">
            <h3>4. 유지 방안 검토</h3>
            <p class="section-help">(복수 선택 가능)</p>
            <div class="checkbox-chip-row checkbox-chip-row--spaced">
              <button
                v-for="option in terminationRetentionPlanOptions"
                :key="option"
                type="button"
                class="checkbox-chip"
                :class="{ 'is-active': cancelDetail.retentionPlans.includes(option) }"
                @click="toggleArraySelection(cancelDetail.retentionPlans, option)"
              >
                {{ option }}
              </button>
            </div>
          </section>

          <div class="renewal-two-column">
            <section class="form-card">
              <h3>5. 고객 의사</h3>
              <p class="section-help">(단일 선택)</p>
              <div class="checkbox-chip-row">
                <button
                  v-for="option in terminationCustomerIntentOptions"
                  :key="option"
                  type="button"
                  class="checkbox-chip"
                  :class="{ 'is-active': cancelDetail.customerIntent === option }"
                  @click="cancelDetail.customerIntent = toggleSingleSelection(cancelDetail.customerIntent, option)"
                >
                  {{ option }}
                </button>
              </div>
            </section>

            <section class="form-card">
              <h3>6. 유지 가능성</h3>
              <div class="retention-possibility">
                <div class="retention-possibility__choices">
                  <button
                    v-for="option in terminationPossibilityOptions"
                    :key="option.value"
                    type="button"
                    class="checkbox-chip"
                    :class="{ 'is-active': cancelDetail.retentionPossibility === option.value }"
                    @click="cancelDetail.retentionPossibility = toggleSingleSelection(cancelDetail.retentionPossibility, option.value)"
                  >
                    {{ option.label }}
                  </button>
                </div>
                <div class="retention-possibility__bar">
                  <span :class="cancelDetail.retentionPossibility ? `is-${cancelDetail.retentionPossibility.toLowerCase()}` : ''"></span>
                </div>
              </div>
            </section>
          </div>

          <section class="form-card">
            <h3>7. 상담 결과</h3>
            <div class="claim-result-row">
              <button
                v-for="option in terminationResultOptions"
                :key="option"
                type="button"
                class="claim-result-button"
                :class="{ 'is-active': cancelDetail.result === option }"
                @click="cancelDetail.result = toggleSingleSelection(cancelDetail.result, option)"
              >
                {{ option }}
              </button>
            </div>
          </section>

          <section class="form-card">
            <h3>8. 후속 조치</h3>
            <p class="section-help">(복수 선택 가능)</p>
            <div class="checkbox-chip-row">
              <button
                v-for="option in terminationNextActionOptions"
                :key="option"
                type="button"
                class="checkbox-chip"
                :class="{ 'is-active': cancelDetail.nextActions.includes(option) }"
                @click="toggleArraySelection(cancelDetail.nextActions, option)"
              >
                {{ option }}
              </button>
            </div>
          </section>
        </template>

        <section class="form-card">
          <h3>{{ noteSectionNumber }}. 특이사항</h3>
          <label class="field">
            <span>특이사항 메모 (선택)</span>
            <textarea
              v-model.trim="form.specialNote"
              class="control textarea textarea--large"
              placeholder="특이사항을 입력해주세요."
            ></textarea>
          </label>
          <label class="field">
            <span>후속 상담 예정일 (선택)</span>
            <input v-model="form.nextScheduledAt" class="control follow-up-date-control" type="date" />
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
import { getCustomerDetail, getCustomers } from '../../api/customers'
import { getInsuranceProducts } from '../../api/insurance'
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

const coverageTypeOptions = ['진단비', '실손 의료비', '수술비', '사망보장', '기타']

const insurancePriorityOptions = ['보험료 저렴한 곳', '보장 범위가 넓은 곳', '보험금 지급 신속성', '기타']

const claimTypeOptions = ['실손의료비 보장', '입원 보장', '통원 보장', '수술 보장', '진단 보장', '상해 보장']

const claimReviewOptions = ['보장 대상 여부', '면책/감액 기간 여부', '약관상 제외 가능성', '기존 청구 이력 여부']

const claimResultOptions = ['청구 가능', '추가 확인 필요', '서류 보완 필요', '청구 어려움', '고객 재안내 예정']

const claimNextActionOptions = ['고객 서류 준비', '설계사 서류 확인', '보험사 접수', '진행 상태 확인', '부지급 사유 확인', '추가 상담 예정']

const renewalChangeTypeOptions = ['변경 없음', '보장 확대', '보장 축소', '특약 변경']

const renewalPremiumReasonOptions = ['연령 증가', '위험률 변경', '손해율 변경', '보장 변경', '보험사 정책 변경', '기타']

const renewalCustomerResponseOptions = ['수용', '부담 호소', '비교 요청', '해지 고민', '재상담 요청', '무응답', '검토 후 연락']

const renewalCustomerInterestOptions = ['보험료', '보장 범위', '만기', '환급금', '대체상품']

const renewalResultOptions = ['갱신 유지', '조건 검토 중', '해지 검토', '재상담 예정']

const renewalNextActionOptions = ['갱신 확정 안내', '갱신 서류 전달', '보험료 재산출', '대체상품 제안', '재상담 예약', '만기 재안내']

const terminationReasonOptions = [
  '보험료 부담',
  '갱신 후 보험료 인상 부담',
  '경제적 사정',
  '보장 불만족',
  '중복 가입',
  '설계사 서비스 불만',
  '관리 부족 불만',
  '대체 상품 검토 중',
  '기타',
]

const terminationRetentionPlanOptions = [
  '보험료 감액 설계',
  '특약 조정',
  '보장 리모델링',
  '납입 유예 검토',
  '대체 상품 제안',
  '유지 권유',
  '기타',
]

const terminationCustomerIntentOptions = [
  '즉시 해지 희망',
  '해지 검토 중',
  '유지 검토 중',
  '가족과 상의 예정',
  '추후 재상담 희망',
]

const terminationPossibilityOptions = [
  { label: '낮음', value: 'LOW' },
  { label: '보통', value: 'MEDIUM' },
  { label: '높음', value: 'HIGH' },
]

const terminationResultOptions = ['유지', '해지 진행', '해지 보류', '재상담 예정']

const terminationNextActionOptions = ['재상담 예약', '대체상품 제안', '해지 서류 안내', '가족 동반 상담', '없음']

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
const customerSearchTouched = ref(false)
const selectedCustomer = ref(null)
const contracts = ref([])
const proposedProductKeyword = ref('')
const proposedProductOptions = ref([])
const selectedProposedProducts = ref([])
const showProductOptions = ref(false)
const isProductsLoading = ref(false)
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
  coverageTypes: [],
})

const claimDetail = reactive({
  claimType: '',
  claimReason: '',
  incidentDate: '',
  claimAmount: '',
  reviewItems: [],
  result: '',
  nextActions: [],
})

const renewalDetail = reactive({
  renewalReason: '',
  desiredRenewalDate: '',
  expectedPremium: '',
  renewalScheduledDate: '',
  currentPremium: '',
  renewalPremium: '',
  changeType: '변경 없음',
  changeDetail: '',
  premiumChangeReasons: [],
  customerResponses: [],
  customerInterests: [],
  result: '',
  nextActions: [],
  decisionExpectedDate: '',
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
  reviewReasons: [],
  reasonDetail: '',
  retentionPlans: [],
  customerIntent: '',
  result: '',
  nextActions: [],
})

const isEditMode = computed(() => route.name === 'consultation-draft-edit')
const isNewContract = computed(() => form.consultationType === 'NEW_CONTRACT')
const needsExistingCustomer = computed(() => !isNewContract.value || customerMode.value === 'EXISTING')
const needsContract = computed(() => ['CLAIM', 'RENEWAL', 'TERMINATION'].includes(form.consultationType))
const noteSectionNumber = computed(() => {
  if (form.consultationType === 'NEW_CONTRACT') return 4
  if (form.consultationType === 'CLAIM') return 7
  if (form.consultationType === 'RENEWAL') return 10
  if (form.consultationType === 'TERMINATION') return 9
  return needsContract.value ? 3 : 2
})
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
const customerAddressText = computed(() => {
  return [
    customerInfo.customerAddressRoad,
    customerInfo.customerAddressDetail,
  ].filter(Boolean).join(' ') || '-'
})
const customerJobText = computed(() => {
  return [
    customerInfo.customerCompanyName,
    customerInfo.customerJobCustom || customerInfo.customerJob,
  ].filter(Boolean).join(' / ') || '-'
})
const filteredProposedProducts = computed(() => {
  const keyword = proposedProductKeyword.value.trim().toLowerCase()
  if (!keyword) return proposedProductOptions.value

  return proposedProductOptions.value.filter((product) => {
    const searchable = [
      product.insuranceProductName,
      product.productName,
      product.name,
      product.insuranceCompanyName,
      product.companyName,
      product.insurer,
    ].filter(Boolean).join(' ').toLowerCase()

    return searchable.includes(keyword)
  })
})
const renewalPremiumChangeRate = computed(() => {
  const currentPremium = Number(String(renewalDetail.currentPremium || '').replace(/[^\d]/g, ''))
  const renewalPremium = Number(String(renewalDetail.renewalPremium || '').replace(/[^\d]/g, ''))
  if (!currentPremium || !renewalPremium) return ''

  const rate = ((renewalPremium - currentPremium) / currentPremium) * 100
  const prefix = rate > 0 ? '+' : ''
  return `${prefix}${rate.toFixed(1)}%`
})

watch(
  () => form.consultationType,
  () => {
    if (!isNewContract.value) customerMode.value = 'EXISTING'
    form.contractId = ''
    contracts.value = []
  },
)

watch(customerMode, () => {
  customers.value = []
  customerSearchTouched.value = false
  selectedCustomer.value = null
  form.contractId = ''
  contracts.value = []
  resetCustomerInfo()
})

watch(
  () => newDetail.hasExistingInsurance,
  (hasExistingInsurance) => {
    if (!hasExistingInsurance) {
      newDetail.monthlyInsurancePremium = ''
      newDetail.existingInsuranceNote = ''
    }
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
})

function selectType(type) {
  form.consultationType = type
}

async function loadCustomers() {
  customerSearchTouched.value = true

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

async function selectCustomer(customer) {
  const normalizedCustomer = {
    ...customer,
    customerId: customer.customerId,
    customerName: customer.customerName,
    customerPhone: customer.customerPhone,
    phoneNumber: customer.phoneNumber,
  }

  selectedCustomer.value = normalizedCustomer
  applyCustomerToInfo(normalizedCustomer)

  try {
    const response = await getCustomerDetail(customer.customerId)
    const detail = response?.result?.customer ?? response?.result ?? response
    selectedCustomer.value = {
      ...normalizedCustomer,
      ...detail,
      customerId: detail.customerId ?? normalizedCustomer.customerId,
    }
    applyCustomerToInfo(selectedCustomer.value)
  } catch {
    // 검색 결과에 포함된 기본 정보만 사용합니다.
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
  if (!Array.isArray(newDetail.coverageTypes)) {
    newDetail.coverageTypes = splitCommaList(draft.newDetail?.coverageTypesText)
  }
  selectedProposedProducts.value = Array.isArray(draft.selectedProposedProducts) ? draft.selectedProposedProducts : []
  Object.assign(claimDetail, draft.claimDetail || {})
  if (!Array.isArray(claimDetail.reviewItems)) claimDetail.reviewItems = []
  if (!Array.isArray(claimDetail.nextActions)) claimDetail.nextActions = []
  Object.assign(renewalDetail, draft.renewalDetail || {})
  if (!Array.isArray(renewalDetail.premiumChangeReasons)) renewalDetail.premiumChangeReasons = []
  if (!Array.isArray(renewalDetail.customerResponses)) renewalDetail.customerResponses = []
  if (!Array.isArray(renewalDetail.customerInterests)) renewalDetail.customerInterests = []
  if (!Array.isArray(renewalDetail.nextActions)) renewalDetail.nextActions = []
  Object.assign(cancelDetail, draft.cancelDetail || {})
  if (!Array.isArray(cancelDetail.reviewReasons)) cancelDetail.reviewReasons = []
  if (!Array.isArray(cancelDetail.retentionPlans)) cancelDetail.retentionPlans = []
  if (!Array.isArray(cancelDetail.nextActions)) cancelDetail.nextActions = []
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
  const specialNote = form.specialNote || ''

  return {
    consultationType: form.consultationType,
    consultationChannel: form.consultationChannel,
    consultedAt: form.consultedAt,
    consultationContent: specialNote,
    specialNote,
    nextScheduledAt: form.nextScheduledAt,
    contractId: form.contractId,
    customerMode: customerMode.value,
    selectedCustomer: selectedCustomer.value,
    customerInfo: { ...customerInfo },
    newDetail: { ...newDetail },
    selectedProposedProducts: selectedProposedProducts.value,
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
  const specialNote = form.specialNote || ''
  const payload = {
    consultationType: form.consultationType,
    consultationChannel: form.consultationChannel,
    consultedAt: toApiDateTime(form.consultedAt),
    consultationContent: specialNote,
    specialNote,
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
      coverageTypes: newDetail.coverageTypes,
      proposedProductCodes: selectedProposedProducts.value.map(getProductKey).filter(Boolean),
    }
  }

  if (form.consultationType === 'CLAIM') {
    payload.claimDetail = {
      claimType: claimDetail.claimType || null,
      claimReason: claimDetail.claimReason || null,
      incidentDate: claimDetail.incidentDate || null,
      claimAmount: parseMoneyOrNull(claimDetail.claimAmount),
      reviewItems: claimDetail.reviewItems,
      result: claimDetail.result || null,
      nextActions: claimDetail.nextActions,
    }
  }

  if (form.consultationType === 'RENEWAL') {
    payload.renewalDetail = {
      renewalReason: renewalDetail.renewalReason || null,
      desiredRenewalDate: renewalDetail.desiredRenewalDate || null,
      expectedPremium: parseMoneyOrNull(renewalDetail.expectedPremium),
      renewalScheduledDate: renewalDetail.renewalScheduledDate || null,
      currentPremium: parseMoneyOrNull(renewalDetail.currentPremium),
      renewalPremium: parseMoneyOrNull(renewalDetail.renewalPremium),
      premiumChangeRate: renewalPremiumChangeRate.value || null,
      changeType: renewalDetail.changeType || null,
      changeDetail: renewalDetail.changeDetail || null,
      premiumChangeReasons: renewalDetail.premiumChangeReasons,
      customerResponses: renewalDetail.customerResponses,
      customerInterests: renewalDetail.customerInterests,
      result: renewalDetail.result || null,
      nextActions: renewalDetail.nextActions,
      decisionExpectedDate: renewalDetail.decisionExpectedDate || null,
    }
  }

  if (form.consultationType === 'TERMINATION') {
    payload.cancelDetail = {
      ...cancelDetail,
      reviewReasons: cancelDetail.reviewReasons,
      reasonDetail: cancelDetail.reasonDetail || null,
      retentionPlans: cancelDetail.retentionPlans,
      customerIntent: cancelDetail.customerIntent || null,
      result: cancelDetail.result || null,
      nextActions: cancelDetail.nextActions,
    }
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
  if (needsExistingCustomer.value && !selectedCustomer.value) return '고객을 선택해주세요.'
  if (!needsExistingCustomer.value && (!customerInfo.customerName || !customerInfo.customerPhone)) {
    return '신규 고객의 이름과 연락처를 입력해주세요.'
  }
  if (!needsExistingCustomer.value && (!customerInfo.customerZipcode || !customerInfo.customerAddressRoad)) {
    return '주소 검색 후 주소를 선택해주세요.'
  }
  if (needsContract.value && !form.contractId) return '계약을 선택해주세요.'
  if (form.consultationType === 'NEW_CONTRACT' && newDetail.hasExistingInsurance) {
    if (!newDetail.monthlyInsurancePremium) return '월 보험료 지출액을 입력해주세요.'
    if (!newDetail.existingInsuranceNote) return '기존 보험 정보를 입력해주세요.'
  }
  if (form.consultationType === 'CLAIM') {
    if (!claimDetail.claimType) return '청구 유형을 선택해주세요.'
    if (!claimDetail.claimReason) return '청구 사유를 입력해주세요.'
    if (!claimDetail.incidentDate) return '발생일 또는 진단일을 입력해주세요.'
    if (!claimDetail.result) return '상담 결과를 선택해주세요.'
  }
  if (form.consultationType === 'RENEWAL') {
    if (!renewalDetail.renewalScheduledDate) return '갱신 예정일을 선택해주세요.'
    if (!renewalDetail.currentPremium) return '현재 보험료를 입력해주세요.'
    if (!renewalDetail.renewalPremium) return '갱신 보험료를 입력해주세요.'
    if (!renewalDetail.changeType) return '보장 변경 유형을 선택해주세요.'
    if (!renewalDetail.result) return '상담 결과를 선택해주세요.'
  }
  if (form.consultationType === 'TERMINATION') {
    if (!cancelDetail.reviewReasons.length) return '해지 검토 사유를 선택해주세요.'
    if (!cancelDetail.reasonDetail) return '해지 사유 상세를 입력해주세요.'
    if (!cancelDetail.customerIntent) return '고객 의사를 선택해주세요.'
    if (!cancelDetail.retentionPossibility) return '유지 가능성을 선택해주세요.'
    if (!cancelDetail.result) return '상담 결과를 선택해주세요.'
  }
  return ''
}

function setExistingInsurance(value) {
  newDetail.hasExistingInsurance = value
}

function toggleSingleSelection(currentValue, nextValue) {
  return currentValue === nextValue ? '' : nextValue
}

function toggleArraySelection(targetArray, value) {
  const index = targetArray.indexOf(value)
  if (index >= 0) {
    targetArray.splice(index, 1)
    return
  }
  targetArray.push(value)
}

async function loadProposedProducts() {
  showProductOptions.value = true
  if (proposedProductOptions.value.length > 0) return

  isProductsLoading.value = true

  try {
    const response = await getInsuranceProducts({ size: 1000 })
    const result = response?.result?.products ?? response?.result
    const rows = Array.isArray(result?.content) ? result.content : result
    proposedProductOptions.value = Array.isArray(rows) ? rows : []
  } catch {
    proposedProductOptions.value = []
  } finally {
    isProductsLoading.value = false
  }
}

function addProposedProduct(product) {
  if (selectedProposedProducts.value.length >= 5 || isProductSelected(product)) return
  selectedProposedProducts.value = [...selectedProposedProducts.value, product]
}

function removeProposedProduct(product) {
  const productKey = getProductKey(product)
  selectedProposedProducts.value = selectedProposedProducts.value.filter((item) => getProductKey(item) !== productKey)
}

function isProductSelected(product) {
  const productKey = getProductKey(product)
  return selectedProposedProducts.value.some((item) => getProductKey(item) === productKey)
}

function getProductKey(product) {
  return String(
    product?.insuranceProductId ??
    product?.insuranceProductCode ??
    product?.productId ??
    product?.productCode ??
    product?.id ??
    `${product?.insuranceCompanyName || product?.companyName || ''}-${product?.insuranceProductName || product?.productName || product?.name || ''}`,
  )
}

function applyCustomerToInfo(customer) {
  customerInfo.customerName = customer.customerName ?? customer.name ?? ''
  customerInfo.customerGender = customer.customerGender ?? customer.gender ?? ''
  customerInfo.customerBirthDate = customer.customerBirthDate ?? customer.birthDate ?? ''
  customerInfo.customerPhone = formatPhoneDisplay(customer.customerPhone ?? customer.phoneNumber ?? customer.phone ?? '')
  customerInfo.customerEmail = customer.customerEmail ?? customer.email ?? ''
  customerInfo.customerZipcode = customer.customerZipcode ?? customer.zipcode ?? ''
  customerInfo.customerAddressRoad = customer.customerAddressRoad ?? customer.addressRoad ?? customer.address ?? ''
  customerInfo.customerAddressDetail = customer.customerAddressDetail ?? customer.addressDetail ?? ''
  customerInfo.customerJob = customer.customerJob ?? customer.job ?? ''
  customerInfo.customerJobCustom = ''
  customerInfo.customerCompanyName = customer.customerCompanyName ?? customer.companyName ?? ''
  selectedCustomer.value.contractCount =
    customer.contractCount ??
    customer.contractSummary?.totalContractCount ??
    selectedCustomer.value.contractCount ??
    0
  selectedCustomer.value.lastConsultedAt =
    customer.lastConsultedAt ??
    customer.lastConsultationDate ??
    selectedCustomer.value.lastConsultedAt ??
    ''
  hydrateEmailFields(customerInfo.customerEmail)
}

function resetCustomerInfo() {
  Object.assign(customerInfo, {
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
}

function getGenderLabel(gender) {
  if (gender === 'MALE') return '남성'
  if (gender === 'FEMALE') return '여성'
  return gender || '-'
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

.selected-customer-panel {
  padding: 12px;
  border: 1px solid #fed7aa;
  border-radius: 8px;
  background: #fff7ed;
}

.selected-customer-panel dl {
  display: grid;
  gap: 8px;
  margin: 0;
}

.selected-customer-panel div {
  display: grid;
  grid-template-columns: 86px minmax(0, 1fr);
  gap: 8px;
}

.selected-customer-panel dt {
  color: #9a3412;
  font-size: 11px;
  font-weight: 800;
}

.selected-customer-panel dd {
  min-width: 0;
  margin: 0;
  color: #111827;
  font-size: 12px;
  font-weight: 700;
  word-break: break-word;
}

.choice-row,
.option-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.section-help {
  margin: 0 0 14px;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

.choice-button,
.option-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 14px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #ffffff;
  color: #374151;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.choice-button.is-active,
.option-chip.is-active {
  border-color: #fb923c;
  background: #fff7ed;
  color: #ea580c;
}

.option-chip input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.field.is-disabled {
  opacity: 0.45;
}

.field.is-disabled .control {
  cursor: not-allowed;
}

.control--locked {
  background: #fff7ed;
  color: #f97316;
  font-weight: 900;
  text-align: center;
}

.renewal-info-grid {
  display: grid;
  grid-template-columns: 1.15fr 1fr 1fr 0.8fr;
  gap: 10px;
}

.renewal-change-layout {
  display: grid;
  grid-template-columns: 118px minmax(0, 1fr);
  gap: 12px;
  align-items: stretch;
}

.vertical-choice-row {
  display: grid;
  gap: 8px;
}

.renewal-two-column {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.renewal-two-column .form-card {
  margin: 0;
}

.renewal-decision-field {
  max-width: 240px;
}

.claim-type-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.claim-type-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 56px;
  padding: 0 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #ffffff;
  color: #475569;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.claim-type-button.is-active {
  border-color: #fb923c;
  background: #fff7ed;
  color: #f97316;
  box-shadow: inset 0 0 0 1px #fb923c;
}

.checkbox-chip-row,
.claim-result-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.checkbox-chip-row--spaced {
  column-gap: 16px;
  row-gap: 10px;
}

.checkbox-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 30px;
  padding: 0 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #ffffff;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.checkbox-chip.is-active {
  border-color: #fed7aa;
  background: #fff7ed;
  color: #ea580c;
}

.claim-result-button {
  min-height: 34px;
  padding: 0 18px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #ffffff;
  color: #475569;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.claim-result-button.is-active {
  border-color: #fed7aa;
  background: #fff7ed;
  color: #ea580c;
}

.retention-possibility {
  display: grid;
  gap: 16px;
  padding-top: 10px;
}

.retention-possibility__choices {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.retention-possibility__bar {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: linear-gradient(90deg, #fb7185 0%, #fb923c 50%, #facc15 100%);
}

.retention-possibility__bar span {
  display: block;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.68);
  transform-origin: right center;
}

.retention-possibility__bar span.is-low {
  transform: scaleX(0.66);
}

.retention-possibility__bar span.is-medium {
  transform: scaleX(0.33);
}

.retention-possibility__bar span.is-high {
  transform: scaleX(0);
}

.follow-up-date-control {
  max-width: 220px;
}

.product-search-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 72px;
  gap: 8px;
}

.product-search-input {
  position: relative;
  min-width: 0;
}

.product-search-input .v-icon {
  position: absolute;
  top: 50%;
  left: 10px;
  z-index: 1;
  color: #94a3b8;
  transform: translateY(-50%);
  pointer-events: none;
}

.product-search-input .control {
  width: 100%;
  padding-left: 32px;
}

.add-button {
  height: 34px;
  border: 0;
  border-radius: 6px;
  background: #f97316;
  color: #ffffff;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
}

.product-option-list {
  display: grid;
  gap: 6px;
  max-height: 190px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
}

.product-option-list button {
  display: grid;
  gap: 2px;
  padding: 9px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #ffffff;
  text-align: left;
  cursor: pointer;
}

.product-option-list button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.product-option-list strong {
  color: #111827;
  font-size: 12px;
}

.product-option-list span,
.product-option-list p {
  color: #64748b;
  font-size: 11px;
}

.selected-product-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 44px;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
}

.selected-product-tags span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  padding: 0 10px;
  border: 1px solid #fed7aa;
  border-radius: 999px;
  background: #fff7ed;
  color: #ea580c;
  font-size: 11px;
  font-weight: 800;
}

.selected-product-tags button {
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 14px;
  font-weight: 900;
  cursor: pointer;
}

.selected-product-tags p {
  margin: 0;
  color: #94a3b8;
  font-size: 12px;
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
  .disease-picker,
  .product-search-row,
  .claim-type-grid,
  .renewal-info-grid,
  .renewal-change-layout,
  .renewal-two-column {
    grid-template-columns: 1fr;
  }

  .selected-customer-panel div {
    grid-template-columns: 1fr;
  }
}
</style>
