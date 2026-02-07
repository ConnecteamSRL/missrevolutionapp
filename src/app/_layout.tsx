import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import React, { useEffect, useMemo } from 'react';
import * as SplashScreen from 'expo-splash-screen';

import { AppConfigProvider, useAppConfig } from '@/src/contexts/AppConfigContext';
import { UserProvider } from '@/src/contexts/UserContext';
import { useSupabaseAuth } from '@/src/hooks/core/useSupabaseAuth';
import { useAuthStore } from '@/src/store/authStore';
import { useNotificationRouting } from '@/src/hooks/core/useNotificationRouting';

import { MaintenanceScreen } from '@/src/components/screens/MaintenanceScreen';
import { isUpdateNeeded } from '@/src/lib/versionCheck';
import { ForceUpdateScreen } from '@components/screens/ForceUpdateScreen';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';

SplashScreen.preventAutoHideAsync();

if (__DEV__) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('../../ReactotronConfig');
}

const LoadingScreen: React.FC = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={'#C388F0'} />
  </View>
);

const AppEntryPoint: React.FC = () => {
  const { config, isLoading: isConfigLoading } = useAppConfig();
  const { session, isLoading: isAuthLoading } = useAuthStore();

  useSupabaseAuth();

  const isLoggedIn: boolean = !!session;
  const isAppReady = !isConfigLoading && !isAuthLoading;

  // useNotificationRouting(isAppReady, isLoggedIn);

  const updateRequired = useMemo(() => {
    if (!config?.min_supported_version) return false;
    return isUpdateNeeded(config.min_supported_version);
  }, [config?.min_supported_version]);

  useEffect(() => {
    if (isAppReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isAppReady]);

  if (!isAppReady) {
    return <LoadingScreen />;
  }

  if (config?.maintenance_mode) {
    return <MaintenanceScreen message={config.maintenance_message ?? 'Manutenzione in corso'} />;
  }

  if (updateRequired && config) {
    return <ForceUpdateScreen config={config} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/register" />
        <Stack.Screen name="(auth)/reset-password" />
        <Stack.Screen name="(auth)/forgot-password" />
        <Stack.Screen name="(auth)/confirm-signup" />
        <Stack.Screen name="(auth)/set-password" />
      </Stack.Protected>

      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="video/index" />
        <Stack.Screen name="video/[categoryId]" />
        <Stack.Screen name="faq" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="recipes" />
        <Stack.Screen name="survey/index" />
        <Stack.Screen name="survey/[surveyId]" />
        <Stack.Screen name="(workout)/[workoutId]" />
        <Stack.Screen name="(recipe)/[recipeId]" />
        <Stack.Screen name="(chat)/chat" />
      </Stack.Protected>

      <Stack.Screen
        name={'privacy-policy'}
        options={{ headerShown: false, presentation: 'modal' }}
      />
    </Stack>
  );
};

export default function RootLayout(): React.ReactElement {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ActionSheetProvider>
          <AppConfigProvider>
            <UserProvider>
              <StatusBar style="dark" />
              <AppEntryPoint />
            </UserProvider>
          </AppConfigProvider>
        </ActionSheetProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
