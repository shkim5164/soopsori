"use client";

import useSWR from "swr";
import Link from "next/link";
import { getPositionLabel } from "@/lib/constants";
import type { Band } from "@/types/band";

export default function BandPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { data: bands, error, mutate } = useSWR<Band[]>("/api/bands", async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error("밴드 조회 실패");
    return response.json();
  });
  const selected = bands?.find(b => b.id === value);
  return <div className="space-y-2">
    <label className="block font-bold">연주 밴드
      <select className="neo-input w-full mt-2" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">일반 합주곡 (세션 직접 모집)</option>
        {value && !selected && <option value={value}>선택한 밴드</option>}
        {bands?.map(band => <option key={band.id} value={band.id}>{band.name}</option>)}
      </select>
    </label>
    {error && <p role="alert" className="text-sm">밴드를 불러오지 못했습니다. <button type="button" className="underline" onClick={() => mutate()}>다시 시도</button></p>}
    {selected && <div className="border-2 border-black p-3 bg-neo-yellow text-black text-sm">
      <p className="font-bold">밴드로 새로 지정하면 기존 세션을 아래 구성원으로 교체합니다.</p>
      <ul>{selected.members.map(m => <li key={`${m.userId}-${m.position}`}>{getPositionLabel(m.position)} · {m.user.name || "이름 없는 회원"}</li>)}</ul>
      {!selected.members.length && <p>밴드에 구성원을 먼저 등록해주세요.</p>}
    </div>}
    <Link className="text-sm underline" href="/bands" target="_blank" rel="noopener noreferrer">밴드 등록·관리 ↗</Link>
  </div>;
}
