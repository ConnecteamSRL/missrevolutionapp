import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Check, CircleCheck, Clock, Video } from 'lucide-react-native';

import ContentScreenLayout from '@components/layouts/ContentScreenLayout';
import BackgroundGradientComponent from '@components/core/BackgroundGradientComponent';
import Badge from '@components/ui/Badge';

import { colors, GraphitFonts } from '@/src/theme';
import { supabase } from '@/src/lib/supabase';
import { useVideoProgress } from '@/src/hooks/content/useVideoProgress';
import { useAuthStore } from '@/src/store/authStore';

type VideoDetail = {
  id: string;
  title: string;
  description: string | null;
  source_video_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  vimeo_id: string;
  free: boolean;
  is_active: boolean;
  published_at: string | null;
  position: number;
  category_name: string | null;
  playback_position: number | null;
  completed_at: string | null;
};

const formatDuration = (seconds: number | null) => {
  if (seconds == null || Number.isNaN(seconds)) return null;
  const total = Math.max(0, Math.floor(seconds));
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
};

const UI_GENERIC_ERROR = 'Si è verificato un errore. Riprova.';

export default function VideoDetailScreen() {
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  const { user } = useAuthStore();
  const { saveProgress, saveProgressImmediate, markCompleted } = useVideoProgress();

  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveTime, setLiveTime] = useState(0);
  const completedRef = useRef(false);
  const currentTimeRef = useRef(0);

  const fetchVideo = useCallback(async () => {
    if (!videoId) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('videos')
        .select('*, video_categories!videos_category_id_fkey(name)')
        .eq('id', videoId)
        .single();

      if (fetchError) throw fetchError;

      let playbackPosition: number | null = null;
      let completedAt: string | null = null;

      if (user?.id) {
        const { data: progress } = await supabase
          .from('user_video_progress')
          .select('playback_position, completed_at')
          .eq('video_id', videoId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (progress) {
          playbackPosition = progress.playback_position;
          completedAt = progress.completed_at;
        }
      }

      const categoryName =
        data.video_categories && typeof data.video_categories === 'object'
          ? (data.video_categories as { name: string }).name
          : null;

      setVideo({
        id: data.id,
        title: data.title,
        description: data.description,
        source_video_url: data.source_video_url,
        thumbnail_url: data.thumbnail_url,
        duration_seconds: data.duration_seconds,
        vimeo_id: data.vimeo_id,
        free: data.free,
        is_active: data.is_active,
        published_at: data.published_at,
        position: data.position,
        category_name: categoryName,
        playback_position: playbackPosition,
        completed_at: completedAt,
      });

      completedRef.current = !!completedAt;
    } catch (err) {
      console.error('Failed to fetch video:', err);
      setError(UI_GENERIC_ERROR);
    } finally {
      setLoading(false);
    }
  }, [videoId, user?.id]);

  useEffect(() => {
    fetchVideo();
  }, [fetchVideo]);

  const videoSource = video?.source_video_url || null;

  const player = useVideoPlayer(videoSource, (p) => {
    if (video?.playback_position && video.playback_position > 0) {
      p.currentTime = video.playback_position;
    }
  });

  useEffect(() => {
    if (!player || !video?.id) return;

    const sub = player.addListener('playingChange', (payload) => {
      currentTimeRef.current = player.currentTime;
      setLiveTime(player.currentTime);
      if (!payload.isPlaying && player.currentTime > 0) {
        saveProgress(video.id, player.currentTime);
      }
    });
    return () => sub.remove();
  }, [player, video?.id, saveProgress]);

  // Aggiorna la UI periodicamente durante la riproduzione
  useEffect(() => {
    if (!player) return;
    const interval = setInterval(() => {
      try {
        if (player.playing) {
          currentTimeRef.current = player.currentTime;
          setLiveTime(player.currentTime);
        }
      } catch {
        // player potrebbe essere già rilasciato
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [player]);

  useEffect(() => {
    if (!player || !video?.id) return;

    const sub = player.addListener('playToEnd', () => {
      if (!completedRef.current) {
        completedRef.current = true;
        markCompleted(video.id);
        setVideo((prev) => (prev ? { ...prev, completed_at: new Date().toISOString() } : prev));
      }
    });
    return () => sub.remove();
  }, [player, video?.id, markCompleted]);

  useEffect(() => {
    return () => {
      if (video?.id && currentTimeRef.current > 0) {
        saveProgressImmediate(video.id, currentTimeRef.current);
      }
    };
  }, [video?.id, saveProgressImmediate]);

  const progressPercent = useMemo(() => {
    if (!video?.duration_seconds) return 0;
    const position = liveTime > 0 ? liveTime : (video.playback_position ?? 0);
    if (position <= 0) return 0;
    return Math.min(100, Math.round((position / video.duration_seconds) * 100));
  }, [liveTime, video?.playback_position, video?.duration_seconds]);

  const screenTitle = video?.title ?? 'Video';

  if (!videoId) {
    return (
      <View style={styles.root}>
        <BackgroundGradientComponent />
        <ContentScreenLayout title="Video">
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>Video non trovato</Text>
            <Text style={styles.emptySubtitle}>
              Manca un identificativo valido per aprire il dettaglio.
            </Text>
          </View>
        </ContentScreenLayout>
      </View>
    );
  }

  if (loading) {
    return (
      <ContentScreenLayout title="Video">
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#C388F0" />
        </View>
      </ContentScreenLayout>
    );
  }

  return (
    <View style={styles.root}>
      <BackgroundGradientComponent />

      <ContentScreenLayout title={screenTitle}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {!!error && (
            <View style={styles.statusBannerError}>
              <View style={styles.bannerHeader}>
                <View style={styles.bannerDot} />
                <Text style={styles.statusTextError}>{error}</Text>
              </View>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchVideo}
                activeOpacity={0.85}
              >
                <Text style={styles.retryButtonText}>Riprova</Text>
              </TouchableOpacity>
            </View>
          )}

          {video && !error && (
            <>
              {video.source_video_url ? (
                <View style={styles.playerContainer}>
                  <VideoView
                    player={player}
                    style={styles.player}
                    nativeControls={true}
                    contentFit="contain"
                    allowsFullscreen={true}
                  />
                </View>
              ) : (
                <View style={styles.emptyVideoContainer}>
                  <Video size={48} color={colors.primary} />
                  <Text style={styles.emptyVideoTitle}>Video in arrivo</Text>
                  <Text style={styles.emptyVideoText}>
                    Stiamo caricando il video, riprova più tardi
                  </Text>
                </View>
              )}

              <View style={styles.infoSection}>
                <Text style={styles.videoTitle}>{video.title}</Text>

                {video.description && (
                  <Text style={styles.videoDescription}>{video.description}</Text>
                )}

                <View style={styles.metaRow}>
                  {video.category_name && <Badge label={video.category_name} />}

                  {video.duration_seconds != null && (
                    <View style={styles.durationTag}>
                      <Clock size={14} color="#666" />
                      <Text style={styles.durationText}>
                        {formatDuration(video.duration_seconds)}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.completionRow}>
                  {video.completed_at ? (
                    <View style={styles.completedBadge}>
                      <CircleCheck size={18} color="#4CAF50" />
                      <Text style={styles.completedText}>Completato</Text>
                    </View>
                  ) : progressPercent > 0 ? (
                    <View style={styles.progressBadge}>
                      <Check size={16} color={colors.secondary} />
                      <Text style={styles.progressText}>In corso</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </ContentScreenLayout>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  scrollContent: { paddingBottom: 40 },

  playerContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 20,
  },
  player: {
    width: '100%',
    height: '100%',
  },

  emptyVideoContainer: {
    backgroundColor: '#FCF0FB',
    borderRadius: 16,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  emptyVideoTitle: {
    fontSize: 18,
    fontFamily: GraphitFonts.GraphitBold,
    color: colors.text,
  },
  emptyVideoText: {
    fontSize: 14,
    fontFamily: GraphitFonts.GraphitRegular,
    color: '#666',
    textAlign: 'center',
  },

  infoSection: {
    gap: 12,
  },
  videoTitle: {
    fontSize: 22,
    fontFamily: GraphitFonts.GraphitBold,
    color: colors.text,
  },
  videoDescription: {
    fontSize: 15,
    fontFamily: GraphitFonts.GraphitRegular,
    color: '#545454',
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  durationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 14,
    fontFamily: GraphitFonts.GraphitRegular,
    color: '#666',
  },
  completionRow: {
    marginTop: 4,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completedText: {
    fontSize: 15,
    fontFamily: GraphitFonts.GraphitRegular,
    color: '#4CAF50',
  },
  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressText: {
    fontSize: 15,
    fontFamily: GraphitFonts.GraphitRegular,
    color: colors.secondary,
  },

  statusBannerError: {
    backgroundColor: '#FFE7F1',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ED5192',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  bannerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bannerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ED5192' },
  statusTextError: {
    flex: 1,
    fontFamily: GraphitFonts.GraphitRegular,
    color: '#D00000',
    fontSize: 14,
    lineHeight: 18,
  },
  retryButton: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD1E4',
  },
  retryButtonText: { color: '#ED5192', fontSize: 14, fontFamily: GraphitFonts.GraphitBold },

  emptyTitle: {
    fontSize: 16,
    color: colors.text,
    fontFamily: GraphitFonts.GraphitBold,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#545454',
    fontFamily: GraphitFonts.GraphitRegular,
    textAlign: 'center',
    lineHeight: 18,
  },
});
