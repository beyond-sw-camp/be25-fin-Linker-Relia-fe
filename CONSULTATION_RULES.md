# Consultation Rules

## Consultation Type

* NEW_CONTRACT
* CLAIM
* RENEWAL
* TERMINATION

## NEW_CONTRACT

신규 상담은 두 가지 경우가 존재한다.

### 기존 고객

* customerId 사용
* customerInfo 사용 안함
* contractId 없음

### 잠재 고객

* customerId 없음
* customerInfo 입력
* contractId 없음

## CLAIM

* customerId 필수
* contractId 필수

## RENEWAL

* customerId 필수
* contractId 필수

## TERMINATION

* customerId 필수
* contractId 필수

## New Detail

* monthlyIncome
* hasExistingInsurance
* monthlyInsurancePremium
* existingInsuranceNote
* insurancePriority
* coverageTypes
* proposedProductCodes

## Important

상담 유형에 따라 Form UI를 동적으로 변경한다.