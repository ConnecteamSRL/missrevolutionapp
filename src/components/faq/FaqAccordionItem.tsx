import React, { useEffect } from 'react';
import { Alert, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GraphitFonts } from '@/src/theme';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import ArrowDown from '@components/ui/icons/ArrowDownIcon';

if (Platform.OS === 'android' && (global as any).UIManager?.setLayoutAnimationEnabledExperimental) {
  (global as any).UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  categoryName: string;
  question: string;
  answer: string;
  expanded: boolean;
  onToggle: () => void;
  videoLink?: string | null;
};

export default function FaqAccordionItem({
  categoryName,
  question,
  answer,
  expanded,
  onToggle,
  videoLink,
}: Props) {
  const arrowRotation = useSharedValue(expanded ? 180 : 0);

  useEffect(() => {
    arrowRotation.value = withTiming(expanded ? 180 : 0, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
    });
  }, [expanded, arrowRotation]);

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${arrowRotation.value}deg` }],
  }));

  const handleOpenVideo = () => {
    if (!videoLink) return;

    Alert.alert(
      'Apri video',
      'Verrai reindirizzato a un browser esterno per visualizzare il video.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Continua',
          onPress: () => Linking.openURL(videoLink),
        },
      ],
    );
  };

  return (
    <View style={[styles.container, expanded && styles.containerActive]}>
      <TouchableOpacity activeOpacity={0.8} onPress={onToggle} style={styles.header}>
        <View style={styles.headerTextWrapper}>
          <View style={[styles.categoryBadge, expanded && styles.categoryBadgeActive]}>
            <Text style={[styles.categoryText, expanded && styles.categoryTextActive]}>
              {categoryName}
            </Text>
          </View>

          <View style={styles.questionRow}>
            <Text style={[styles.question, expanded && styles.questionActive]}>{question}</Text>
            <Animated.View style={[styles.arrowWrapper, arrowStyle]}>
              <ArrowDown color={expanded ? '#FE61A2' : '#363636'} size={18} />
            </Animated.View>
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <Animated.View
          entering={FadeIn.duration(160)}
          exiting={FadeOut.duration(100)}
          style={styles.body}
        >
          <Text style={styles.answer}>{answer}</Text>

          {videoLink ? (
            <TouchableOpacity onPress={handleOpenVideo} style={styles.videoLinkWrapper}>
              <Text style={styles.videoLinkText}>Video</Text>
            </TouchableOpacity>
          ) : null}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    backgroundColor: '#FFE7F1',
    borderColor: '#FFD1E4',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  containerActive: {
    backgroundColor: '#FFD7E8',
    borderColor: '#FFD1E4',
    shadowColor: '#ED5192',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerTextWrapper: {
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FFD1E4',
    backgroundColor: '#FFD7E8',
    marginBottom: 6,
  },
  categoryBadgeActive: {
    backgroundColor: '#FFE7F1',
    borderColor: '#FFD1E4',
  },
  categoryText: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 12,
    color: '#363636',
  },
  categoryTextActive: {
    color: '#363636',
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  question: {
    flex: 1,
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 14,
    color: '#FE61A2',
  },
  questionActive: {
    color: '#ED5192',
  },
  arrowWrapper: {
    marginLeft: 8,
  },
  body: {
    marginTop: 12,
    overflow: 'hidden',
  },
  answer: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 12,
    lineHeight: 18,
    color: '#363636',
  },
  videoLinkWrapper: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  videoLinkText: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 14,
    color: '#FE61A2',
    textDecorationLine: 'underline',
  },
});
