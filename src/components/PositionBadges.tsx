import {
  parsePositions,
  sortByRank,
  getPositionLabel,
  getPositionEmoji,
  getPositionBadgeClass,
  getRankLabel,
  getExperienceBadge,
} from "@/lib/constants";

interface PositionBadgesProps {
  positionStr: string | null | undefined;
  /** compact: 1순위만 표시, full: 전체 표시 */
  mode?: "compact" | "full";
}

export default function PositionBadges({ positionStr, mode = "compact" }: PositionBadgesProps) {
  const positions = sortByRank(parsePositions(positionStr));

  if (positions.length === 0) return null;

  if (mode === "compact") {
    const primary = positions[0];
    const otherCount = positions.length - 1;
    const badge = getExperienceBadge(primary.startYear);
    return (
      <div className="flex items-center gap-1">
        <span className={`text-xs px-2 py-0.5 rounded-full ${getPositionBadgeClass(primary.id)} inline-flex items-center gap-1`}>
          {getPositionEmoji(primary.id)} {getPositionLabel(primary.id)}
          {badge && <span className="opacity-80 text-[10px] ml-0.5" title={`${badge.label} 연차`}>{badge.emoji}</span>}
        </span>
        {otherCount > 0 && (
          <span className="text-xs text-gray-800 font-bold">+{otherCount}</span>
        )}
      </div>
    );
  }

  // full mode
  const ranked = positions.filter((p) => p.rank > 0);
  const others = positions.filter((p) => p.rank === 0);

  return (
    <div className="flex flex-wrap gap-1.5">
      {ranked.map((rp) => {
        const badge = getExperienceBadge(rp.startYear);
        return (
          <span
            key={rp.id}
            className={`text-xs px-2 py-0.5 rounded-full ${getPositionBadgeClass(rp.id)} inline-flex items-center gap-1`}
          >
            {getPositionEmoji(rp.id)} {getPositionLabel(rp.id)}
            <span className="opacity-60 text-[10px]">{getRankLabel(rp.rank)}</span>
            {badge && <span className="opacity-80 text-[10px]" title={`${badge.label} 연차`}>{badge.emoji}</span>}
          </span>
        );
      })}
      {others.map((rp) => {
        const badge = getExperienceBadge(rp.startYear);
        return (
          <span
            key={rp.id}
            className={`text-xs px-2 py-0.5 rounded-full opacity-70 ${getPositionBadgeClass(rp.id)} inline-flex items-center gap-1`}
          >
            {getPositionEmoji(rp.id)} {getPositionLabel(rp.id)}
            {badge && <span className="opacity-80 text-[10px]" title={`${badge.label} 연차`}>{badge.emoji}</span>}
          </span>
        );
      })}
    </div>
  );
}
