import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GraphitFonts } from '@/src/theme';

export type NutritionTabKey = 'plan' | 'recipes';

type Props = {
  tab: NutritionTabKey;
  setTab: React.Dispatch<React.SetStateAction<NutritionTabKey>>;
};

export default function NutritionSwitcher({ tab, setTab }: Props) {
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

const styles = StyleSheet.create({
  switcherWrap: { paddingTop: 8, paddingBottom: 16 },
  switcher: {
    flexDirection: 'row',
    backgroundColor: '#FFD7E8',
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
    backgroundColor: '#FFE7F1',
    borderWidth: 1,
    borderColor: '#FFD1E4',
    borderRadius: 12,
  },
  switchText: { fontSize: 13, color: '#1F1F1F', fontFamily: GraphitFonts.GraphitRegular },
  switchTextActive: { color: '#1F1F1F', fontFamily: GraphitFonts.GraphitBold },
});
