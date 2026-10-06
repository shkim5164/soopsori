// 실제 DB에 연결하지 않고 Route Handler의 권한·입력·세션 배정을 검증합니다.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import vm from 'node:vm';
import * as nextServer from 'next/server.js';
import { Prisma } from '@prisma/client';
let session = { user: { id: 'owner', role: 'MEMBER' } };
let saved;
let songQuery;
const members = [{ userId: 'm1', position: 'vocal' }, { userId: 'm1', position: 'keyboard' }, { userId: 'm2', position: 'drum' }];
const band = { id: 'band', creatorId: 'owner', members };
let song = { id: 'song', userId: 'owner', bandId: null, sessions: [{ id: 'old', position: 'vocal' }] };
const prisma = {
  user: { count: async ({ where }) => where.id.in.filter(id => ['m1', 'm2'].includes(id)).length },
  band: {
    findUnique: async ({ where }) => where.id === 'band' ? band : null,
    create: async ({ data }) => (saved = data),
    update: async ({ data }) => (saved = data),
  },
  song: {
    findMany: async query => { songQuery = query; return []; },
    findUnique: async () => song,
    create: async ({ data }) => (saved = data),
    update: async ({ data }) => (saved = data),
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
async function run() {
  const bands = load('src/app/api/bands/route.ts');
  const bandEdit = load('src/app/api/bands/[id]/route.ts');
  const songs = load('src/app/api/songs/route.ts');
  const songEdit = load('src/app/api/songs/[id]/route.ts');
  // 검색과 밴드·포지션·난이도 필터가 하나의 조회에 함께 적용되는지 확인합니다.
  session = null;
  const response = await songs.GET({ url: 'http://localhost/api/songs?search=%20oAsIs%20&bandId=band&position=vocal&difficulty=3&sort=popular' });
  assert.equal(response.status, 200);
  assert.deepEqual(json(songQuery.where), {
    OR: [
      { title: { contains: 'oAsIs', mode: 'insensitive' } },
      { artist: { contains: 'oAsIs', mode: 'insensitive' } },
      { band: { is: { name: { contains: 'oAsIs', mode: 'insensitive' } } } },
    ],
    bandId: 'band', difficulty: 3, sessions: { some: { position: 'vocal' } },
  });
  assert.deepEqual(json(songQuery.orderBy), { likes: { _count: 'desc' } });
  assert.equal(songQuery.include.likes, false);
  for (const [filter, expected] of [['none', null], ['any', { not: null }], ['band', 'band']]) {
    assert.equal((await songs.GET({ url: `http://localhost/api/songs?bandId=${filter}` })).status, 200);
    assert.deepEqual(json(songQuery.where.bandId), expected);
  }
  await songs.GET({ url: 'http://localhost/api/songs?search=%20%20' });
  assert.equal(songQuery.where, undefined);
  assert.deepEqual(json(songQuery.orderBy), { createdAt: 'desc' });
  session = null;
  assert.equal((await bands.POST(request({}))).status, 401);
  assert.equal((await bandEdit.PATCH(request({}), params('band'))).status, 401);
  assert.equal((await songs.POST(request({}))).status, 401);
  assert.equal((await songEdit.PATCH(request({}), params('song'))).status, 401);
  session = { user: { id: 'outsider', role: 'MEMBER' } };
  assert.equal((await bandEdit.PATCH(request({}), params('band'))).status, 403);
  assert.equal((await songEdit.PATCH(request({}), params('song'))).status, 403);
  session = { user: { id: 'owner', role: 'MEMBER' } };
  for (const invalid of [[], [{ userId: 'missing', position: 'vocal' }], [members[0], members[0]], [{ userId: 'm1', position: '' }]]) {
    assert.equal((await bands.POST(request({ name: '밴드', members: invalid }))).status, 400);
  }
  assert.equal((await bands.POST(request({ name: ' 밴드 ', members }))).status, 201);
  assert.equal(saved.name, '밴드');
  assert.equal(saved.members.create.length, 3);
  assert.equal((await bandEdit.PATCH(request({ name: '밴드', members }), params('missing'))).status, 404);
  session = { user: { id: 'admin', role: 'ADMIN' } };
  assert.equal((await bandEdit.PATCH(request({ name: '수정', members }), params('band'))).status, 200);
  session = { user: { id: 'owner', role: 'MEMBER' } };
  const input = { title: '곡', artist: '아티스트', bandId: 'band', sessions: [{ position: 'fake', userId: 'attacker' }] };
  assert.equal((await songs.POST(request(input))).status, 201);
  assert.equal(saved.bandId, 'band');
  assert.deepEqual(json(saved.sessions.create), members.map(m => ({ ...m, status: 'FILLED' })));
  assert.equal((await songs.POST(request({ ...input, bandId: 'missing' }))).status, 400);
  assert.equal((await songs.POST(request({ ...input, bandId: {} }))).status, 400);
  assert.equal((await songEdit.PATCH(request(input), params('song'))).status, 200);
  assert.deepEqual(json(saved.sessions.deleteMany), {});
  assert.equal(saved.sessions.create.length, 3);
  song = { ...song, bandId: 'band' };
  assert.equal((await songEdit.PATCH(request({ ...input, sessions: undefined }), params('song'))).status, 200);
  assert.equal(saved.sessions, undefined); // 같은 밴드는 기존 세션을 보존
  assert.equal((await songEdit.PATCH(request({ ...input, bandId: '', sessions: undefined }), params('song'))).status, 200);
  assert.equal(saved.bandId, null);
  assert.equal(saved.sessions, undefined); // 밴드 해제도 참여를 보존
  assert.equal((await songs.POST(request({ ...input, bandId: '', sessions: ['vocal'] }))).status, 201);
  assert.deepEqual(json(saved.sessions.create), [{ position: 'vocal', description: null, status: 'OPEN' }]);
  const { groupSetlist } = load('src/lib/setlist.ts');
  const entries = [
    { id: 'a1', song: { band: { id: 'a', name: 'A' } } },
    { id: 'g1', song: { band: null } },
    { id: 'b1', song: { band: { id: 'b', name: 'B' } } },
    { id: 'a2', song: { band: { id: 'a', name: 'A' } } },
  ];
  assert.deepEqual(json(groupSetlist(entries).map(g => g.songs.map(s => s.id))), [['g1'], ['a1', 'a2'], ['b1']]);
  assert.equal(groupSetlist([]).length, 0);
  assert.equal(groupSetlist([entries[0]]).length, 1);
  console.log('밴드 API 회귀 검증 통과: 인증, 권한, 입력 오류, 다중 포지션, 서버 세션 배정, 변경·유지·해제, 일반곡, 검색·밴드 복합 필터');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
