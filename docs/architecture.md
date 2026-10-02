# 구조와 도메인

## 기능별 수정 위치

아래 경로는 저장소 루트 기준입니다. 페이지와 서버 처리, 스키마를 함께 읽으면 기능의 데이터 흐름을 확인할 수 있습니다.

| 기능 | 화면 | 서버 처리 / 공통 코드 |
| --- | --- | --- |
| 로그인·회원가입 | `src/app/login`, `src/app/register` | `src/auth.ts`, `src/app/api/auth`, `src/types/next-auth.d.ts` |
| 곡·세션·좋아요·댓글 | `src/app/songs` | `src/app/api/songs`, `src/components/CreateSongModal.tsx` |
| 모임·출석·세트리스트·정산 | `src/app/meetings` | `src/app/api/meetings` |
| 클래스 | `src/app/classes` | `src/app/classes/actions.ts` (Server Actions) |
| 회원·프로필·포인트 | `src/app/members`, `src/app/profile` | `src/app/api/members` |
| 관리자 | `src/app/admin` | `src/app/api/admin` |
| 합주실·리뷰·지도 | `src/app/studios` | `src/app/api/studios`, 지도 스크립트는 `src/app/layout.tsx` |
| 공지·알림 | `src/app/notices`, `src/components/Navbar.tsx` | `src/app/api/notices`, `src/app/api/notifications` |
| 업로드·리치 텍스트 | `src/components/RichTextEditor.tsx` | `src/app/api/upload` (Vercel Blob) |
| YouTube | `src/components/YouTubeEmbed.tsx` | `src/app/api/youtube`, `src/lib/constants.ts` |
| 스타일 | `src/components/ui`, `src/app/design-system` | `src/app/globals.css`, `DESIGN_SYSTEM_PROMPT.md` |

DB 관계와 삭제 정책의 기준은 `prisma/schema.prisma`입니다. 런타임 연결은 `src/lib/prisma.ts`, Prisma CLI 연결은 `prisma.config.ts`에서 별도로 설정합니다.

## 인증과 데이터 흐름

Auth.js Credentials가 아이디·bcrypt 비밀번호를 확인하고 JWT 세션을 발급합니다. 세션 콜백은 DB에서 회원 역할·포인트·포지션 등을 다시 조회합니다. 역할은 문자열 `MEMBER` / `ADMIN`입니다.

API Route Handler와 클래스 Server Action이 Prisma로 DB에 접근합니다. 권한 조건은 각 핸들러에 있으므로 수정할 엔드포인트의 인증·소유권 검사를 직접 확인해야 합니다. 클래스 Action은 변경 후 `revalidatePath`를 사용하며 일부 작업은 redirect합니다.

## 혼동하기 쉬운 도메인 규칙

- `SongSession`은 곡의 모집 포지션입니다. `OPEN` / `FILLED` 상태와 선택적인 참여 회원을 가집니다.
- `MeetingSong`은 특정 모임의 세트리스트 항목이며 곡, 선곡자(`pickerId`), 순서를 가집니다. 곡 작성자와 선곡자는 다를 수 있습니다.
- `MeetingParticipant`는 모임 곡별 참여입니다. `(meetingSongId, userId)`가 유일하므로 한 회원이 같은 모임 곡에 여러 행을 가질 수 없습니다.
- `MeetingAttendance`는 모임 전체 출석입니다. 곡 세션 신청이나 모임 곡 참여와 같은 데이터가 아닙니다.
- 모임 완료 처리는 `src/app/api/meetings/[id]/complete/route.ts`에 있습니다. 참석자에게 +100, 해당 모임의 중복 제거된 선곡자마다 -200을 적용하고 `PointHistory`를 기록합니다. 곡 수만큼 -200을 반복하지 않습니다.
- 완료 처리는 트랜잭션을 사용하며 이미 완료된 모임을 거부합니다. 사전 상태 조회는 트랜잭션 밖에 있으므로 동시 요청까지 안전하다고 가정하지 않습니다.
- `User.position`은 `RankedPosition[]`의 JSON 문자열이며 과거 단일 포지션 값도 존재할 수 있습니다. `src/lib/constants.ts`의 파싱·직렬화 함수를 사용합니다.
- 클래스 참가자 `(classId, userId)`는 유일합니다. 현재 참가 Action은 정원·중복을 검사하지만 마감 시각 검사는 하지 않습니다. 마감 정책 변경 시 화면과 Action을 함께 검토합니다.

## 문서 유지

API와 화면 경로가 바뀌면 위 표를 갱신합니다. 도메인 규칙을 바꾸면 실제 처리 코드와 이 문서를 함께 수정합니다. `INDEX.md`는 초기 기획이며 현재 구현 보증이나 완성된 테스트 명세가 아닙니다.
