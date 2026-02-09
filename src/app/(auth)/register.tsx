import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Image } from 'expo-image';

import BackgroundGradientComponent from '@components/core/BackgroundGradientComponent';
import { supabase } from '@/src/lib/supabase';
import { colors, GraphitFonts } from '@/src/theme';
import { DismissKeyboardView } from '@components/layouts/DismissKeyboardView';

const UI_GENERIC_ERROR = 'Operazione non riuscita. Riprova.';

const normalizeEmail = (v: string) => v.trim().toLowerCase();

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);

  const logo = require('../../../assets/images/logo-ext.png');

  const isValid = useMemo(() => {
    const e = normalizeEmail(email);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(e) && password.length >= 6 && password === password2;
  }, [email, password, password2]);

  const goToLoginHard = () => {
    router.dismissAll();
    router.replace('/login');
  };

  const onSubmit = async () => {
    const e = normalizeEmail(email);

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: e,
        password,
      });

      if (error) {
        console.warn('signUp error:', error);
        Alert.alert('Registrazione', UI_GENERIC_ERROR);
        return;
      }

      Alert.alert('Registrazione', 'Ti abbiamo inviato un codice OTP via email.');
      router.push({ pathname: '/confirm-signup', params: { email: e } });
    } catch (err) {
      console.warn('signUp exception:', err);
      Alert.alert('Registrazione', UI_GENERIC_ERROR);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <BackgroundGradientComponent />
      <DismissKeyboardView>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.logoContainer}>
            <Image source={logo} style={styles.logo} contentFit="contain" />
          </View>

          <Text style={styles.title}>Crea account</Text>
          <Text style={styles.subtitle}>
            Inserisci email e password, poi conferma con il codice OTP.
          </Text>

          <View style={styles.form}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              editable={!loading}
            />

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password (min 6 caratteri)"
              autoCapitalize="none"
              secureTextEntry
              style={[styles.input, styles.secureInput]}
              editable={!loading}
            />

            <TextInput
              value={password2}
              onChangeText={setPassword2}
              placeholder="Conferma password"
              autoCapitalize="none"
              secureTextEntry
              style={[styles.input, styles.secureInput]}
              editable={!loading}
            />

            <TouchableOpacity
              disabled={!isValid || loading}
              onPress={onSubmit}
              style={[styles.button, (!isValid || loading) && styles.buttonDisabled]}
            >
              <Text style={styles.buttonText}>{loading ? 'Creazione...' : 'Crea account'}</Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>oppure</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.secondarySection}
              disabled={loading}
              onPress={goToLoginHard}
            >
              <Text style={styles.secondaryButtonText}>Hai già un account? Accedi</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </DismissKeyboardView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f8f8' },
  container: { flex: 1, padding: 20, justifyContent: 'flex-start' },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 150,
    height: 55,
  },

  title: {
    fontSize: 24,
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

  button: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: colors.white,
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 16,
  },

  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E6E6E6',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    color: '#999',
    fontFamily: GraphitFonts.GraphitRegular,
  },

  secondarySection: {
    display: 'flex',
    marginTop: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 16,
    color: colors.text,
  },
});
