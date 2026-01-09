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
import { router, useLocalSearchParams } from 'expo-router';

import BackgroundGradientComponent from '@components/core/BackgroundGradientComponent';
import OtpBoxesInput from '@components/auth/OtpBoxesInput';
import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/store/authStore';
import { colors, GraphitFonts } from '@/src/theme';

const UI_GENERIC_ERROR = 'Operazione non riuscita. Riprova.';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const email = (params.email ?? '').toString().trim().toLowerCase();

  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const otpTrim = otp.trim();
  const otpValid = useMemo(() => /^[0-9]{6}$/.test(otpTrim), [otpTrim]);
  const canSubmit =
    otpValid && password.length >= 6 && password === confirmPassword && !!email && !loading;

  const restartFlow = () => {
    try {
      useAuthStore.getState().signOut();
    } catch {}
    supabase.auth.signOut().catch(() => {});
    router.replace('/forgot-password');
  };

  const failAndRestart = () => {
    Alert.alert('Reset', UI_GENERIC_ERROR, [{ text: 'OK', onPress: restartFlow }]);
  };

  const onReset = async () => {
    if (!email || !otpValid || password.length < 6 || password !== confirmPassword) {
      Alert.alert('Reset', UI_GENERIC_ERROR);
      return;
    }

    setLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otpTrim,
        type: 'recovery',
      });

      if (verifyError) {
        console.warn('verifyOtp error:', verifyError);
        failAndRestart();
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        console.warn('updateUser error:', updateError);
        failAndRestart();
        return;
      }

      Alert.alert('Reset', 'La tua password è stata aggiornata!');
      try {
        useAuthStore.getState().signOut();
      } catch {}
      await supabase.auth.signOut().catch(() => {});
      router.replace('/login');
    } catch (err) {
      console.warn('reset exception:', err);
      failAndRestart();
    } finally {
      setLoading(false);
    }
  };

  const onCancel = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <BackgroundGradientComponent />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Text style={styles.title}>Nuova Password</Text>
        <Text style={styles.subtitle}>
          Inserisci il codice ricevuto via email e imposta la tua nuova password.
        </Text>

        <View style={styles.form}>
          <OtpBoxesInput value={otpTrim} onChange={setOtp} disabled={loading} />

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Nuova Password"
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
            editable={!loading}
          />

          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Conferma Password"
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
            editable={!loading}
          />

          <TouchableOpacity
            onPress={onReset}
            disabled={!canSubmit}
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Aggiornamento...' : 'Imposta Password'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onCancel} disabled={loading} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Annulla</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f8f8' },
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: {
    fontSize: 24,
    textAlign: 'center',
    color: colors.text,
    fontFamily: GraphitFonts.GraphitBold,
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    fontFamily: GraphitFonts.GraphitRegular,
    marginBottom: 20,
  },
  form: { gap: 14 },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 10,
    paddingHorizontal: 15,
    backgroundColor: colors.white,
    fontSize: 16,
    fontFamily: GraphitFonts.GraphitRegular,
    color: colors.text,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: GraphitFonts.GraphitRegular,
  },
  cancelButton: { alignItems: 'center', marginTop: 6 },
  cancelText: { color: '#999', fontFamily: GraphitFonts.GraphitRegular },
});
