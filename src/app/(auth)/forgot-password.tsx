import React, { useState } from 'react';
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
import ResponsiveContainer from '@components/layouts/ResponsiveContainer';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const logo = require('../../../assets/images/logo-ext.png');

  const handleResetRequest = async () => {
    const emailTrim = email.trim().toLowerCase();
    if (!emailTrim) {
      Alert.alert('Errore', 'Inserisci un indirizzo email valido.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailTrim);

      if (error) {
        Alert.alert('Errore', error.message);
      } else {
        router.push({
          pathname: '/reset-password',
          params: { email: emailTrim },
        });
      }
    } catch (err) {
      Alert.alert('Errore', 'Si è verificato un problema imprevisto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <BackgroundGradientComponent />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ResponsiveContainer maxWidth={480}>
          <View style={styles.logoContainer}>
            <Image source={logo} style={styles.logo} contentFit="contain" />
          </View>

          <Text style={styles.title}>Recupero Password</Text>
          <Text style={styles.subtitle}>
            Inserisci la tua email. Ti invieremo un codice per reimpostare la password.
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

            <TouchableOpacity
              onPress={handleResetRequest}
              disabled={!email || loading}
              style={[styles.button, (!email || loading) && styles.buttonDisabled]}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Invio in corso...' : 'Invia Codice'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={loading}
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>Torna al Login</Text>
            </TouchableOpacity>
          </View>
        </ResponsiveContainer>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f8f8' },
  container: { flex: 1, padding: 20, justifyContent: 'flex-start' },
  logoContainer: { alignItems: 'center', marginBottom: 30 },
  logo: { width: 120, height: 45 },
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
    marginBottom: 30,
    lineHeight: 20,
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
  button: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    borderRadius: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: GraphitFonts.GraphitRegular,
  },
  backButton: { alignItems: 'center', marginTop: 10 },
  backButtonText: {
    color: colors.text,
    fontSize: 14,
    fontFamily: GraphitFonts.GraphitRegular,
  },
});
