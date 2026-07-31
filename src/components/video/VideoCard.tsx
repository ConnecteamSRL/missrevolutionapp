import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { VideoItem } from '@mr-types/video.types';
import Badge from '@components/ui/Badge';
import { GraphitFonts, withAlpha } from '@/src/theme';
import { useTheme } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@mr-types/theme.types';
import ClockIcon from '@components/ui/icons/ClockIcon';
import { Check } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

type Props = {
  video: VideoItem;
  categoryName: string;
  /**
   * Sorgente della copertina gia' risolta: thumbnail_url puo' essere un
   * percorso su content-images, che e' privato e va firmato. La firma si fa
   * una volta per tutta la lista (useSignedContentImages), non per riquadro.
   */
  thumbnailUri: string | null;
  onPress?: (video: VideoItem) => void;
};

const formatDuration = (seconds: number | null) => {
  if (seconds == null || Number.isNaN(seconds)) return null;
  const total = Math.max(0, Math.floor(seconds));
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  const mmStr = String(mm).padStart(2, '0');
  const ssStr = String(ss).padStart(2, '0');
  return `${mmStr}:${ssStr}`;
};

export default function VideoCard({ video, categoryName, thumbnailUri, onPress }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const formattedDuration = formatDuration(video.duration_seconds ?? null);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, {
      damping: 12,
      stiffness: 200,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 200,
    });
  };

  return (
    <Animated.View style={[animatedStyle]}>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress?.(video)}
      >
        <View style={styles.thumbnailWrapper}>
          {thumbnailUri ? (
            <Image source={{ uri: thumbnailUri }} style={styles.thumbnail} resizeMode="cover" />
          ) : (
            <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
              <Text style={styles.thumbnailPlaceholderText}>Nessuna anteprima</Text>
            </View>
          )}

          {formattedDuration && (
            <View style={styles.durationBadgeLeft}>
              <ClockIcon color="#fff" size={14} />
              <Text style={styles.durationText}>{formattedDuration}</Text>
            </View>
          )}

          <View style={styles.playOverlay}>
            <View style={styles.playCircle}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
          </View>

          {video.completed_at && (
            <View style={styles.completedBadge}>
              <Check size={14} color="#fff" strokeWidth={3} />
            </View>
          )}

          {!video.completed_at &&
            video.playback_position != null &&
            video.playback_position > 0 &&
            video.duration_seconds != null &&
            video.duration_seconds > 0 && (
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(100, Math.round((video.playback_position / video.duration_seconds) * 100))}%`,
                    },
                  ]}
                />
              </View>
            )}
        </View>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {video.title}
          </Text>
          <View style={styles.badgeWrapper}>
            <Badge label={categoryName} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      borderRadius: 20,
      padding: 12,
      marginBottom: 16,
      backgroundColor: theme.primary,
    },
    thumbnailWrapper: {
      borderRadius: 16,
      overflow: 'hidden',
      position: 'relative',
      marginBottom: 8,
    },
    thumbnail: {
      width: '100%',
      height: 180,
    },
    thumbnailPlaceholder: {
      backgroundColor: 'rgba(255,255,255,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    thumbnailPlaceholderText: {
      fontSize: 12,
      color: '#555',
    },
    playOverlay: {
      position: 'absolute',
      inset: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    playCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: withAlpha(theme.secondary, 0.4),
      justifyContent: 'center',
      alignItems: 'center',
    },
    playIcon: {
      fontSize: 22,
      color: '#fff',
      marginLeft: 2,
    },
    durationBadgeLeft: {
      position: 'absolute',
      top: 8,
      left: 8,
      backgroundColor: 'rgba(0,0,0,0.2)',
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 6,
    },
    durationText: {
      fontSize: 14,
      color: '#FFFFFF',
      fontFamily: GraphitFonts.GraphitRegular,
    },
    completedBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: '#4CAF50',
      justifyContent: 'center',
      alignItems: 'center',
    },
    progressBarTrack: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 4,
      backgroundColor: 'rgba(255,255,255,0.3)',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: theme.secondary,
      borderRadius: 2,
    },
    content: {
      flexDirection: 'column',
    },
    title: {
      fontSize: 18,
      fontFamily: GraphitFonts.GraphitRegular,
      color: theme.onPrimary,
      marginBottom: 10,
    },
    badgeWrapper: {
      alignSelf: 'flex-start',
    },
  });
