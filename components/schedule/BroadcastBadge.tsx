import { getNetworkConfig } from '@/lib/broadcast/mapping';
import type { Broadcast } from '@/lib/types';

interface BroadcastBadgeProps {
  broadcast: Broadcast;
  small?: boolean;
}

export function BroadcastBadge({ broadcast, small }: BroadcastBadgeProps) {
  const config = getNetworkConfig(broadcast.shortName);

  return (
    <span
      className={`inline-flex items-center font-semibold rounded ${
        small ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'
      }`}
      style={{ backgroundColor: config.bgColor, color: config.textColor }}
      title={config.name}
    >
      {config.shortName}
    </span>
  );
}

interface BroadcastListProps {
  broadcasts: Broadcast[];
  small?: boolean;
}

export function BroadcastList({ broadcasts, small }: BroadcastListProps) {
  if (!broadcasts.length) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {broadcasts.map((b) => (
        <BroadcastBadge key={b.shortName} broadcast={b} small={small} />
      ))}
    </div>
  );
}
