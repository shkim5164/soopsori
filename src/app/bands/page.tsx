"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import Modal from "@/components/Modal";
import { POSITIONS, getPositionLabel } from "@/lib/constants";

import type { Band } from "@/types/band";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("목록을 불러오지 못했습니다");
  return response.json();
};

export default function BandsPage() {
  const { data: session } = useSession();
  const { data: bands, error, isLoading, mutate } = useSWR<Band[]>("/api/bands", fetcher);
  const { data: members, error: membersError } = useSWR<{ id: string; name: string | null }[]>(session ? "/api/bands/members" : null, fetcher);
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [rows, setRows] = useState<{ userId: string; position: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setSaveError("");
    try {
      const response = await fetch(editing ? `/api/bands/${editing}` : "/api/bands", {
        method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, members: rows }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await mutate();
      setOpen(false);
    } catch (error) { setSaveError(error instanceof Error ? error.message : "저장에 실패했습니다"); }
    finally { setBusy(false); }
  }

  return <div className="max-w-5xl mx-auto px-4 py-8 text-black">
    <div className="flex items-center justify-between gap-4 mb-6">
      <h1 className="text-3xl font-black">우리 밴드</h1>
      {session?.user && <button className="neo-btn neo-btn-primary" onClick={() => { setEditing(null); setName(""); setRows([{ userId: "", position: "vocal" }]); setSaveError(""); setOpen(true); }}>+ 밴드 등록</button>}
    </div>
    <p className="font-bold mb-6">숲소리 회원으로 밴드를 구성하고, 곡을 등록할 때 세션을 한 번에 채워보세요.</p>
    {isLoading && <p>밴드를 불러오는 중입니다.</p>}
    {error && <p role="alert">밴드 목록을 불러오지 못했습니다. <button onClick={() => mutate()} className="underline">다시 시도</button></p>}
    {bands?.length === 0 && <p className="neo-card p-6">아직 등록된 밴드가 없습니다.</p>}
    <div className="grid gap-6 sm:grid-cols-2">
      {bands?.map(band => <article key={band.id} className="neo-card p-5">
        <h2 className="text-xl font-black mb-3">{band.name}</h2>
        <ul className="space-y-2">{band.members.map(m => <li key={`${m.userId}-${m.position}`} className="font-bold">{getPositionLabel(m.position)} · {m.user.name || "이름 없는 회원"}</li>)}</ul>
        {(session?.user?.id === band.creatorId || session?.user?.role === "ADMIN") && <button className="neo-btn mt-4" onClick={() => { setEditing(band.id); setName(band.name); setRows(band.members.map(({ userId, position }) => ({ userId, position }))); setSaveError(""); setOpen(true); }}>밴드 수정</button>}
      </article>)}
    </div>
    <Modal isOpen={open} onClose={() => { if (!busy) setOpen(false); }} title={editing ? "밴드 수정" : "밴드 등록"}>
      <form onSubmit={save} className="space-y-4">
        <label className="block font-bold">밴드 이름<input className="neo-input w-full mt-2" required maxLength={60} value={name} onChange={e => setName(e.target.value)} /></label>
        <p className="text-sm">회원과 밴드에서 맡는 포지션을 선택하세요. 한 회원이 여러 포지션을 맡을 수 있습니다.</p>
        {membersError && <p role="alert">회원 목록을 불러오지 못했습니다. 잠시 후 다시 열어주세요.</p>}
        {rows.map((row, index) => <div className="flex flex-wrap gap-2" key={index}>
          <select aria-label={`구성원 ${index + 1}`} required className="neo-input flex-1 min-w-0" value={row.userId} onChange={e => setRows(rows.map((r, i) => i === index ? { ...r, userId: e.target.value } : r))}>
            <option value="">회원 선택</option>{members?.map(m => <option key={m.id} value={m.id}>{m.name || "이름 없는 회원"}</option>)}
          </select>
          <select aria-label={`포지션 ${index + 1}`} className="neo-input w-36" value={POSITIONS.some(p => p.id === row.position) ? row.position : "custom"} onChange={e => setRows(rows.map((r, i) => i === index ? { ...r, position: e.target.value === "custom" ? "" : e.target.value } : r))}>
            {POSITIONS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}<option value="custom">직접 입력</option>
          </select>
          {!POSITIONS.some(p => p.id === row.position) && <input aria-label={`직접 입력 포지션 ${index + 1}`} placeholder="예: 플루트" required maxLength={50} className="neo-input w-36" value={row.position} onChange={e => setRows(rows.map((r, i) => i === index ? { ...r, position: e.target.value } : r))} />}
          <button type="button" aria-label={`구성원 ${index + 1} 제거`} onClick={() => setRows(rows.filter((_, i) => i !== index))}>×</button>
        </div>)}
        <button type="button" className="neo-btn" onClick={() => setRows([...rows, { userId: "", position: "vocal" }])}>+ 구성원 추가</button>
        {editing && <p className="text-sm">구성원을 수정해도 이미 등록된 곡의 세션은 유지됩니다.</p>}
        {saveError && <p role="alert" className="text-red-600 font-bold">{saveError}</p>}
        <button disabled={busy || !rows.length || !members} className="neo-btn neo-btn-primary w-full disabled:opacity-50">{busy ? "저장 중…" : "저장"}</button>
      </form>
    </Modal>
  </div>;
}
