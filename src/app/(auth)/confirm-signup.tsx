import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import BackgroundGradientComponent from '@components/core/BackgroundGradientComponent';
import OtpBoxesInput from '@components/auth/OtpBoxesInput';
import { supabase } from '@/src/lib/supabase';
import { colors, GraphitFonts } from '@/src/theme';

const UI_GENERIC_ERROR = 'Operazione non riuscita. Riprova.';
const RESEND_COOLDOWN_SEC = 60;

export default function ConfirmSignupScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const email = (params.email ?? '').toString().trim().toLowerCase();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const otpTrim = otp.trim();
  const otpValid = useMemo(() => /^[0-9]{6}$/.test(otpTrim), [otpTrim]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const onVerify = async () => {
    if (!email || !otpValid) {
      Alert.alert('Conferma', UI_GENERIC_ERROR);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpTrim,
        type: 'email',
      });

      if (error) {
        console.warn('verifyOtp error:', error);
        Alert.alert('Conferma', UI_GENERIC_ERROR);
        return;
      }

      router.replace('/');
    } catch (err) {
      console.warn('verifyOtp exception:', err);
      Alert.alert('Conferma', UI_GENERIC_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (!email || cooldown > 0 || loading) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) {
        console.warn('resend error:', error);
        Alert.alert('Codice', UI_GENERIC_ERROR);
        return;
      }

      setCooldown(RESEND_COOLDOWN_SEC);
      Alert.alert('Codice', 'Ti abbiamo reinviato un nuovo codice OTP.');
    } catch (err) {
      console.warn('resend exception:', err);
      Alert.alert('Codice', UI_GENERIC_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const goToLoginHard = () => {
    if (router.canGoBack()) router.back();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <BackgroundGradientComponent />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Text style={styles.title}>Conferma email</Text>
        <Text style={styles.subtitle}>Inserisci il codice ricevuto su {email || '—'}.</Text>

        <Text style={styles.hint}>
          Nota: se questa email era già registrata, potrebbe non arrivare un nuovo codice. In quel
          caso, torna al login.
        </Text>

        <View style={styles.form}>
          <OtpBoxesInput value={otpTrim} onChange={setOtp} disabled={loading} />

          <TouchableOpacity
            disabled={!otpValid || loading}
            onPress={onVerify}
            style={[styles.button, (!otpValid || loading) && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>{loading ? 'Verifica...' : 'Conferma'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={loading || cooldown > 0}
            onPress={onResend}
            style={styles.linkBtn}
          >
            <Text style={styles.linkText}>
              {cooldown > 0 ? `Reinvia tra ${cooldown}s` : 'Non hai ricevuto il codice? Reinvia'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity disabled={loading} onPress={goToLoginHard} style={styles.linkBtn}>
            <Text style={styles.linkText}>Torna al login</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f8f8' },
  container: { flex: 1, padding: 20, justifyContent: 'flex-start' },
  title: {
    fontSize: 24,
    textAlign: 'center',
    color: colors.text,
    fontFamily: GraphitFonts.GraphitBold,
    marginTop: 12,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    fontFamily: GraphitFonts.GraphitRegular,
    marginTop: 8,
  },
  hint: {
    textAlign: 'center',
    fontSize: 13,
    color: '#666',
    fontFamily: GraphitFonts.GraphitRegular,
    marginTop: 10,
    marginBottom: 18,
    lineHeight: 18,
  },
  form: { gap: 14, marginTop: 6 },
  button: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 6,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: colors.white,
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 16,
  },
  linkBtn: { alignItems: 'center', marginTop: 8 },
  linkText: { fontFamily: GraphitFonts.GraphitRegular, fontSize: 14, color: colors.text },
});
