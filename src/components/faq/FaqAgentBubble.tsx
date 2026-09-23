import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { AudioLines } from 'lucide-react-native';
import { GraphitFonts, withAlpha } from '@/src/theme';
import { useTheme } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@mr-types/theme.types';
import { FaqAgentAudio, FaqAgentImage } from '@mr-types/faqAgent.types';

/** Durata in m:ss, per i vocali. */
export const formatVoiceDuration = (millis: number): string => {
  const seconds = Math.round(millis / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

type Props = {
  images: FaqAgentImage[];
  audios: FaqAgentAudio[];
};

/** Miniature delle foto e chip dei vocali, dentro la bolla «Tu». */
export default function FaqAgentAttachments({ images, audios }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      {images.length > 0 && (
        <View style={styles.thumbs}>
          {images.map((image, index) => (
            <Image
              key={`${image.uri}-${index}`}
              source={{ uri: image.uri }}
              style={styles.thumb}
              contentFit="cover"
              accessibilityLabel="Foto allegata"
            />
          ))}
        </View>
      )}
      {audios.map((audio, index) => (
        <View
          key={index}
          style={styles.voiceChip}
          accessible
          accessibilityLabel={`Messaggio vocale di ${Math.round(audio.durationMillis / 1000)} secondi`}
        >
          <AudioLines color={theme.onPrimary} size={14} />
          <Text style={styles.voiceChipText}>
            Vocale · {formatVoiceDuration(audio.durationMillis)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      gap: 6,
    },
    thumbs: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    thumb: {
      width: 72,
      height: 72,
      borderRadius: 10,
      backgroundColor: withAlpha(theme.onPrimary, 0.2),
    },
    voiceChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 60,
      backgroundColor: withAlpha(theme.onPrimary, 0.22),
    },
    voiceChipText: {
      color: theme.onPrimary,
      fontFamily: GraphitFonts.GraphitMedium,
      fontSize: 13,
    },
  });
