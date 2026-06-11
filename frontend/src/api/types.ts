/** API response types — mirror the FastAPI Pydantic schemas (api/schemas.py). */

export interface APIMP {
  id: number;
  firstName: string;
  lastName: string;
  club: string | null;
  districtName: string | null;
  defectionScore: number | null;
}

export interface APIMPDetail extends APIMP {
  secondName: string | null;
  voivodeship: string | null;
  profession: string | null;
  birthDate: string | null;
  active: boolean;
}

export interface APIVote {
  sitting: number;
  votingNumber: number;
  title: string;
  date: string;
  kind: string;
  vote: string | null;
  club: string | null;
}

export interface Provenance {
  term: number;
  source: string;
  electronicVotingsInStore: number;
  computedAt: string;
}

export interface APIDefectionScore {
  mpId: number;
  term: number;
  score: number | null;
  provenance: Provenance;
}

export interface APITopic {
  topic: string;
  votingCount: number;
}
