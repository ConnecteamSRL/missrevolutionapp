import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const DOT_STAGGER_MS = 160;
const RISE_MS = 320;
const PAUSE_MS = 360;

function Dot({ index, color }: { index: number; color: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    // Onda: ogni puntino sale e scende sfasato rispetto al precedente, poi una
    // breve pausa prima del giro successivo.
    progress.value = withDelay(
      index * DOT_STAGGER_MS,
      withRepeat(
        withSequence(
          withTiming(1, { duration: RISE_MS, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: RISE_MS, easing: Easing.in(Easing.quad) }),
          withDelay(PAUSE_MS, withTiming(0, { duration: 0 })),
        ),
        -1,
      ),
    );
    return () => cancelAnimation(progress);
  }, [index, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.35 + progress.value * 0.65,
    transform: [{ translateY: -5 * progress.value }, { scale: 0.85 + progress.value * 0.2 }],
  }));

  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

type Props = {
  color: string;
};

/** Tre puntini a onda: si mette dentro la bolla dell'assistente mentre risponde. */
export default function FaqAgentTypingIndicator({ color }: Props) {
  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(120)}
      style={styles.row}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="L’assistente sta scrivendo"
    >
      {[0, 1, 2].map((index) => (
        <Dot key={index} index={index} color={color} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 20,
    paddingHorizontal: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
