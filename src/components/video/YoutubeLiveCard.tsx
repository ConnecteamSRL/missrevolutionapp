import React, { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View, Image } from 'react-native';
import { GraphitFonts } from '@/src/theme';
import type { YoutubeLiveEvent } from '@/src/hooks/content/useYoutubeLive';

type Props = {
  event: YoutubeLiveEvent | null;
  onJoin?: (event: YoutubeLiveEvent) => void;
};

const formatDateTime = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('it-IT', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function YoutubeLiveCard({ event, onJoin }: Props) {
  const isLive = event?.status === 'live';
  const isScheduled = event?.status === 'scheduled';

  const coverUrl = event?.cover_url;

  const title = event?.title ?? 'Nessuna live disponibile';

  const subtitle = useMemo(() => {
    if (!event) return 'Quando verrà programmata una live, la vedrai qui.';
    if (event.description?.trim()) return event.description.trim();
    if (isLive) return 'La lezione è in diretta ora su YouTube';
    if (isScheduled) return `Inizio: ${formatDateTime(event.starts_at)}`;
    return 'Quando verrà programmata una live, la vedrai qui.';
  }, [event, isLive, isScheduled]);

  const ctaLabel = isLive ? 'Entra in diretta' : 'Non disponibile';

  const canJoin = !!event && isLive && !!event.youtube_url && typeof onJoin === 'function';

  const handleJoin = () => {
    if (!canJoin || !event) return;

    Alert.alert(
      'Aprire YouTube?',
      'Stai per aprire un link esterno.',
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Apri', style: 'default', onPress: () => onJoin!(event) },
      ],
      { cancelable: true },
    );
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={styles.heroFallback} />
        )}

        {isLive ? (
          <View style={[styles.badge, styles.badgeLive]}>
            <Text style={styles.badgeTextLive}>Live</Text>
          </View>
        ) : isScheduled ? (
          <View style={[styles.badge, styles.badgeScheduled]}>
            <Text style={styles.badgeTextScheduled}>Pianificata</Text>
          </View>
        ) : null}

        <View style={styles.contentRow}>
          <View style={styles.textCol}>
            <Text style={styles.title}>{title}</Text>

            <Text style={styles.subtitle}>{subtitle}</Text>

            {isScheduled ? (
              <Text style={styles.meta}>Inizio: {formatDateTime(event?.starts_at)}</Text>
            ) : null}
          </View>

          <Pressable
            onPress={handleJoin}
            disabled={!canJoin}
            android_ripple={canJoin ? { color: 'rgba(0,0,0,0.06)' } : undefined}
            style={({ pressed }) => [
              styles.cta,
              !canJoin ? styles.ctaDisabled : null,
              canJoin && pressed ? { opacity: 0.98 } : null,
            ]}
          >
            <View style={styles.ctaDot} />
            <Text style={styles.ctaText}>{ctaLabel}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 6,
    paddingBottom: 10,
  },
  card: {
    borderRadius: 24,
    backgroundColor: '#C9B3E6',
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#EADDF7',
  },
  heroFallback: {
    width: '100%',
    height: 120,
    backgroundColor: '#EADDF7',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    zIndex: 10,
  },
  badgeLive: { backgroundColor: '#FF3B30' },
  badgeScheduled: { backgroundColor: '#FFFFFF' },

  badgeTextLive: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: GraphitFonts.GraphitBold,
  },
  badgeTextScheduled: {
    fontSize: 12,
    color: '#111111',
    fontFamily: GraphitFonts.GraphitBold,
  },

  contentRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    marginRight: 4,
  },

  title: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: GraphitFonts.GraphitRegular,
    lineHeight: 26,
    marginBottom: 4,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: 'rgba(255,255,255,0.90)',
    fontFamily: GraphitFonts.GraphitRegular,
    lineHeight: 18,
  },
  meta: {
    marginTop: 8,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: GraphitFonts.GraphitBold,
  },

  cta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minWidth: 100,
    marginBottom: 2,
  },
  ctaDisabled: { opacity: 0.55 },
  ctaDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: '#ED5192',
  },
  ctaText: {
    fontSize: 14,
    color: '#111111',
    fontFamily: GraphitFonts.GraphitBold,
    textAlign: 'center',
  },
});
