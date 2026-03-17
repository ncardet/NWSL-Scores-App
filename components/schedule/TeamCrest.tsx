import Image from 'next/image';
import type { Team } from '@/lib/types';

interface TeamCrestProps {
  team: Team;
  size?: number;
  showName?: boolean;
  namePosition?: 'right' | 'below';
}

export function TeamCrest({ team, size = 32, showName, namePosition = 'right' }: TeamCrestProps) {
  const logo = team.logo;

  return (
    <div
      className={`flex items-center gap-2 ${namePosition === 'below' ? 'flex-col text-center' : ''}`}
    >
      <div
        className="relative rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0"
        style={{ width: size, height: size }}
      >
        {logo ? (
          <Image
            src={logo}
            alt={team.name}
            width={size}
            height={size}
            className="object-contain"
            unoptimized
          />
        ) : (
          <span
            className="font-bold text-gray-500"
            style={{ fontSize: size * 0.35 }}
          >
            {team.abbreviation}
          </span>
        )}
      </div>
      {showName && (
        <span className="text-sm font-medium text-gray-700 leading-tight">
          {team.name}
        </span>
      )}
    </div>
  );
}
