/** Small data-fetching hooks (loading / error / data), no extra deps. */
import { useEffect, useState } from 'react';
import {
  fetchMP,
  fetchMPDefectionScore,
  fetchMPVotes,
  fetchMPs,
  fetchTopics,
} from './client';
import type {
  APIDefectionScore,
  APIMP,
  APIMPDetail,
  APITopic,
  APIVote,
} from './types';

export interface Resource<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

function useResource<T>(fetcher: () => Promise<T>, deps: unknown[]): Resource<T> {
  const [state, setState] = useState<Resource<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ data: null, loading: true, error: null });
    fetcher()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

export const useMPs = (term = 10): Resource<APIMP[]> =>
  useResource(() => fetchMPs(term), [term]);

export const useMP = (id: number, term = 10): Resource<APIMPDetail> =>
  useResource(() => fetchMP(id, term), [id, term]);

export const useMPVotes = (id: number, term = 10): Resource<APIVote[]> =>
  useResource(() => fetchMPVotes(id, term), [id, term]);

export const useMPDefectionScore = (
  id: number,
  term = 10,
): Resource<APIDefectionScore> =>
  useResource(() => fetchMPDefectionScore(id, term), [id, term]);

export const useTopics = (term = 10): Resource<APITopic[]> =>
  useResource(() => fetchTopics(term), [term]);
