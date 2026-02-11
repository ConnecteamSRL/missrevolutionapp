import React, { useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TextInputChangeEventData,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';

import { supabase } from '@/src/lib/supabase';
import BackgroundGradientComponent from '@components/core/BackgroundGradientComponent';
import { colors, GraphitFonts } from '@/src/theme';
import { DismissKeyboardView } from '@/src/components/layouts/DismissKeyboardView';
import { useAuthStore } from '@/src/store/authStore';
import ResponsiveContainer from '@components/layouts/ResponsiveContainer';

const SetPasswordScreen: React.FC = () => {
  const { signOut } = useAuthStore();
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [tokensValid, setTokensValid] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [tokens, setTokens] = useState<{ access_token?: string; refresh_token?: string }>({});

  const logo = require('../../../assets/images/logo-ext.png');

  const redirectToLogin = () => {
    router.replace('/(auth)/login');
  };

  useEffect(() => {
    const initializeScreen = async () => {
      await signOut();

      try {
        const initialUrl = await Linking.getInitialURL();

        if (!initialUrl) {
          setIsInitializing(false);
          redirectToLogin();
          return;
        }

        const fragmentIndex = initialUrl.indexOf('#');
        if (fragmentIndex === -1) {
          setIsInitializing(false);
          redirectToLogin();
          return;
        }

        const fragment = initialUrl.substring(fragmentIndex + 1);
        const params = new URLSearchParams(fragment);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          setTokens({ access_token: accessToken, refresh_token: refreshToken });
        } else {
          setIsInitializing(false);
          redirectToLogin();
        }
      } catch (error) {
        setIsInitializing(false);
        redirectToLogin();
      }
    };

    initializeScreen();
  }, []);

  useEffect(() => {
    const validateTokens = async () => {
      const { access_token, refresh_token } = tokens;

      if (!access_token || !refresh_token) {
        setTokensValid(false);
        setIsInitializing(false);
        redirectToLogin();
        return;
      }

      try {
        await supabase.auth.signOut();
        await new Promise((resolve) => setTimeout(resolve, 500));

        const { data, error } = await supabase.auth.getUser(access_token);

        if (error || !data.user) {
          setTokensValid(false);
          Alert.alert('Sessione non valida', 'Il link di invito potrebbe essere scaduto.', [
            { text: 'OK', onPress: redirectToLogin },
          ]);
          return;
        }

        setTokensValid(true);
      } catch (err) {
        setTokensValid(false);
        Alert.alert('Errore', 'Impossibile validare il link.', [
          { text: 'OK', onPress: redirectToLogin },
        ]);
      } finally {
        setIsInitializing(false);
      }
    };

    if (Object.keys(tokens).length > 0) {
      validateTokens();
    }
  }, [tokens]);

  useEffect(() => {
    const isLengthValid = password.length >= 6;
    const doMatch = password === confirmPassword;
    setIsValid(isLengthValid && doMatch && password.length > 0);
  }, [password, confirmPassword]);

  const handlePasswordChange = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    setPassword(e.nativeEvent.text);
  };

  const handleConfirmPasswordChange = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    setConfirmPassword(e.nativeEvent.text);
  };

  async function handleSetPassword(): Promise<void> {
    if (loading || !tokensValid) return;

    if (password !== confirmPassword) {
      Alert.alert('Errore', 'Le password non corrispondono.');
      return;
    }

    const { access_token, refresh_token } = tokens;

    if (!access_token || !refresh_token) {
      Alert.alert('Errore', 'Token mancanti.');
      redirectToLogin();
      return;
    }

    setLoading(true);

    try {
      await supabase.auth.signOut();
      await new Promise((resolve) => setTimeout(resolve, 300));

      const { error: setSessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (setSessionError) throw setSessionError;

      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      await supabase.auth.signOut();

      Alert.alert('Password salvata', 'Account attivato con successo. Ora puoi accedere.', [
        {
          text: 'Vai al Login',
          onPress: () => router.replace('/(auth)/login'),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Errore', err?.message || 'Si è verificato un errore imprevisto. Riprova.');
    } finally {
      setLoading(false);
    }
  }

  if (isInitializing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <BackgroundGradientComponent />

      <DismissKeyboardView>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <ResponsiveContainer maxWidth={480}>
            <View style={styles.logoContainer}>
              <Image source={logo} style={styles.logo} contentFit="contain" />
            </View>

            <Text style={styles.title}>Benvenuto!</Text>
            <Text style={styles.subtitle}>
              Completa la configurazione del tuo account impostando una password sicura.
            </Text>

            <View style={styles.form}>
              <TextInput
                onChange={handlePasswordChange}
                value={password}
                secureTextEntry
                placeholder="Nuova Password (min. 6 caratteri)"
                placeholderTextColor="#999"
                autoCapitalize="none"
                style={[styles.input, styles.secureInput]}
                editable={!loading && tokensValid}
                returnKeyType="next"
                blurOnSubmit={false}
              />

              <TextInput
                onChange={handleConfirmPasswordChange}
                value={confirmPassword}
                secureTextEntry
                placeholder="Conferma Password"
                placeholderTextColor="#999"
                autoCapitalize="none"
                style={[styles.input, styles.secureInput]}
                editable={!loading && tokensValid}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />

              <TouchableOpacity
                onPress={handleSetPassword}
                disabled={!isValid || loading || !tokensValid}
                style={[
                  styles.button,
                  (!isValid || loading || !tokensValid) && styles.buttonDisabled,
                ]}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Attivazione...' : 'Conferma e Inizia'}
                </Text>
              </TouchableOpacity>

              {!tokensValid && !isInitializing && (
                <Text style={styles.errorText}>
                  Sessione mancante. Riprova cliccando il link nella mail.
                </Text>
              )}
            </View>
          </ResponsiveContainer>
        </KeyboardAvoidingView>
      </DismissKeyboardView>
    </SafeAreaView>
  );
};

export default SetPasswordScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f8f8' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, padding: 20 },
  logoContainer: { alignItems: 'center', marginBottom: 30, marginTop: 40 },
  logo: { width: 150, height: 55 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: colors.text,
    fontFamily: GraphitFonts.GraphitBold,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    fontFamily: GraphitFonts.GraphitRegular,
    marginBottom: 40,
    marginTop: 8,
    paddingHorizontal: 20,
  },
  form: { gap: 15 },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: colors.white,
    fontSize: 16,
    fontFamily: GraphitFonts.GraphitRegular,
    color: colors.text,
  },
  secureInput: {
    ...(Platform.OS === 'android' && { fontFamily: undefined }),
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 10,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: colors.white,
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: 12,
    marginTop: 10,
    fontFamily: GraphitFonts.GraphitRegular,
  },
});
