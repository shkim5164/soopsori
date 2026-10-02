<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Repository Workflow Rules
- 커밋 시 author와 committer 이메일은 모두 `gk457@naver.com`을 사용한다. 커밋 전에 `git var GIT_AUTHOR_IDENT`와 `git var GIT_COMMITTER_IDENT`로 실제 적용될 이메일을 확인한다.
- 항상 깃 커밋 및 푸쉬(origin과 deploy 모두)를 수행하기 전에 `npm run lint`와 `npm run build`를 실행하여 코드를 검증해야 합니다. 에러가 발생하면 반드시 수정한 후 커밋해야 합니다.


## 프로젝트 맥락과 읽기 순서
- 숲소리는 한국어 밴드 동호회 서비스다. 곡·세션 모집, 모임·출석·포인트, 클래스, 합주실, 공지사항을 관리한다.
- 처음 작업할 때 [README.md](README.md)의 실행 방법과 [docs/architecture.md](docs/architecture.md)의 기능별 경로를 확인한다. 작업 대상과 관련된 파일부터 읽는다.
- [INDEX.md](INDEX.md)는 초기 기획이다. 현재 동작은 소스와 Prisma 스키마로 확인한다.
- [docs/development.md](docs/development.md)에 환경 변수, 검증 절차, 환경 오류 대응이 있다.

## 코드 변경 기준
- 실제 설치된 Next.js 문서를 먼저 읽는다. `@/*`는 `src/*` 별칭이다.
- 페이지는 `src/app`, API는 `src/app/api`, 클래스의 변경 처리는 `src/app/classes/actions.ts`에 있다. 기존 기능의 데이터 흐름을 따라 수정한다.
- 인증은 `src/auth.ts`의 `auth()`, DB는 `src/lib/prisma.ts`의 공용 클라이언트를 사용한다. 서버 전용 코드를 Client Component에 가져오지 않는다.
- 변경 API와 Server Action에서 로그인·소유자·관리자 권한을 검증한다. UI에서 버튼을 숨기는 것만으로 권한 검증을 대신하지 않는다.
- 기존 한국어 UI와 디자인을 유지한다. 공통 UI는 `src/components/ui`, 토큰은 `src/app/globals.css`, 디자인 지침은 `DESIGN_SYSTEM_PROMPT.md`를 참고한다.
- 모임 출석, 곡 세션, 모임 곡 참여는 서로 다른 모델이다. 포인트 정산·참여 집계 변경 전 architecture 문서의 도메인 주의점을 읽는다.
- 스키마를 바꾸면 Prisma 클라이언트를 재생성하고 관련 조회·응답·화면 타입을 함께 확인한다. DB 변경은 대상 개발 DB와 적용 방법을 확인한 뒤 실행한다.
- `.env`의 실제 값, 비밀번호, 토큰을 문서·로그·커밋에 넣지 않는다. 새 환경 변수는 `.env.example`과 개발 문서에 이름과 용도를 추가한다.

## 검증과 완료 보고
- `npm run check`는 lint와 production build를 순서대로 실행한다. 빠른 타입 검사는 `npm run typecheck`를 사용한다.
- lint/build만으로 사용자 흐름을 검증했다고 보고하지 않는다. 변경한 기능은 개발 DB에서 정상·비로그인·권한 없음·실패 흐름 중 해당 항목을 확인한다.
- 실행하지 못한 검증과 환경 제약은 명시한다. 오류를 숨기려고 lint 규칙이나 타입 검사를 완화하지 않는다.
- 코드 위치, 명령, 환경 변수가 달라졌다면 관련 문서도 갱신한다. 완료 시 변경 내용과 검증 결과를 간단히 보고한다.
