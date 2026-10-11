import React from 'react';
import { Platform, StyleSheet, Text, TextStyle, View } from 'react-native';
import { Tabs } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackgroundGradientComponent from '@components/core/BackgroundGradientComponent';
import HeaderTabComponent from '@components/tab/HeaderTabComponent';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useAreaAperta } from '@/src/hooks/core/useAreaAperta';
import { useRileggiAccesso } from '@/src/hooks/core/useRileggiAccesso';
import { layoutSchedaConArea } from '@components/core/GateArea';
import LucchettoBadge from '@components/core/LucchettoBadge';

import HomeIcon from '@components/ui/icons/HomeIcon';
import NutritionIcon from '@components/ui/icons/NutritionIcon';
import WorkoutIcon from '@components/ui/icons/WorkoutIcon';
import ProgressIcon from '@components/ui/icons/ProgressIcon';

type SvgIconComponent = React.FC<{ color: string; size: number }>;

const BASE_HEIGHT = 80;
const ICON_SIZE = 24;
const BASE_FONT_SIZE = 12;
const ICON_TEXT_GAP = 8;

const LABELS: Record<string, string> = {
  '(home)': 'Home',
  nutrition: 'Nutrizione',
  workout: 'Workout',
  progress: 'Progressi',
};

const ICONS: Record<string, SvgIconComponent> = {
  '(home)': HomeIcon,
  nutrition: NutritionIcon,
  workout: WorkoutIcon,
  progress: ProgressIcon,
};

const FONT_ACTIVE: string | undefined = Platform.select({
  ios: 'Poppins-SemiBold',
  android: 'Poppins_600SemiBold',
});

const FONT_INACTIVE: string | undefined = Platform.select({
  ios: 'Poppins-Regular',
  android: 'Poppins_400Regular',
});

function IconWithIndicator({
  IconComponent,
  color,
  bloccata,
}: {
  IconComponent: SvgIconComponent;
  color: string;
  bloccata: boolean;
}) {
  // Il lucchetto e' ancorato all'icona, non all'angolo della tab: non cambia
  // l'altezza della barra e non tocca l'etichetta, anche con il testo grande.
  return (
    <View>
      <IconComponent color={color} size={ICON_SIZE} />
      {bloccata && <LucchettoBadge lato={16} style={styles.lucchetto} />}
    </View>
  );
}

export default function TabsLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const bottomInset = Platform.OS === 'android' ? Math.max(insets.bottom, 10) : insets.bottom;

  const barHeight = BASE_HEIGHT + bottomInset;

  // Accesso limitato: le tab chiuse restano toccabili e mostrano il lucchetto.
  const aperte: Record<string, boolean> = {
    '(home)': true,
    nutrition: useAreaAperta('nutrizione'),
    workout: useAreaAperta('allenamento'),
    progress: useAreaAperta('progressi'),
  };
  // Tornando alla Home dalla chat, dove si e' magari rinnovato con la palestra,
  // lucchetti dei riquadri, delle tab e della campanella si aggiornano subito.
  const notificheAperte = useAreaAperta('notifiche');
  useRileggiAccesso(!notificheAperte || Object.values(aperte).includes(false));

  return (
    <View style={styles.root}>
      <BackgroundGradientComponent />

      <View style={{ paddingTop: insets.top + 8 }}>
        <HeaderTabComponent />
      </View>

      <Tabs
        backBehavior="order"
        screenLayout={layoutSchedaConArea}
        screenOptions={({ route }) => ({
          headerShown: false,
          // Con tabBarLabel funzione serve un titolo testuale: senza, VoiceOver e il
          // visore a contenuto grande di iOS leggevano il nome tecnico («nutrition»).
          title: LABELS[route.name],
          // Sempre una stringa: tornando a undefined dopo un rinnovo Android
          // conservava l'etichetta «richiede un abbonamento attivo».
          tabBarAccessibilityLabel:
            aperte[route.name] === false
              ? `${LABELS[route.name]}, richiede un abbonamento attivo`
              : LABELS[route.name],
          sceneStyle: {
            backgroundColor: 'transparent',
          },
          safeAreaInsets: { bottom: bottomInset },
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: theme.surface,
          tabBarBackground: () => (
            <LinearGradient
              colors={theme.tabGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1 }}
            />
          ),
          tabBarStyle: {
            height: barHeight,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            overflow: 'hidden',
            paddingTop: 12,
            paddingBottom: bottomInset,
            backgroundColor: 'transparent',
          },
          tabBarLabelStyle: {
            fontSize: BASE_FONT_SIZE,
          } as TextStyle,
          tabBarIcon: ({ color }) => {
            const IconComponent = ICONS[route.name];
            return (
              <IconWithIndicator
                IconComponent={IconComponent}
                color={color}
                bloccata={aperte[route.name] === false}
              />
            );
          },
          // Quattro etichette in una barra di altezza fissa: con il testo ingrandito
          // andavano a capo a meta' parola («Nutrizio-ne») e venivano tagliate. Restano
          // su una riga, crescono al massimo del 30% e si riducono per entrare, come
          // le barre native di iOS; l'icona resta il riferimento principale.
          tabBarLabel: ({ focused, color }) => (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              maxFontSizeMultiplier={1.3}
              style={{
                color,
                fontSize: BASE_FONT_SIZE,
                marginTop: ICON_TEXT_GAP,
                fontFamily: focused ? FONT_ACTIVE : FONT_INACTIVE,
              }}
            >
              {LABELS[route.name]}
            </Text>
          ),
        })}
      >
        <Tabs.Screen name="(home)" />
        <Tabs.Screen name="nutrition" />
        <Tabs.Screen name="workout" />
        <Tabs.Screen name="progress" />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  lucchetto: {
    top: -6,
    right: -9,
  },
});
