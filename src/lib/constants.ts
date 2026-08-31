export const POSITIONS = [
  { id: "vocal", label: "보컬", emoji: "🎤" },
  { id: "acoustic-guitar", label: "어쿠스틱 기타", emoji: "🎸" },
  { id: "electric-guitar", label: "일렉기타", emoji: "⚡" },
  { id: "bass", label: "베이스", emoji: "🎵" },
  { id: "drum", label: "드럼", emoji: "🥁" },
  { id: "keyboard", label: "키보드", emoji: "🎹" },
  { id: "other", label: "그 외", emoji: "🎸" },
] as const;
export type PositionId = (typeof POSITIONS)[number]["id"];

// 포지션 순위 시스템
export interface RankedPosition {
  id: string;
  rank: number; // 1~3: 순위, 0: 기타(순위 없음)
  startYear?: number; // 악기 시작 연도 (YYYY)
}

export function getExperienceYears(startYear?: number): number {
  if (!startYear) return 0;
  const currentYear = new Date().getFullYear();
  return Math.max(0, currentYear - startYear);
}

export function getExperienceBadge(startYear?: number): { label: string; emoji: string } | null {
  if (!startYear) return null;
  const years = getExperienceYears(startYear);

  if (years < 1) return { label: "새싹", emoji: "🌱" };
  if (years < 3) return { label: "루키", emoji: "🌿" };
  if (years < 5) return { label: "프로", emoji: "🎵" };
  if (years < 10) return { label: "베테랑", emoji: "🔥" };
  return { label: "마스터", emoji: "👑" };
}

const RANK_LABELS: Record<number, string> = {
  1: "1순위",
  2: "2순위",
  3: "3순위",
  0: "기타",
};

const RANK_COLORS: Record<number, string> = {
  1: "text-black font-black bg-neo-yellow px-1 bg-gold-500/15 border-gold-500/25",
  2: "text-black font-bold bg-neutral-500/15 border-neutral-500/25",
  3: "text-amber-600 bg-amber-700/15 border-amber-700/25",
  0: "text-gray-800 font-bold bg-white border-3 border-black neo-shadow border-2 border-black",
};

export function getRankLabel(rank: number): string {
  return RANK_LABELS[rank] ?? `${rank}순위`;
}

export function getRankColor(rank: number): string {
  return RANK_COLORS[rank] ?? RANK_COLORS[0];
}

// JSON 문자열 → RankedPosition 배열 파싱
export function parsePositions(positionStr: string | null | undefined): RankedPosition[] {
  if (!positionStr) return [];
  try {
    const parsed = JSON.parse(positionStr);
    if (Array.isArray(parsed)) return parsed;
    // 하위 호환: 이전 단일 문자열("vocal") 형식
    return [];
  } catch {
    // 하위 호환: 이전 단일 문자열 형식
    if (positionStr && POSITIONS.some((p) => p.id === positionStr)) {
      return [{ id: positionStr, rank: 1 }];
    }
    return [];
  }
}

// RankedPosition 배열 → JSON 문자열
export function stringifyPositions(positions: RankedPosition[]): string {
  return JSON.stringify(positions);
}

// 순위별로 정렬 (1→2→3→0)
export function sortByRank(positions: RankedPosition[]): RankedPosition[] {
  return [...positions].sort((a, b) => {
    if (a.rank === 0 && b.rank === 0) return 0;
    if (a.rank === 0) return 1;
    if (b.rank === 0) return -1;
    return a.rank - b.rank;
  });
}

// 대표 포지션 (1순위) 가져오기
export function getPrimaryPosition(positionStr: string | null | undefined): string | null {
  const positions = parsePositions(positionStr);
  const primary = positions.find((p) => p.rank === 1);
  return primary?.id ?? positions[0]?.id ?? null;
}

export function getPositionLabel(id: string): string {
  return POSITIONS.find((p) => p.id === id)?.label ?? id;
}

export function getPositionEmoji(id: string): string {
  return POSITIONS.find((p) => p.id === id)?.emoji ?? "🎵";
}

export function getPositionBadgeClass(id: string): string {
  const classMap: Record<string, string> = {
    vocal: "badge-vocal",
    "acoustic-guitar": "badge-acoustic-guitar",
    "electric-guitar": "badge-electric-guitar",
    bass: "badge-bass",
    drum: "badge-drum",
    keyboard: "badge-keyboard",
    other: "badge-other",
  };
  return classMap[id] ?? "badge-other";
}

// YouTube URL을 embed URL로 변환
export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
  }
  return null;
}

// YouTube 썸네일 URL
export function getYouTubeThumbnail(url: string): string | null {
  if (!url) return null;
  const pattern = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(pattern);
  if (match) return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
  return null;
}

// 날짜 포맷
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// datetime-local input에 넣기 위한 로컬 타임존 기반 yyyy-MM-ddThh:mm 포맷
export function formatDateForInput(date: Date | string): string {
  const d = new Date(date);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 상대 시간
export function timeAgo(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 30) return `${days}일 전`;
  return formatDate(date);
}
