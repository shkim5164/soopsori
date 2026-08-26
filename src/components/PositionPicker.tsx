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

  const sorted = sortByRank(value);
  const rankedPositions = sorted.filter((p) => p.rank > 0);
  const otherPositions = sorted.filter((p) => p.rank === 0);

  return (
    <div className="space-y-4">
      {/* 포지션 선택 그리드 */}
      <div>
        <p className="text-xs text-neutral-500 mb-2">
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
                className={`relative px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isSelected
                    ? `${getPositionBadgeClass(pos.id)} ring-2 ring-current shadow-lg`
                    : "bg-forest-900/30 text-neutral-500 hover:text-neutral-400 border border-forest-700/20"
                }`}
              >
                {pos.emoji} {pos.label}
                {isSelected && rank !== null && rank > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gold-500 text-forest-950 text-xs font-bold flex items-center justify-center shadow-md">
                    {rank}
                  </span>
                )}
                {isSelected && rank === 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-forest-600 text-neutral-300 text-xs flex items-center justify-center shadow-md">
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
        <div className="p-4 rounded-xl bg-forest-900/20 border border-forest-700/15 space-y-2">
          <p className="text-xs font-medium text-neutral-400 mb-2">📋 순위 배정 (드롭다운으로 조정)</p>
          
          {rankedPositions.map((rp) => (
            <div key={rp.id} className="flex items-center gap-2">
              <select
                value={rp.rank}
                onChange={(e) => handleSetRank(rp.id, Number(e.target.value))}
                className="w-20 px-2 py-1.5 rounded-lg bg-forest-900/60 border border-forest-700/30 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500/50"
              >
                {[1, 2, 3].map((r) => (
                  <option key={r} value={r}>{getRankLabel(r)}</option>
                ))}
                <option value={0}>기타</option>
              </select>
              <span className={`flex-1 text-sm px-2.5 py-1 rounded-lg ${getPositionBadgeClass(rp.id)}`}>
                {POSITIONS.find((p) => p.id === rp.id)?.emoji} {getPositionLabel(rp.id)}
              </span>
              <button
                type="button"
                onClick={() => onChange(value.filter((p) => p.id !== rp.id))}
                className="text-neutral-600 hover:text-danger-400 transition-colors p-1"
              >
                ✕
              </button>
            </div>
          ))}
          
          {otherPositions.length > 0 && (
            <>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-forest-700/15">
                <span className="text-xs text-neutral-500 w-20">기타</span>
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {otherPositions.map((rp) => (
                    <div key={rp.id} className="flex items-center gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getPositionBadgeClass(rp.id)}`}>
                        {POSITIONS.find((p) => p.id === rp.id)?.emoji} {getPositionLabel(rp.id)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onChange(value.filter((p) => p.id !== rp.id))}
                        className="text-neutral-600 hover:text-danger-400 text-xs transition-colors"
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
