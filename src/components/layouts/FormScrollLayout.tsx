import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';

// Le schermate con un modulo (accesso, password, codici) devono poter scorrere
// sempre: con il testo ingrandito, lo zoom dello schermo o la tastiera aperta il
// contenuto supera l'altezza disponibile, e senza scorrimento il pulsante finale
// («Accedi», «Invia Codice»...) restava fuori dallo schermo, irraggiungibile.
// Un tocco fuori dai campi chiude la tastiera come faceva DismissKeyboardView.
export function FormScrollLayout({
  children,
  contentContainerStyle,
  keyboardVerticalOffset = Platform.OS === 'ios' ? 8 : 0,
}: {
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardVerticalOffset?: number;
}) {
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  // flexGrow e non flex: il contenuto corto resta impaginato come prima,
  // quello lungo allunga la pagina invece di essere tagliato.
  content: { flexGrow: 1 },
});
