import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { VideoItem } from '@mr-types/video.types';
import Badge from '@components/ui/Badge';
import { GraphitFonts } from '@/src/theme';
import ClockIcon from '@components/ui/icons/ClockIcon';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

type Props = {
  video: VideoItem;
  categoryName: string;
  onPress?: (video: VideoItem) => void;
};

const CARD_COLORS = ['#CCAEE3', '#FE61A2', '#A9D982', '#FFD48F', '#9ED8F7', '#F3B3E6'];
const CATEGORY_COLOR_MAP: Record<string, string> = {};

const getCategoryColor = (categoryName: string) => {
  if (!CATEGORY_COLOR_MAP[categoryName]) {
    const nextIndex = Object.keys(CATEGORY_COLOR_MAP).length % CARD_COLORS.length;
    CATEGORY_COLOR_MAP[categoryName] = CARD_COLORS[nextIndex];
  }
  return CATEGORY_COLOR_MAP[categoryName];
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

export default function VideoCard({ video, categoryName, onPress }: Props) {
  const backgroundColor = getCategoryColor(categoryName);
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
        style={[styles.card, { backgroundColor }]}
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress?.(video)}
      >
        <View style={styles.thumbnailWrapper}>
          {video.thumbnail_url ? (
            <Image
              source={{ uri: video.thumbnail_url }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
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

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 12,
    marginBottom: 16,
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
    backgroundColor: 'rgba(237, 81, 146, 0.4)',
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
  content: {
    flexDirection: 'column',
  },
  title: {
    fontSize: 18,
    fontFamily: GraphitFonts.GraphitRegular,
    color: '#fff',
    marginBottom: 10,
  },
  badgeWrapper: {
    alignSelf: 'flex-start',
  },
});
