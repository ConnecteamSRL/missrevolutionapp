import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GraphitFonts } from '@/src/theme';

type Props = {
  message: string;
};

export default function PhaseInfoBanner({ message }: Props) {
  return (
    <View style={styles.banner}>
      <View style={styles.dot} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF6DE',
    borderWidth: 1,
    borderColor: '#F2D894',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D9A514',
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#7A5C00',
    fontFamily: GraphitFonts.GraphitRegular,
  },
});
