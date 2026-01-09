import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors, GraphitFonts } from '@/src/theme';

type Props = {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
};

const onlyDigits = (v: string) => v.replace(/[^0-9]/g, '');

export default function OtpBoxesInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = true,
}: Props) {
  const refs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const digits = useMemo(() => {
    const v = onlyDigits(value).slice(0, length);
    return Array.from({ length }, (_, i) => v[i] ?? '');
  }, [value, length]);

  useEffect(() => {
    if (!autoFocus || disabled) return;
    const t = setTimeout(() => refs.current[0]?.focus?.(), 50);
    return () => clearTimeout(t);
  }, [autoFocus, disabled]);

  const setDigits = (next: string[]) => {
    onChange(onlyDigits(next.join('')).slice(0, length));
  };

  const focusIndex = (i: number) => {
    const idx = Math.max(0, Math.min(length - 1, i));
    refs.current[idx]?.focus?.();
  };

  const onChangeAt = (index: number, text: string) => {
    const cleaned = onlyDigits(text);
    if (!cleaned) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    if (cleaned.length === 1) {
      const next = [...digits];
      next[index] = cleaned;
      setDigits(next);
      if (index < length - 1) focusIndex(index + 1);
      return;
    }

    const next = [...digits];
    let writeAt = index;
    for (const ch of cleaned) {
      if (writeAt >= length) break;
      next[writeAt] = ch;
      writeAt += 1;
    }
    setDigits(next);
    focusIndex(Math.min(writeAt, length - 1));
  };

  const onKeyPressAt = (index: number, key: string) => {
    if (key !== 'Backspace') return;

    if (digits[index]) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    if (index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
      focusIndex(index - 1);
    }
  };

  return (
    <View style={styles.row}>
      {digits.map((d, i) => {
        const isFocused = focusedIndex === i;
        return (
          <TextInput
            key={i}
            // @ts-ignore
            ref={(r) => (refs.current[i] = r)}
            value={d}
            onChangeText={(t) => onChangeAt(i, t)}
            onFocus={() => setFocusedIndex(i)}
            onBlur={() => setFocusedIndex((cur) => (cur === i ? null : cur))}
            onKeyPress={(e) => onKeyPressAt(i, e.nativeEvent.key)}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoCorrect={false}
            autoCapitalize="none"
            editable={!disabled}
            maxLength={i === 0 ? length : 1}
            style={[styles.cell, isFocused && styles.cellFocused, disabled && styles.cellDisabled]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  cell: {
    height: 50,
    width: 44,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 10,
    backgroundColor: colors.white,
    textAlign: 'center',
    fontSize: 18,
    color: colors.text,
    fontFamily: GraphitFonts.GraphitRegular,
  },
  cellFocused: {
    borderColor: colors.secondary,
  },
  cellDisabled: { opacity: 0.6 },
});
