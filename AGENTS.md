<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Repository Workflow Rules
- 항상 깃 커밋 및 푸쉬(origin과 deploy 모두)를 수행하기 전에 `npm run lint`와 `npm run build`를 실행하여 코드를 검증해야 합니다. 에러가 발생하면 반드시 수정한 후 커밋해야 합니다.
