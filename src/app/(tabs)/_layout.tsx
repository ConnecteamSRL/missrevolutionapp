import React from 'react';
import { Platform, StyleSheet, Text, TextStyle, View } from 'react-native';
import { Tabs } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackgroundGradientComponent from '@components/core/BackgroundGradientComponent';
import HeaderTabComponent from '@components/tab/HeaderTabComponent';
import ResponsiveContainer from '@components/layouts/ResponsiveContainer';
import { useResponsive } from '@/src/hooks/core/useResponsive';

import HomeIcon from '@components/ui/icons/HomeIcon';
import NutritionIcon from '@components/ui/icons/NutritionIcon';
import WorkoutIcon from '@components/ui/icons/WorkoutIcon';
import ProgressIcon from '@components/ui/icons/ProgressIcon';

type SvgIconComponent = React.FC<{ color: string; size: number }>;

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

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { sp } = useResponsive();

  const BASE_HEIGHT = sp(80);
  const ICON_SIZE = sp(24);
  const BASE_FONT_SIZE = sp(12);
  const ICON_TEXT_GAP = sp(8);

  const bottomInset = Platform.OS === 'android' ? Math.max(insets.bottom, 10) : insets.bottom;

  const barHeight = BASE_HEIGHT + bottomInset;

  return (
    <View style={styles.root}>
      <BackgroundGradientComponent />

      <View style={{ paddingTop: insets.top + 8 }}>
        <ResponsiveContainer>
          <HeaderTabComponent />
        </ResponsiveContainer>
      </View>

      <Tabs
        backBehavior="order"
        screenOptions={({ route }) => ({
          headerShown: false,
          sceneStyle: {
            backgroundColor: 'transparent',
          },
          safeAreaInsets: { bottom: bottomInset },
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: '#F1DFFF',
          tabBarBackground: () => (
            <LinearGradient
              colors={['#CEA1F1', '#C082EF']}
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
            return <IconComponent color={color} size={ICON_SIZE} />;
          },
          tabBarLabel: ({ focused, color }) => (
            <Text
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
});
