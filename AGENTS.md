# Relia Frontend Development Agenda

## 1. 프로젝트 전제

Relia는 보험 영업 운영 시스템이다.

사용자는 로그인 후 권한에 따라 접근 가능한 메뉴와 데이터 조회 범위가 달라진다.

권한은 다음과 같다.

| 권한 | 설명 | 조회 범위 |
| --- | --- | --- |
| FP | 설계사 | 본인이 담당 중인 고객만 조회 |
| BRANCH_MANAGER | 지점장 | 본인 소속 지점 고객 전체 조회 |
| HQ_MANAGER | 본사 영업 관리자 | 전체 지점 고객 조회 |
| SYSTEM_ADMIN | 시스템 관리자 | 사용자/조직 관리 중심 |

프론트엔드는 로그인 사용자의 `userRole`, `organizationId`, `userId`를 기준으로 메뉴 노출과 API 요청 파라미터를 제어한다.

## 2. 공통 레이아웃 기준

모든 인증 후 화면은 아래 공통 레이아웃을 사용한다.

### Layout Structure

- `AppLayout`
  - `Sidebar`
  - `Header`
  - `MainContent`
  - `Footer`

### 기본 구조

```text
AppLayout
├── Sidebar
├── Header
├── MainContent
│   └── RouterView
└── Footer
```

화면 배치 기준:
- `Sidebar`는 좌측 고정 영역이다.
- `Header`는 상단 고정 또는 콘텐츠 상단 영역이다.
- `MainContent`는 실제 페이지 콘텐츠가 렌더링되는 영역이다.
- `Footer`는 하단 공통 영역이다.
- 각 페이지는 개별적으로 `Sidebar`, `Header`, `Footer`를 만들지 않는다.
- 모든 페이지는 반드시 `AppLayout` 내부에서 렌더링한다.

## 3. 권한별 사이드바 메뉴

### FP 메뉴

- 내 대시보드
- 고객 관리
  - 고객 목록
  - 관심 고객
- 상담 관리
  - 상담 목록
  - 상담 등록
- 계약 관리
  - 계약 목록
- 수수료 관리
  - 내 수수료
- 일정 관리

### BRANCH_MANAGER 메뉴

- 지점 대시보드
- 고객 관리
  - 지점 고객 목록
  - 관심 고객
- 상담 관리
  - 상담 현황
- 계약 관리
  - 지점 계약 목록
- 인수인계
  - 인수인계 요청
  - 설계사 추천
  - 결재 대기
  - 인수인계 이력
- 설계사 관리
  - 소속 설계사 목록
- 수수료 관리
  - 지점 수수료

### HQ_MANAGER 메뉴

- 본사 대시보드
- 고객 관리
  - 전체 고객 목록
  - 관심 고객
- 계약 관리
  - 전체 계약 목록
- 인수인계 모니터링
  - 전체 인수인계 현황
- 조직 관리
  - 지점 목록
- 수수료 관리
  - 전사 수수료
  - 지점별 수수료
- 운영 모니터링

### SYSTEM_ADMIN 메뉴

- 시스템 관리
  - 사용자 관리
  - 조직 관리
  - 권한 관리

## 4. 메뉴 렌더링 규칙

로그인 사용자 정보는 전역 인증 상태에서 관리한다.

```ts
type LoginUser = {
  userId: string
  loginId: string
  userName: string
  userRole: 'FP' | 'BRANCH_MANAGER' | 'HQ_MANAGER' | 'SYSTEM_ADMIN'
  organizationId: string
  organizationCode: string
  organizationName: string
}
```

`Sidebar`는 `userRole`에 따라 메뉴를 다르게 렌더링한다.

- `FP` → `fpMenus`
- `BRANCH_MANAGER` → `branchManagerMenus`
- `HQ_MANAGER` → `hqManagerMenus`
- `SYSTEM_ADMIN` → `systemAdminMenus`

프론트에서 숨긴 메뉴는 UX용 처리일 뿐이며, 실제 권한 검증은 백엔드 API에서 수행된다는 전제를 둔다.

## 5. 라우팅 규칙

라우트는 권한 정보를 가진다.

```ts
meta: {
  requiresAuth: true,
  roles: ['FP', 'BRANCH_MANAGER', 'HQ_MANAGER']
}
```

라우터 가드는 다음을 처리한다.

- 비로그인 사용자는 `/login`으로 이동
- 권한이 없는 사용자는 `/403`으로 이동
- 로그인 사용자는 본인 권한의 기본 대시보드로 이동

권한별 기본 진입 화면은 다음과 같다.

- `FP` → `/dashboard/fp`
- `BRANCH_MANAGER` → `/dashboard/branch`
- `HQ_MANAGER` → `/dashboard/hq`
- `SYSTEM_ADMIN` → `/admin/users`

## 6. 고객 조회 화면 공통 규칙

고객 목록 화면은 권한별로 같은 UI를 최대한 재사용한다.

단, 조회 범위는 로그인 사용자의 권한에 따라 달라진다.

| 권한 | API 조회 기준 |
| --- | --- |
| FP | 서버에서 로그인 `userId` 기준으로 본인 고객만 조회 |
| BRANCH_MANAGER | 서버에서 `organizationId` 기준으로 소속 지점 고객 조회 |
| HQ_MANAGER | 전체 지점 고객 조회 |

프론트는 임의로 다른 설계사/지점 데이터를 조작하지 않는다.

고객 목록 API:
- `GET /api/customers`

사용 가능한 쿼리 파라미터:
- `page`
- `size`
- `keyword`
- `fpId`
- `organizationId`
- `customerStatus`
- `interestYn`

권한별 필터 규칙:
- `FP`는 `fpId`, `organizationId`를 직접 선택하는 필터를 노출하지 않는다.
- `BRANCH_MANAGER`는 소속 지점 내 설계사 필터를 사용할 수 있다.
- `HQ_MANAGER`는 지점 필터와 설계사 필터를 사용할 수 있다.

## 7. 화면 컴포넌트 작성 기준

공통 컴포넌트는 다음 기준으로 작성한다.

```text
components/
├── layout/
│   ├── AppLayout.vue
│   ├── Sidebar.vue
│   ├── Header.vue
│   └── Footer.vue
├── common/
│   ├── BaseButton.vue
│   ├── BaseInput.vue
│   ├── BaseSelect.vue
│   ├── BaseTable.vue
│   ├── BasePagination.vue
│   └── BaseCard.vue
└── domain/
    ├── customer/
    ├── contract/
    ├── consultation/
    ├── handover/
    └── commission/
```

페이지 컴포넌트는 다음 위치에 작성한다.

```text
pages/
├── dashboard/
├── customer/
├── contract/
├── consultation/
├── handover/
├── commission/
├── admin/
└── auth/
```

## 8. 디자인 기준

Figma 기준 공통 레이아웃을 우선 적용한다.

- 사이드바 배경색은 짙은 네이비 계열
- 로고 영역은 `Sidebar` 상단 고정
- 메뉴는 아이콘 + 텍스트 구조
- 현재 선택된 메뉴는 강조 색상 적용
- `Header` 우측에는 알림, 사용자명, 프로필 아이콘 배치
- `Footer`는 모든 화면 하단에 동일하게 적용
- 콘텐츠 영역은 연한 회색 배경 위 카드형 UI를 기본으로 한다

## 9. 스크린샷 메모 문서 사용 규칙

- 화면 구현 전에는 이 문서를 먼저 읽는다.
- 역할별 폴더의 `README.md`는 이 문서를 전제로 한 추가 메모만 적는다.
- 공통 규칙과 충돌하는 화면별 예외가 있으면 각 역할 폴더의 `README.md`에 별도로 적는다.
- 확실하지 않은 동작은 화면별 메모에 `확실하지 않음`으로 표시한다.
