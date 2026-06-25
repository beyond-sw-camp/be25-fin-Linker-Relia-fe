# Relia Frontend Development Agenda

## 1. 프로젝트 전제

Relia는 보험 영업 운영 시스템이다.

사용자는 로그인 후 권한에 따라 접근 가능한 메뉴와 데이터 조회 범위가 달라진다.

권한은 다음과 같다.

| 권한             | 설명        | 주요 접근 범위                                   |
| -------------- | --------- | ------------------------------------------ |
| FP             | 설계사       | 본인이 담당하는 고객, 상담, 계약, 인수인계, 수수료 정보                |
| BRANCH_MANAGER | 지점장       | 본인 소속 지점의 고객, 상담, 계약, 설계사, 인수인계, 수수료 정보    |
| HQ_MANAGER     | 본사 영업 담당자 | 전체 지점의 고객, 상담, 계약, 인수인계, 조직, 보험 상품, 수수료 정보 |
| SYSTEM_ADMIN   | 시스템 관리자   | 사용자, 조직, 권한 등 시스템 관리 정보                    |

프론트엔드는 로그인 사용자의 `userRole`, `organizationId`, `userId`를 기준으로
사이드바 메뉴 노출, 라우팅 접근 제어, 화면 내 필터 노출 여부를 제어한다.

단, 프론트엔드의 메뉴 숨김과 라우팅 제어는 UX 목적의 1차 제어이며, 실제 권한 검증과 데이터 접근 제한은 백엔드 API에서 최종 수행한다.


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


## 2-1. 디자인 레퍼런스 문서 사용 규칙

화면 구현 전 반드시 아래 순서로 디자인 레퍼런스 문서를 확인한다.

### 우선순위

1. `docs/design-ref/common/common-design.md`
2. 역할별 디자인 문서

   * `docs/design-ref/fp/*.md`
   * `docs/design-ref/branch/*.md`
   * `docs/design-ref/hq/*.md`
3. 해당 폴더 내 스크린샷 이미지

### 적용 규칙

* 공통 레이아웃은 반드시 `common-design.md`를 기준으로 구현한다.
* 역할별 화면은 해당 역할 폴더의 문서를 추가로 확인한다.
* 역할별 문서와 공통 문서가 충돌할 경우 역할별 문서를 우선 적용한다.
* 화면 구현 시 동일 폴더 내 스크린샷을 참고하여 UI를 구성한다.
* 스크린샷에 없는 동작은 해당 문서의 설명을 우선 적용한다.
* 설명과 스크린샷이 모두 없는 경우 기존 공통 패턴을 재사용한다.
* 새로운 레이아웃을 임의로 생성하지 않는다.

### 폴더 구조

```text
docs/
└── design-ref/
    ├── common/
    │   ├── common-design.md
    │   ├── sidebar.png
    │   ├── sidebar-toggle.png
    │   ├── header.png
    │   └── footer.png
    │
    ├── auth/
    │   ├── *.md
    │   └── *.png
    │
    ├── handover/
    │   ├── *.md
    │   └── *.png
    │
    └── .../
        ├── *.md
        └── *.png
```

## 3. 권한별 사이드바 메뉴

### FP 메뉴

- 내 대시보드
- 고객 관리
  - 설계사 고객 목록
- 상담 관리
  - 고객별 상담 목록
  - 상담 등록
- 계약 관리
  - 보유 계약 목록
- 인수인계
  - 받은 인수인계 목록
- 수수료 관리
  - 설계사 지급 수수료 현황

### BRANCH_MANAGER 메뉴

- 지점 대시보드
- 고객 관리
  - 지점 고객 목록
- 상담 관리
  - 지점 상담 목록
- 계약 관리
  - 지점 계약 목록
- 인수인계
  - 인수인계 요청 목록
- 지점 설계사 관리
  - 지점 설계사 목록
- 수수료 관리
  - 지점 수수료 현황

### HQ_MANAGER 메뉴

- 본사 대시보드
- 고객 관리
  - 전체 고객 목록
- 계약 관리
  - 전체 계약 목록
- 상담 관리
	- 전체 상담 목록
- 인수인계 관리
  - 전체 인수인계 현황
- 조직 및 인사 관리
  - 조직도
  - 전체 설계사 목록
- 보험 상품 관리
  - 제휴 보험사 목록
  - 보험 상품 목록
- 수수료 관리
  - 수수료 대시보드

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
