import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import type { Tables } from '@mr-types/database.types';

export type YoutubeLiveEvent = Tables<'youtube_live_events'>;

const nowIso = () => new Date().toISOString();

/**
 * Sei ore, la stessa soglia di update_youtube_live_statuses. Serve perche' se
 * il cron non gira una diretta vecchia resta 'live' nel database e, essendo
 * preferita a ogni altra qui sotto, nasconde per sempre quelle programmate.
 */
const LIVE_SENZA_FINE_SCADE_MS = 6 * 60 * 60 * 1000;

const isScaduta = (e: YoutubeLiveEvent): boolean => {
  const ora = Date.now();
  return e.ends_at
    ? new Date(e.ends_at).getTime() <= ora
    : new Date(e.starts_at).getTime() <= ora - LIVE_SENZA_FINE_SCADE_MS;
};

export const useYoutubeLiveEvents = () => {
  const [data, setData] = useState<YoutubeLiveEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const reqIdRef = useRef(0);

  const fetchLiveEvents = useCallback(async () => {
    const reqId = ++reqIdRef.current;

    setError(null);

    try {
      const now = nowIso();

      const { data: live, error: liveErr } = await supabase
        .from('youtube_live_events')
        .select('*')
        .eq('status', 'live')
        .order('starts_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (liveErr) throw liveErr;

      if (live && !isScaduta(live as YoutubeLiveEvent)) {
        if (reqId === reqIdRef.current) {
          setData(live as YoutubeLiveEvent);
        }
        return;
      }

      const { data: next, error: nextErr } = await supabase
        .from('youtube_live_events')
        .select('*')
        .eq('status', 'scheduled')
        .gte('starts_at', now)
        .order('starts_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (nextErr) throw nextErr;

      if (reqId === reqIdRef.current) {
        setData((next ?? null) as YoutubeLiveEvent | null);
      }
    } catch (e) {
      console.error(e);
      if (reqId === reqIdRef.current) {
        setError(e);
        setData(null);
      }
    } finally {
      if (reqId === reqIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  const refresh = useCallback(() => {
    setRefreshing(true);
    void fetchLiveEvents();
  }, [fetchLiveEvents]);

  useEffect(() => {
    setLoading(true);
    void fetchLiveEvents();
  }, [fetchLiveEvents]);

  return { data, loading, refreshing, error, refresh, fetchLiveEvents };
};
