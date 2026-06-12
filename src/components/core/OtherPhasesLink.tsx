import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { GraphitFonts } from '@/src/theme';
import ArrowCircleRight from '@components/ui/icons/ArrowCircleRightIcon';

type Props = {
  label: string;
  count?: number;
  onPress: () => void;
};

export default function OtherPhasesLink({ label, count, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
      style={styles.container}
    >
      <Text style={styles.label} numberOfLines={1}>
        {label}
        {count !== undefined ? ` (${count})` : ''}
      </Text>
      <ArrowCircleRight color={'#D9AFC0'} size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    marginBottom: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D9AFC0',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  label: {
    flex: 1,
    fontSize: 14,
    color: '#ED5192',
    fontFamily: GraphitFonts.GraphitBold,
  },
});
