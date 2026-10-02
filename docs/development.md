# 개발과 검증

## 환경 변수

`.env.example`을 `.env`로 복사하고 실제 값은 로컬에서만 입력합니다. 기존 `.env`를 덮어쓰지 않습니다.

| 변수 | 용도 |
| --- | --- |
| `DATABASE_URL` | 런타임과 Prisma CLI가 공통으로 사용할 PostgreSQL 연결 |
| `POSTGRES_PRISMA_URL`, `POSTGRES_URL` | 런타임 DB 연결의 우선 후보 |
| `POSTGRES_URL_NON_POOLING` | Prisma CLI의 우선 연결 |
| `AUTH_SECRET` | Auth.js 세션 서명용 비밀값 |
| `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` | 브라우저 지도 SDK와 서버 지오코딩의 클라이언트 ID |
| `NAVER_MAP_CLIENT_SECRET` | 서버 지오코딩 비밀키 |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 이미지 업로드 |

런타임 우선순위는 `POSTGRES_PRISMA_URL` → `POSTGRES_URL` → `DATABASE_URL`, CLI는 `POSTGRES_URL_NON_POOLING` → `DATABASE_URL`입니다. 서로 다른 DB를 가리키지 않도록 확인합니다. 현재 런타임은 URL 쿼리 문자열을 제거하고 TLS 연결을 설정하므로 TLS 미지원 로컬 PostgreSQL은 그대로 사용할 수 없습니다.

지도 ID의 기존 별칭은 `NAVER_MAP_CLIENT_ID`, 서버 비밀키의 기존 별칭은 `NAVER_MAP_SECRET_ID`입니다. 기존 등록 API에 공개 접두사의 비밀키 fallback이 있지만 새 설정에는 사용하지 않습니다. 비밀값에 `NEXT_PUBLIC_` 접두사를 붙이지 않습니다.

지도·업로드 기능을 사용하려면 해당 서비스 키가 필요합니다. Auth secret은 예를 들어 `openssl rand -base64 32`로 생성하여 로컬 환경에 저장합니다.

## DB 준비

현재 저장소에는 Prisma 스키마가 있으며 마이그레이션 이력과 seed는 없습니다. 신규 **일회용 개발 DB**를 준비한 경우에만 연결 대상을 확인하고 아래 명령으로 스키마를 적용할 수 있습니다.

```sh
npx prisma db push
npx prisma generate
```

운영 DB에 이 명령을 개발 초기화 절차로 사용하지 않습니다. 스키마 변경 시 데이터 보존과 배포 적용 방법을 별도로 정합니다. `prisma generate` 자체는 DB 스키마를 변경하지 않습니다.

## 검증 절차

```sh
npm run typecheck
npm run check
```

`typecheck`는 Next.js 라우트 타입을 만든 뒤 `tsc --noEmit`을 실행합니다. `check`는 lint 성공 후 build를 실행합니다. build 성공만으로 인증·DB 쓰기·외부 연동을 검증한 것은 아닙니다.

기능 변경 시 개발 DB에서 관련 흐름을 확인합니다.

| 변경 영역 | 수동 확인 예시 |
| --- | --- |
| 권한 / API | 정상 사용자, 비로그인, 다른 작성자, 관리자, 없는 ID |
| 곡 / 세션 | 등록, 참여, 취소, 관리자 지정, 화면 갱신 |
| 모임 / 포인트 | 출석 변경, 세트리스트 집계, 완료 정산, 재완료 거부, 포인트 이력 |
| 클래스 | 생성, 정원 도달, 중복 참여, 취소, 소유자와 관리자 수정 |
| UI | 모바일·데스크톱, 밝은·어두운 테마, 빈 목록, 로딩·실패 상태 |

자동화된 기능 테스트 러너는 아직 없습니다. 새 테스트는 수정한 동작의 회귀를 검증하도록 구성하며, 테스트가 실행되지 않았다면 완료 보고에 명시합니다.

## 환경 문제 대응

- `.next/trace`의 `EACCES`: `.next`의 소유권과 쓰기 권한을 확인합니다. `sudo npm`으로 설치·빌드하지 않습니다. 캐시 소유권을 해결할 수 없다면 Next.js의 `distDir`을 임시 쓰기 가능한 프로젝트 내부 경로로 설정해 검증하고, 설정과 자동 변경된 `tsconfig.json`을 복원합니다.
- Turbopack의 프로세스/포트 권한 오류: 환경 권한을 확인합니다. 환경상 실행할 수 없으면 `npm run build -- --webpack`으로 검증하고 대체 번들러 사용 사실을 보고합니다. 이 경우 lint는 별도로 실행합니다.
- 임시 빌드 디렉터리는 검사 대상에 섞이지 않게 검증 후 정리합니다. 기존 사용자 파일과 캐시는 임의로 삭제하지 않습니다.
- lint 경고는 에러와 구분해 보고합니다. 기존 경고를 숨기려고 규칙을 끄지 않습니다.

원격 이름은 `origin`과 `deploy`입니다. 푸시 전 현재 브랜치와 원격을 확인하고, 커밋 및 양쪽 푸시 전 lint/build를 실행합니다. 배포 완료 여부는 Git 푸시 성공만으로 판단하지 않습니다.
