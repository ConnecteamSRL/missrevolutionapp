import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, RotateCw } from 'lucide-react-native';
import { WebView } from 'react-native-webview';

import { signContentDocument } from '@/src/utils/contentStorage';
import { colors, GraphitFonts } from '@/src/theme';
import { useTheme } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@mr-types/theme.types';

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export default function DocumentViewerScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const params = useLocalSearchParams<{
    objectPath?: string | string[];
    title?: string | string[];
  }>();
  const objectPath = firstParam(params.objectPath);
  const title = firstParam(params.title) || objectPath.split('/').pop() || 'Documento';
  const [reloadKey, setReloadKey] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [signing, setSigning] = useState(true);

  // Il bucket e' privato: l'URL va firmato prima di darlo alla WebView, e
  // rifirmato a ogni "Riprova" perche' la firma precedente puo' essere scaduta.
  useEffect(() => {
    if (!objectPath) {
      setDocumentUrl(null);
      setSigning(false);
      return;
    }
    let active = true;
    setSigning(true);
    signContentDocument(objectPath)
      .catch(() => null)
      .then((url) => {
        if (!active) return;
        setDocumentUrl(url);
        setSigning(false);
      });
    return () => {
      active = false;
    };
  }, [objectPath, reloadKey]);

  const viewerUrl = useMemo(() => {
    if (!documentUrl) return null;
    if (Platform.OS === 'android') {
      return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(documentUrl)}`;
    }
    return documentUrl;
  }, [documentUrl]);

  const retry = () => {
    setLoadFailed(false);
    setReloadKey((key) => key + 1);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Chiudi documento"
        >
          <ChevronLeft size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.headerButton} />
      </View>

      {signing ? (
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color={theme.secondary} />
        </View>
      ) : !viewerUrl || loadFailed ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Impossibile aprire il documento</Text>
          <Text style={styles.errorText}>Controlla la connessione e riprova.</Text>
          {objectPath ? (
            <TouchableOpacity style={styles.retryButton} onPress={retry} activeOpacity={0.85}>
              <RotateCw size={18} color={colors.white} />
              <Text style={styles.retryButtonText}>Riprova</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <WebView
          key={reloadKey}
          source={{ uri: viewerUrl }}
          style={styles.webView}
          originWhitelist={['https://*']}
          startInLoadingState
          setSupportMultipleWindows={false}
          allowsLinkPreview={false}
          mixedContentMode="never"
          onError={() => setLoadFailed(true)}
          onHttpError={() => setLoadFailed(true)}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.secondary} />
              <Text style={styles.loadingText}>Apertura documento...</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.white },
    header: {
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: '#E6E6E6',
      backgroundColor: colors.white,
    },
    headerButton: {
      width: 56,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      flex: 1,
      textAlign: 'center',
      color: colors.text,
      fontSize: 16,
      fontFamily: GraphitFonts.GraphitBold,
    },
    webView: { flex: 1, backgroundColor: colors.white },
    loadingContainer: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      backgroundColor: colors.white,
    },
    loadingText: {
      color: colors.textMuted,
      fontSize: 14,
      fontFamily: GraphitFonts.GraphitRegular,
    },
    errorContainer: {
      flex: 1,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorTitle: {
      color: colors.text,
      fontSize: 18,
      textAlign: 'center',
      fontFamily: GraphitFonts.GraphitBold,
    },
    errorText: {
      marginTop: 8,
      color: colors.textMuted,
      fontSize: 14,
      textAlign: 'center',
      fontFamily: GraphitFonts.GraphitRegular,
    },
    retryButton: {
      marginTop: 20,
      minHeight: 44,
      paddingHorizontal: 20,
      borderRadius: 22,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.secondary,
    },
    retryButtonText: {
      color: colors.white,
      fontSize: 14,
      fontFamily: GraphitFonts.GraphitBold,
    },
  });
