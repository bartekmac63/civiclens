import { Badge } from '@/components/Badge';
import { DefectionScore } from '@/components/DefectionScore';
import { partyColor, type PartyName } from '@/tokens';

export interface MPCardProps {
  id: number;
  name: string;
  /** Party/club abbreviation. Known parties get branded styling. */
  party: string;
  constituency: string;
  /** Defection score 0–1, shown two decimals. */
  defectionScore: number;
  onClick?: () => void;
}

function isPartyName(p: string): p is PartyName {
  return p in partyColor;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/**
 * §2.5 — compact card for one MP. The whole card is a button so it is
 * keyboard-operable; the avatar derives its colour from the party branding.
 */
export function MPCard({
  id,
  name,
  party,
  constituency,
  defectionScore,
  onClick,
}: MPCardProps) {
  const known = isPartyName(party);
  const avatarStyle = known
    ? {
        backgroundColor: `color-mix(in srgb, ${partyColor[party].bg} 12%, transparent)`,
        color: partyColor[party].bg,
      }
    : undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      data-mp-id={id}
      className="flex w-full items-center gap-4 rounded-md border border-border-subtle bg-bg-primary p-4 text-left transition-colors duration-base hover:border-border hover:bg-bg-secondary active:scale-99"
    >
      <span
        aria-hidden="true"
        style={avatarStyle}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg-tertiary font-mono text-sm text-text-secondary"
      >
        {initials(name)}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate font-medium text-text-primary">{name}</span>
          {known ? (
            <Badge variant="party" party={party} />
          ) : (
            <Badge variant="status">{party}</Badge>
          )}
        </span>
        <span className="mt-0.5 block truncate text-sm text-text-secondary">
          {constituency}
        </span>
        <span className="mt-2 flex items-center gap-2 text-xs text-text-secondary">
          <span>Defection</span>
          <DefectionScore score={defectionScore} />
        </span>
      </span>
    </button>
  );
}

export default MPCard;
