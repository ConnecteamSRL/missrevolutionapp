import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { withAlpha } from '@/src/theme';
import { useTheme } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@mr-types/theme.types';
import { FaqAgentImage } from '@mr-types/faqAgent.types';

type Props = {
  images: FaqAgentImage[];
};

/** Miniature delle foto, dentro la bolla «Tu». */
export default function FaqAgentAttachments({ images }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
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
  );
}

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
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
  });
