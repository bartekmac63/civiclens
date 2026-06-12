import { partyColor, type PartyName } from '@/tokens';

/** Narrow an arbitrary club string to a known, brandable party name. */
export function isPartyName(club: string | null | undefined): club is PartyName {
  return club != null && club in partyColor;
}
