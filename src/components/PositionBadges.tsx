import {
  parsePositions,
  sortByRank,
  getPositionLabel,
  getPositionEmoji,
  getPositionBadgeClass,
  getRankLabel,
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
    return (
      <div className="flex items-center gap-1">
        <span className={`text-xs px-2 py-0.5 rounded-full ${getPositionBadgeClass(primary.id)}`}>
          {getPositionEmoji(primary.id)} {getPositionLabel(primary.id)}
        </span>
        {otherCount > 0 && (
          <span className="text-xs text-neutral-500">+{otherCount}</span>
        )}
      </div>
    );
  }

  // full mode
  const ranked = positions.filter((p) => p.rank > 0);
  const others = positions.filter((p) => p.rank === 0);

  return (
    <div className="flex flex-wrap gap-1.5">
      {ranked.map((rp) => (
        <span
          key={rp.id}
          className={`text-xs px-2 py-0.5 rounded-full ${getPositionBadgeClass(rp.id)} inline-flex items-center gap-1`}
        >
          {getPositionEmoji(rp.id)} {getPositionLabel(rp.id)}
          <span className="opacity-60 text-[10px]">{getRankLabel(rp.rank)}</span>
        </span>
      ))}
      {others.map((rp) => (
        <span
          key={rp.id}
          className={`text-xs px-2 py-0.5 rounded-full opacity-70 ${getPositionBadgeClass(rp.id)}`}
        >
          {getPositionEmoji(rp.id)} {getPositionLabel(rp.id)}
        </span>
      ))}
    </div>
  );
}
