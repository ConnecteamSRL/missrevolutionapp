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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Image } from 'expo-image';

import { supabase } from '@/src/lib/supabase';
import BackgroundGradientComponent from '@components/core/BackgroundGradientComponent';
import { colors, GraphitFonts } from '@/src/theme';
import { DismissKeyboardView } from '@/src/components/layouts/DismissKeyboardView';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isValid, setIsValid] = useState<boolean>(false);

  const logo = require('../../../assets/images/logo-ext.png');

  const handleEmailChange = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    setEmail(e.nativeEvent.text);
  };

  const handlePasswordChange = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    setPassword(e.nativeEvent.text);
  };

  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsValid(emailRegex.test(email) && password.length >= 6);
  }, [email, password]);

  async function signInWithEmail(): Promise<void> {
    if (loading) return;

    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();

      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error?.code === 'email_not_confirmed') {
        router.replace({
          pathname: '/confirm-signup',
          params: { email: normalizedEmail },
        });
        return;
      }

      if (error) {
        Alert.alert('Errore di Login', 'Credenziali non valide. Riprova.');
        return;
      }
    } catch {
      Alert.alert('Errore di Login', 'Credenziali non valide. Riprova.');
    } finally {
      setLoading(false);
    }
  }

  function handleForgotPassword(): void {
    if (loading) return;
    router.push({ pathname: '/forgot-password' });
  }

  function handleOpenPrivacy(): void {
    router.push('/privacy-policy');
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
          <View style={styles.logoContainer}>
            <Image source={logo} style={styles.logo} contentFit="contain" />
          </View>

          <Text style={styles.title}>Accedi</Text>
          <Text style={styles.subtitle}>
            Bentornato! Inserisci le tue credenziali per continuare.
          </Text>

          <View style={styles.form}>
            <TextInput
              onChange={handleEmailChange}
              value={email}
              placeholder="Email"
              autoCapitalize="none"
              style={styles.input}
              placeholderTextColor={'#9CA3AF'}
              keyboardType="email-address"
              editable={!loading}
              returnKeyType="next"
              onSubmitEditing={() => Keyboard.dismiss()}
            />

            <TextInput
              onChange={handlePasswordChange}
              value={password}
              secureTextEntry
              placeholder="Password"
              placeholderTextColor={'#9CA3AF'}
              autoCapitalize="none"
              style={[styles.input, styles.secureInput]}
              editable={!loading}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />

            <TouchableOpacity onPress={handleForgotPassword} disabled={loading}>
              <Text style={styles.forgotPassword}>Hai dimenticato la password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={signInWithEmail}
              disabled={!isValid || loading}
              style={[styles.button, (!isValid || loading) && styles.buttonDisabled]}
            >
              <Text style={styles.buttonText}>{loading ? 'Accesso in corso...' : 'Accedi'}</Text>
            </TouchableOpacity>
          </View>

          {/* FOOTER PRIVACY POLICY */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Continuando, accetti la nostra{' '}
              <Text style={styles.linkText} onPress={handleOpenPrivacy}>
                Privacy Policy
              </Text>
            </Text>
          </View>
        </KeyboardAvoidingView>
      </DismissKeyboardView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f8f8' },
  container: { flex: 1, padding: 20 },
  logoContainer: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
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
  },
  secureInput: {
    ...(Platform.OS === 'android' && { fontFamily: undefined }),
  },
  forgotPassword: {
    textAlign: 'right',
    color: colors.text,
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 14,
    marginBottom: 20,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.white, fontFamily: GraphitFonts.GraphitRegular, fontSize: 16 },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingBottom: 10,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#888',
    fontFamily: GraphitFonts.GraphitRegular,
  },
  linkText: {
    color: colors.secondary,
    textDecorationLine: 'underline',
    fontFamily: GraphitFonts.GraphitBold,
  },
});
