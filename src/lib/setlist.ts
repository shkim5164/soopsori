/** 일반 합주곡을 먼저, 밴드는 처음 등장한 순서대로 묶습니다. 그룹 안의 곡 순서는 유지합니다. */
export function groupSetlist<T extends { song: { band: { id: string; name: string } | null } }>(songs: T[]) {
  const groups = new Map<string, { id: string; name: string; songs: T[] }>();
  groups.set("general", { id: "general", name: "일반 합주곡", songs: [] });
  for (const song of songs) {
    const band = song.song.band;
    const key = band ? `band:${band.id}` : "general";
    if (!groups.has(key)) groups.set(key, { id: key, name: `밴드곡 · ${band!.name}`, songs: [] });
    groups.get(key)!.songs.push(song);
  }
  return [...groups.values()].filter(group => group.songs.length > 0);
}
