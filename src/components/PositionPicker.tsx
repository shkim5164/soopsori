"use client";

import {
  POSITIONS,
  getPositionLabel,
  getPositionBadgeClass,
  getRankLabel,
  getRankColor,
  sortByRank,
  type RankedPosition,
} from "@/lib/constants";

interface PositionPickerProps {
  value: RankedPosition[];
  onChange: (positions: RankedPosition[]) => void;
}

export default function PositionPicker({ value, onChange }: PositionPickerProps) {
  const getSelectedRank = (posId: string): number | null => {
    const found = value.find((p) => p.id === posId);
    return found ? found.rank : null;
  };

  const handleClick = (posId: string) => {
    const existing = value.find((p) => p.id === posId);

    if (!existing) {
      // 선택되지 않은 포지션 → 다음 빈 순위로 추가
      const usedRanks = value.map((p) => p.rank).filter((r) => r > 0);
      let nextRank = 0;
      for (const r of [1, 2, 3]) {
        if (!usedRanks.includes(r)) {
          nextRank = r;
          break;
        }
      }
      onChange([...value, { id: posId, rank: nextRank }]);
    } else {
      // 이미 선택된 포지션 → 순위 순환 또는 제거
      // 순위 있으면 → 기타(0)으로 → 제거
      if (existing.rank > 0) {
        onChange(value.map((p) => (p.id === posId ? { ...p, rank: 0 } : p)));
      } else {
        onChange(value.filter((p) => p.id !== posId));
      }
    }
  };

  const handleSetRank = (posId: string, rank: number) => {
    // 기존에 같은 순위를 가진 포지션이 있으면 swap
    const prevHolder = value.find((p) => p.rank === rank && p.id !== posId);
    const current = value.find((p) => p.id === posId);

    let updated = value.map((p) => {
      if (p.id === posId) return { ...p, rank };
      if (prevHolder && p.id === prevHolder.id) return { ...p, rank: current?.rank ?? 0 };
      return p;
    });

    onChange(updated);
  };

  const handleSetYear = (posId: string, year: number | undefined) => {
    onChange(
      value.map((p) => (p.id === posId ? { ...p, startYear: year } : p))
    );
  };

  const sorted = sortByRank(value);
  const rankedPositions = sorted.filter((p) => p.rank > 0);
  const otherPositions = sorted.filter((p) => p.rank === 0);

  return (
    <div className="space-y-4">
      {/* 포지션 선택 그리드 */}
      <div>
        <p className="text-xs text-gray-800 font-bold mb-2">
          클릭하여 포지션을 추가하세요. 다시 클릭하면 &quot;기타&quot;로, 한 번 더 클릭하면 제거됩니다.
        </p>
        <div className="flex flex-wrap gap-2">
          {POSITIONS.map((pos) => {
            const rank = getSelectedRank(pos.id);
            const isSelected = rank !== null;

            return (
              <button
                key={pos.id}
                type="button"
                onClick={() => handleClick(pos.id)}
                className={`relative px-3 py-1.5 text-sm transition-all duration-200 border-2 border-black ${
                  isSelected
                    ? `${getPositionBadgeClass(pos.id)} neo-shadow -translate-y-0.5`
                    : "bg-white text-gray-800 font-bold hover:bg-gray-50 hover:text-black hover:neo-shadow-sm"
                }`}
              >
                {pos.emoji} {pos.label}
                {isSelected && rank !== null && rank > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-neo-yellow border-2 border-black text-black font-black text-xs flex items-center justify-center">
                    {rank}
                  </span>
                )}
                {isSelected && rank === 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white border-2 border-black text-black font-black text-xs flex items-center justify-center">
                    +
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 선택된 포지션 순위 조정 */}
      {value.length > 0 && (
        <div className="p-4 rounded-none bg-white border-3 border-black neo-shadow border border-2 border-black space-y-2">
          <p className="text-xs font-medium text-black font-bold mb-2">📋 순위 배정 (드롭다운으로 조정)</p>
          
          {rankedPositions.map((rp) => (
            <div key={rp.id} className="flex items-center gap-2">
              <select
                value={rp.rank}
                onChange={(e) => handleSetRank(rp.id, Number(e.target.value))}
                className="w-20 px-2 py-1.5 rounded-none bg-white border-3 border-black neo-shadow border border-2 border-black text-sm text-black font-black focus:outline-none focus:border-3 border-black"
              >
                {[1, 2, 3].map((r) => (
                  <option key={r} value={r}>{getRankLabel(r)}</option>
                ))}
                <option value={0}>기타</option>
              </select>
              <span className={`flex-1 text-sm px-2.5 py-1 rounded-none ${getPositionBadgeClass(rp.id)}`}>
                {POSITIONS.find((p) => p.id === rp.id)?.emoji} {getPositionLabel(rp.id)}
              </span>
              <input
                type="number"
                placeholder="시작연도(YYYY)"
                min="1950"
                max={new Date().getFullYear()}
                value={rp.startYear || ""}
                onChange={(e) => handleSetYear(rp.id, e.target.value ? Number(e.target.value) : undefined)}
                className="w-28 px-2 py-1.5 rounded-none bg-white border-3 border-black neo-shadow border border-2 border-black text-sm text-black font-black placeholder-neutral-600 focus:outline-none focus:border-3 border-black"
              />
              <button
                type="button"
                onClick={() => onChange(value.filter((p) => p.id !== rp.id))}
                className="text-gray-800 hover:text-danger-400 transition-colors p-1"
              >
                ✕
              </button>
            </div>
          ))}
          
          {otherPositions.length > 0 && (
            <>
              <div className="flex items-center gap-2 mt-2 pt-2">
                <span className="text-xs text-gray-800 font-bold w-20">기타</span>
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {otherPositions.map((rp) => (
                    <div key={rp.id} className="flex items-center gap-1.5 p-1.5 rounded-none border border-2 border-black bg-white border-3 border-black neo-shadow">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getPositionBadgeClass(rp.id)}`}>
                        {POSITIONS.find((p) => p.id === rp.id)?.emoji} {getPositionLabel(rp.id)}
                      </span>
                      <input
                        type="number"
                        placeholder="연도"
                        min="1950"
                        max={new Date().getFullYear()}
                        value={rp.startYear || ""}
                        onChange={(e) => handleSetYear(rp.id, e.target.value ? Number(e.target.value) : undefined)}
                        className="w-16 px-1.5 py-0.5 rounded bg-white border-3 border-black neo-shadow border border-2 border-black text-xs text-black font-black placeholder-neutral-600 focus:outline-none focus:border-3 border-black"
                      />
                      <button
                        type="button"
                        onClick={() => onChange(value.filter((p) => p.id !== rp.id))}
                        className="text-gray-800 hover:text-danger-400 text-xs transition-colors pr-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
