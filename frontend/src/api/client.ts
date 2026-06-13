/** Typed fetch client for the CivicLens API.
 *
 * Base URL comes from VITE_API_URL, defaulting to the same-origin `/api` path.
 * Both deployments serve the API there: nginx proxies `/api` in the Docker
 * image, and the Vite dev server proxies it to localhost:8099 (see
 * vite.config.ts) — so the browser never makes a cross-origin request and no
 * CORS is needed. Non-2xx responses throw, so callers/hooks surface a real
 * error state rather than rendering fabricated data.
 */
import type {
  APIBlocs,
  APIDefectionScore,
  APIMP,
  APIMPDetail,
  APITopic,
  APIVote,
} from './types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`API ${response.status} for ${path}`);
  }
  return (await response.json()) as T;
}

export const fetchMPs = (term = 10): Promise<APIMP[]> =>
  getJson(`/mps?term=${term}`);

export const fetchMP = (id: number, term = 10): Promise<APIMPDetail> =>
  getJson(`/mps/${id}?term=${term}`);

export const fetchMPVotes = (id: number, term = 10): Promise<APIVote[]> =>
  getJson(`/mps/${id}/votes?term=${term}`);

export const fetchMPDefectionScore = (
  id: number,
  term = 10,
): Promise<APIDefectionScore> => getJson(`/mps/${id}/defection-score?term=${term}`);

export const fetchTopics = (term = 10): Promise<APITopic[]> =>
  getJson(`/topics?term=${term}`);

export const fetchBlocs = (term = 10): Promise<APIBlocs> =>
  getJson(`/blocs?term=${term}`);
