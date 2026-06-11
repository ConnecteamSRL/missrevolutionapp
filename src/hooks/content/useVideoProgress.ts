import { useCallback, useRef } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/store/authStore';

const THROTTLE_MS = 10_000;

export function useVideoProgress() {
  const { user } = useAuthStore();
  const lastSaveRef = useRef(0);

  const saveProgress = useCallback(
    async (videoId: string, positionSeconds: number) => {
      if (!user?.id) return;

      const now = Date.now();
      if (now - lastSaveRef.current < THROTTLE_MS) return;
      lastSaveRef.current = now;

      const { error } = await supabase
        .from('user_video_progress')
        .upsert(
          {
            user_id: user.id,
            video_id: videoId,
            playback_position: Math.floor(positionSeconds),
          },
          { onConflict: 'user_id,video_id' },
        )
        .select()
        .single();

      if (error) {
        console.error('Failed to save video progress:', error.message);
      }
    },
    [user?.id],
  );

  const saveProgressImmediate = useCallback(
    async (videoId: string, positionSeconds: number) => {
      if (!user?.id) return;
      lastSaveRef.current = Date.now();

      const { error } = await supabase
        .from('user_video_progress')
        .upsert(
          {
            user_id: user.id,
            video_id: videoId,
            playback_position: Math.floor(positionSeconds),
          },
          { onConflict: 'user_id,video_id' },
        )
        .select()
        .single();

      if (error) {
        console.error('Failed to save video progress:', error.message);
      }
    },
    [user?.id],
  );

  const markCompleted = useCallback(
    async (videoId: string) => {
      if (!user?.id) return;

      const { error } = await supabase
        .from('user_video_progress')
        .upsert(
          {
            user_id: user.id,
            video_id: videoId,
            completed_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,video_id' },
        )
        .select()
        .single();

      if (error) {
        console.error('Failed to mark video completed:', error.message);
      }
    },
    [user?.id],
  );

  return { saveProgress, saveProgressImmediate, markCompleted };
}
