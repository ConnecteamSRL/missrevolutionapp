import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import type { Tables } from '@mr-types/database.types';

export type YoutubeLiveEvent = Tables<'youtube_live_events'>;

const nowIso = () => new Date().toISOString();

export const useYoutubeLiveEvents = (gymId: string | null | undefined) => {
  const [data, setData] = useState<YoutubeLiveEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const reqIdRef = useRef(0);

  const fetchLiveEvents = useCallback(async () => {
    const reqId = ++reqIdRef.current;

    if (!gymId) {
      setData(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setError(null);

    try {
      const now = nowIso();

      const { data: live, error: liveErr } = await supabase
        .from('youtube_live_events')
        .select('*')
        .eq('gym_id', gymId)
        .eq('status', 'live')
        .order('starts_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (liveErr) throw liveErr;

      if (live) {
        if (reqId === reqIdRef.current) {
          setData(live as YoutubeLiveEvent);
        }
        return;
      }

      const { data: next, error: nextErr } = await supabase
        .from('youtube_live_events')
        .select('*')
        .eq('gym_id', gymId)
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
  }, [gymId]);

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
