import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GraphitFonts } from '@/src/theme';
import { useTheme } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@mr-types/theme.types';

export type NutritionTabKey = 'plan' | 'recipes';

type Props = {
  tab: NutritionTabKey;
  setTab: React.Dispatch<React.SetStateAction<NutritionTabKey>>;
};

export default function NutritionSwitcher({ tab, setTab }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const isPlan = tab === 'plan';
  const isRecipes = tab === 'recipes';

  return (
    <View style={styles.switcherWrap}>
      <View style={styles.switcher}>
        <Pressable
          onPress={() => setTab('plan')}
          style={[styles.switchBtn, isPlan && styles.switchBtnActive]}
        >
          <Text style={[styles.switchText, isPlan && styles.switchTextActive]}>Il tuo piano</Text>
        </Pressable>

        <Pressable
          onPress={() => setTab('recipes')}
          style={[styles.switchBtn, isRecipes && styles.switchBtnActive]}
        >
          <Text style={[styles.switchText, isRecipes && styles.switchTextActive]}>Ricette</Text>
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
    switcherWrap: { paddingTop: 8, paddingBottom: 16 },
    switcher: {
      flexDirection: 'row',
      backgroundColor: theme.border,
      borderRadius: 16,
      padding: 4,
      gap: 6,
    },
    switchBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    switchBtnActive: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
    },
    switchText: { fontSize: 13, color: '#1F1F1F', fontFamily: GraphitFonts.GraphitRegular },
    switchTextActive: { color: '#1F1F1F', fontFamily: GraphitFonts.GraphitBold },
  });
