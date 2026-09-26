import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, AppState, StyleSheet, View } from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';

import { AppConfigProvider, useAppConfig } from '@/src/contexts/AppConfigContext';
import { UserProvider, useUser } from '@/src/contexts/UserContext';
import { ChatUnreadProvider } from '@/src/contexts/ChatUnreadContext';
import { ThemeProvider, useTheme } from '@/src/contexts/ThemeContext';
import { useSupabaseAuth } from '@/src/hooks/core/useSupabaseAuth';
import { useAuthStore } from '@/src/store/authStore';
import { consensiRichiesti, useConsensiStore } from '@/src/store/consensiStore';
import { useAccessoStore } from '@/src/store/accessoStore';
import { useContentTextSizeStore } from '@/src/store/contentTextSizeStore';
import { useGenderStore } from '@/src/store/genderStore';
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

const LoadingScreen: React.FC = () => {
  const theme = useTheme();
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.accent} />
    </View>
  );
};

const AppEntryPoint: React.FC = () => {
  const { config, isLoading: isConfigLoading } = useAppConfig();
  const { session, isLoading: isAuthLoading } = useAuthStore();
  const { me, error: userError } = useUser();
  const statoConsensi = useConsensiStore((s) => s.stato);
  const erroreConsensi = useConsensiStore((s) => s.errore);
  const statoAccesso = useAccessoStore((s) => s.stato);
  const erroreAccesso = useAccessoStore((s) => s.errore);

  useSupabaseAuth();

  const isLoggedIn: boolean = !!session;
  const userId = session?.user?.id ?? null;
  const isAppReady = !isConfigLoading && !isAuthLoading;

  // Consensi e abbonamento si leggono a ogni accesso, all'avvio con una sessione
  // salvata e a ogni ritorno in primo piano, cosi' una revoca fatta da un altro
  // telefono, un testo aggiornato o un abbonamento scaduto nella notte valgono
  // senza riavviare l'app; al logout li azzera signOut. Se la rilettura
  // fallisce (offline) resta lo stato di prima.
  useEffect(() => {
    if (!userId) return;
    const carica = () => {
      useConsensiStore
        .getState()
        .carica()
        .catch((err) => {
          if (__DEV__) console.error('[consensi]', err);
        });
      useAccessoStore
        .getState()
        .carica()
        .catch((err) => {
          if (__DEV__) console.error('[accesso]', err);
        });
    };
    void carica();
    const subscription = AppState.addEventListener('change', (stato) => {
      if (stato === 'active') void carica();
    });
    return () => subscription.remove();
  }, [userId]);

  // Senza i consensi richiesti (Termini per tutti, dati sulla salute per i
  // clienti) l'unica schermata raggiungibile e' quella dei consensi. Finche'
  // stato e ruolo non sono noti vale come «non validi»: si chiude, non si apre.
  const ruolo = me?.role;
  const consensiOk =
    !!statoConsensi &&
    !!ruolo &&
    consensiRichiesti(ruolo).every((finalita) => statoConsensi[finalita].valido);
  const consensiInAttesa = isLoggedIn && (!statoConsensi || !me) && !erroreConsensi && !userError;

  // Senza accesso (lo decide il server con stato_accesso) si vede solo la
  // schermata dell'abbonamento, con la chat della palestra e il
  // profilo. Finche' lo stato non e' noto, o se non si riesce a leggerlo, vale
  // come «senza»: la schermata mostra l'attesa o l'errore con «Riprova».
  const accessoOk = !!statoAccesso?.accesso;
  const accessoInAttesa = isLoggedIn && !statoAccesso && !erroreAccesso;

  // Al primo ingresso con una sessione salvata si aspettano anche i consensi,
  // cosi' chi li ha gia' dati va dritto alle tab. Dopo lo Stack non si smonta
  // piu': a un nuovo login l'attesa la mostra la schermata dei consensi.
  const [avviata, setAvviata] = useState(false);
  const pronta = isAppReady && !consensiInAttesa && !accessoInAttesa;
  if (pronta && !avviata) setAvviata(true);

  useNotificationRouting(isAppReady, isLoggedIn && consensiOk);

  const updateRequired = useMemo(() => {
    if (!config?.min_supported_version) return false;
    return isUpdateNeeded(config.min_supported_version);
  }, [config?.min_supported_version]);

  useEffect(() => {
    if (isAppReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isAppReady]);

  if (!isAppReady || (!avviata && !pronta)) {
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

      <Stack.Protected guard={isLoggedIn && !consensiOk}>
        <Stack.Screen name="consensi" />
      </Stack.Protected>

      <Stack.Protected guard={isLoggedIn && consensiOk && !accessoOk}>
        <Stack.Screen name="abbonamento" />
      </Stack.Protected>

      <Stack.Protected guard={isLoggedIn && consensiOk && accessoOk}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="video/index" />
        <Stack.Screen name="video/[categoryId]" />
        <Stack.Screen name="(video)/[videoId]" />
        <Stack.Screen name="faq" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="recipes" />
        <Stack.Screen name="survey/index" />
        <Stack.Screen name="survey/[surveyId]" />
        <Stack.Screen name="(workout)/[workoutId]" />
        <Stack.Screen name="(recipe)/[recipeId]" />
        <Stack.Screen name="(diet)/[dietId]" />
        <Stack.Screen name="archive/[contentType]" />
      </Stack.Protected>

      {/* Anche senza abbonamento: la chat per rinnovare, il profilo con la privacy. */}
      <Stack.Protected guard={isLoggedIn && consensiOk}>
        <Stack.Screen name="profile" />
        <Stack.Screen name="(chat)/chat" />
        <Stack.Screen name="document-viewer" options={{ presentation: 'modal' }} />
      </Stack.Protected>

      <Stack.Screen
        name={'privacy-policy'}
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <Stack.Screen name="termini" options={{ headerShown: false, presentation: 'modal' }} />
    </Stack>
  );
};

export default function RootLayout(): React.ReactElement {
  // Restores the persisted content text size while the splash screen is
  // still up (app readiness waits on config + auth network calls, so the
  // AsyncStorage read completes well before any content card can render).
  // Il sesso memorizzato segue la stessa strada: serve a scegliere il tema
  // prima che il profilo utente arrivi dal server.
  useEffect(() => {
    useContentTextSizeStore.getState().hydrate();
    useGenderStore.getState().hydrate();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ActionSheetProvider>
          <AppConfigProvider>
            <UserProvider>
              <ThemeProvider>
                <ChatUnreadProvider>
                  <StatusBar style="dark" />
                  <AppEntryPoint />
                </ChatUnreadProvider>
              </ThemeProvider>
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
