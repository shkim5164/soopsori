// 실제 DB를 변경하지 않는 순서 변경 API 회귀 검증.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import vm from 'node:vm';
import * as nextServer from 'next/server.js';
import { Prisma } from '@prisma/client';
let session;
let meeting;
let writes = [];
let failure = false;
const prisma = {
  meeting: { findUnique: async () => meeting },
  meetingSong: { update: async data => { writes.push(data); } },
  $transaction: async (callback, options) => {
    assert.equal(options.isolationLevel, 'Serializable');
    if (failure) throw new Prisma.PrismaClientKnownRequestError('conflict', { code: 'P2034', clientVersion: 'test' });
    return callback(prisma);
  },
};
const cache = new Map();
function load(file) {
  const absolute = path.resolve(file);
  if (cache.has(absolute)) return cache.get(absolute);
  const exports = {};
  const js = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const scopedRequire = id => {
    if (id === '@/auth') return { auth: async () => session };
    if (id === '@/lib/prisma') return { prisma };
    if (id.startsWith('@/')) return load(`src/${id.slice(2)}.ts`);
    if (id === "next/server") return nextServer;
    if (id === "@prisma/client") return { Prisma };
    throw new Error(`Unexpected dependency: ${id}`);
  };
  vm.runInNewContext(js, { exports, require: scopedRequire, console, URL }, { filename: absolute });
  cache.set(absolute, exports);
  return exports;
}
const request = body => ({ json: async () => body });
const params = id => ({ params: Promise.resolve({ id }) });
const json = value => JSON.parse(JSON.stringify(value));
const { PATCH } = load('src/app/api/meetings/[id]/songs/reorder/route.ts');
const input = { originalSongIds: ['a', 'b', 'c'], songIds: ['c', 'a', 'b'] };
const send = body => PATCH(request(body), params('meeting'));
meeting = { status: 'UPCOMING', meetingSongs: ['a', 'b', 'c'].map(id => ({ id })) };
session = null;
assert.equal((await send(input)).status, 401);
session = { user: { id: 'member', role: 'MEMBER' } };
assert.equal((await send(input)).status, 403);
session = { user: { id: 'admin', role: 'ADMIN' } };
for (const value of [null, {}, { ...input, songIds: ['a', 'a', 'c'] }, { ...input, songIds: ['a', 'b'] }, { ...input, songIds: ['a', 'b', 'foreign'] }, { ...input, originalSongIds: [1, 2, 3] }]) {
  assert.equal((await send(value)).status, 400);
}
assert.equal((await PATCH({ json: async () => { throw new SyntaxError(); } }, params('meeting'))).status, 400);
assert.equal((await send({ ...input, originalSongIds: ['b', 'a', 'c'] })).status, 409);
assert.equal((await send({ songIds: ['a', 'b'], originalSongIds: ['a', 'b'] })).status, 409);
meeting.status = 'COMPLETED';
assert.equal((await send(input)).status, 400);
meeting.status = 'CANCELLED';
assert.equal((await send(input)).status, 400);
const saved = meeting;
meeting = null;
assert.equal((await send(input)).status, 404);
meeting = saved;
meeting.status = 'UPCOMING';
assert.equal(writes.length, 0);
assert.equal((await send(input)).status, 200);
assert.deepEqual(json(writes), ['c', 'a', 'b'].map((id, i) => ({ where: { id, meetingId: 'meeting' }, data: { orderNum: i + 1 } })));
failure = true;
assert.equal((await send(input)).status, 409);
const { groupSetlistInOrder } = load('src/lib/setlist.ts');
const entries = [
  { id: 'a', song: { band: { id: 'band', name: '밴드' } } },
  { id: 'b', song: { band: null } },
  { id: 'c', song: { band: { id: 'band', name: '밴드' } } },
  { id: 'd', song: { band: { id: 'band', name: '밴드' } } },
];
assert.deepEqual(json(groupSetlistInOrder(entries).map(g => g.songs.map(s => s.id))), [['a'], ['b'], ['c', 'd']]);
assert.equal(groupSetlistInOrder([]).length, 0);
console.log('세트리스트 검증 통과: 관리자 권한, 입력 검증, 모임 상태, 누락·외부 항목, 편집 충돌, 저장 순서, 밴드 간 순서 유지');
