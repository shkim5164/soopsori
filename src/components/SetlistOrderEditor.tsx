"use client";

import { useRef, useState } from "react";
import Modal from "@/components/Modal";

interface Entry {
  id: string;
  song: { title: string; artist: string; band: { name: string } | null };
}

export default function SetlistOrderEditor({ meetingId, songs, onClose, onSaved }: {
  meetingId: string;
  songs: Entry[];
  onClose: () => void;
  onSaved: (ids: string[]) => void;
}) {
  const [original] = useState(() => songs.map(song => song.id));
  const [draft, setDraft] = useState(songs);
  const [dragged, setDragged] = useState<string | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const changed = draft.some((song, index) => song.id !== original[index]);

  function move(id: string, destination: number) {
    if (pending.current) return;
    const from = draft.findIndex(song => song.id === id);
    if (from < 0 || destination < 0 || destination >= draft.length || from === destination) return;
    const next = [...draft];
    const [song] = next.splice(from, 1);
    next.splice(destination, 0, song);
    setDraft(next);
    setNotice(`${song.song.title}, ${destination + 1}번째로 이동`);
  }

  async function save() {
    if (pending.current || !changed) return;
    pending.current = true;
    setSaving(true);
    setError("");
    try {
      const ids = draft.map(song => song.id);
      const response = await fetch(`/api/meetings/${meetingId}/songs/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songIds: ids, originalSongIds: original }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "순서를 저장하지 못했습니다.");
      }
      onSaved(ids);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "순서를 저장하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  return <Modal isOpen onClose={() => { if (!pending.current) onClose(); }} title="세트리스트 순서 변경">
    <p className="text-sm mb-4">⠿ 손잡이를 드래그하거나 위·아래 버튼으로 옮겨 주세요. 저장하면 모두에게 반영됩니다.</p>
    <ol className="space-y-3" aria-label="공연 순서">
      {draft.map((entry, index) => <li key={entry.id}
        onDragOver={event => { if (dragged && !saving) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setTarget(entry.id); } }}
        onDrop={event => { event.preventDefault(); if (dragged) move(dragged, index); setDragged(null); setTarget(null); }}
        className={`flex items-center gap-2 border-2 border-black p-2 ${target === entry.id ? "bg-neo-yellow" : "bg-white"} ${dragged === entry.id ? "opacity-50" : ""}`}>
        <span draggable={!saving} aria-hidden="true"
          onDragStart={event => { event.dataTransfer.setData("text/plain", entry.id); event.dataTransfer.effectAllowed = "move"; setDragged(entry.id); }}
          onDragEnd={() => { setDragged(null); setTarget(null); }}
          className="cursor-grab p-2 text-xl">⠿</span>
        <span className="font-black">{index + 1}.</span>
        <div className="flex-1 min-w-0"><p className="font-bold break-words">{entry.song.title}</p>
          <p className="text-xs">{entry.song.artist} · {entry.song.band?.name ?? "일반 합주곡"}</p></div>
        <div className="flex shrink-0 gap-1">
          <button type="button" disabled={saving || index === 0} onClick={() => move(entry.id, index - 1)} aria-label={`${entry.song.title} 위로 이동`} className="w-10 h-11 border-2 border-black font-black disabled:opacity-30">↑</button>
          <button type="button" disabled={saving || index === draft.length - 1} onClick={() => move(entry.id, index + 1)} aria-label={`${entry.song.title} 아래로 이동`} className="w-10 h-11 border-2 border-black font-black disabled:opacity-30">↓</button>
        </div>
      </li>)}
    </ol>
    <p className="sr-only" role="status">{notice}</p>
    {error && <p role="alert" className="mt-4 font-bold text-danger-400">{error}</p>}
    <div className="sticky bottom-0 bg-white pt-4 mt-4 flex gap-3">
      <button type="button" disabled={saving} onClick={onClose} className="neo-btn flex-1 disabled:opacity-50">취소</button>
      <button type="button" disabled={saving || !changed} onClick={save} className="neo-btn neo-btn-primary flex-1 disabled:opacity-50">{saving ? "저장 중…" : "순서 저장"}</button>
    </div>
  </Modal>;
}
