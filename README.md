# 숲소리

밴드 동호회의 밴드 구성·곡·세션 모집, 월별 합주 모임, 출석과 포인트, 클래스, 합주실 및 공지사항을 관리하는 한국어 웹 서비스입니다.

## 개발 시작

Node.js 20.9 이상과 npm이 필요합니다. 정확한 의존성 버전은 `package-lock.json`을 기준으로 설치합니다.

```sh
cp .env.example .env
# .env에 개발용 PostgreSQL 연결 정보와 AUTH_SECRET을 입력합니다.
npm ci
npm run dev
```

[로컬 서비스](http://localhost:3000)를 엽니다. `npm ci`의 postinstall에서 Prisma 클라이언트가 생성됩니다. DB 스키마 적용은 별도 작업입니다. [개발 가이드](docs/development.md)에서 DB 설정과 선택적 외부 서비스를 확인하세요.

## 작업 명령

| 명령 | 용도 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run lint` | ESLint 검사 |
| `npm run typecheck` | Next.js 라우트 타입 생성 후 TypeScript 검사 |
| `npm run build` | 프로덕션 빌드 |
| `npm run check` | lint → build 통합 검증 |
| `npm start` | 빌드 결과 실행 |

커밋 및 origin/deploy 푸시 전에는 lint와 build가 통과해야 합니다. 밴드 API와 세트리스트의 모의 DB 회귀 검증은 `node scripts/test-bands.mjs`로 실행합니다. 실제 DB·브라우저 통합 테스트는 별도 확인이 필요합니다.

## 코드 탐색

- [AGENTS.md](AGENTS.md): AI 에이전트와 개발자의 공통 작업 규칙
- [구조와 도메인](docs/architecture.md): 기능별 수정 위치, 데이터 모델, 주요 규칙
- [개발 가이드](docs/development.md): 환경 변수, DB 준비, 검증과 문제 해결
- [디자인 지침](DESIGN_SYSTEM_PROMPT.md): 기존 UI 스타일과 공통 컴포넌트
- [초기 기획](INDEX.md): 서비스 배경과 최초 요구사항

Next.js App Router, React, TypeScript, Tailwind CSS, Auth.js Credentials/JWT, Prisma/PostgreSQL을 사용합니다. Next.js API는 설치된 `node_modules/next/dist/docs/` 문서를 우선 확인합니다.
