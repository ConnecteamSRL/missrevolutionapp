import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { File as LocalFile, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Download, File, FileSpreadsheet, FileText, Presentation } from 'lucide-react-native';
import { colors, GraphitFonts } from '@/src/theme';
import { useTheme } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@mr-types/theme.types';
import { Attachment, useAttachments } from '@/src/hooks/content/useAttachments';
import { signContentDocument } from '@/src/utils/contentStorage';
import {
  CONTENT_TEXT_SIZE_MULTIPLIERS,
  useContentTextSizeStore,
} from '@/src/store/contentTextSizeStore';

type Props = {
  assignmentId?: string | null;
};

const UI_DOCUMENTS_ERROR = 'Impossibile caricare i documenti.';

const MIME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

function downloadFileName(doc: Attachment): string {
  const storageName = doc.object_path?.split('/').pop() || 'documento';
  const extension = storageName.split('.').pop()?.toLowerCase() || '';
  const displayName = doc.display_name?.trim() || storageName;
  const name =
    displayName.includes('.') || !extension ? displayName : `${displayName}.${extension}`;
  return name.replace(/[\\/:*?"<>|]/g, '-');
}

function DocumentIcon({ objectPath }: { objectPath: string | null }) {
  const theme = useTheme();
  const ext = objectPath?.split('.').pop()?.toLowerCase() ?? '';
  switch (ext) {
    case 'xls':
    case 'xlsx':
      return <FileSpreadsheet size={22} color={theme.secondary} />;
    case 'ppt':
    case 'pptx':
      return <Presentation size={22} color={theme.secondary} />;
    case 'pdf':
    case 'doc':
    case 'docx':
      return <FileText size={22} color={theme.secondary} />;
    default:
      return <File size={22} color={theme.secondary} />;
  }
}

export default function DocumentsSection({ assignmentId }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();
  const { data, error, refetch } = useAttachments(assignmentId);
  const isFirstFocus = useRef(true);
  const [downloadingPath, setDownloadingPath] = useState<string | null>(null);

  // La sezione segue la dimensione testo persistita su tutte le superfici contenuto.
  const textSizeLevel = useContentTextSizeStore((s) => s.level);
  const textSizeMultiplier = CONTENT_TEXT_SIZE_MULTIPLIERS[textSizeLevel];

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      refetch();
    }, [refetch]),
  );

  const openDocument = useCallback(
    (doc: Attachment) => {
      if (!doc.object_path) return;
      router.push({
        pathname: '/document-viewer',
        params: {
          objectPath: doc.object_path,
          title: downloadFileName(doc),
        },
      });
    },
    [router],
  );

  const downloadDocument = useCallback(async (doc: Attachment) => {
    if (!doc.object_path) return;

    setDownloadingPath(doc.object_path);
    try {
      // Il bucket e' privato: la firma si chiede al momento del download.
      const url = await signContentDocument(doc.object_path);
      if (!url) {
        Alert.alert('Errore', 'Impossibile scaricare il documento.');
        return;
      }
      const fileName = downloadFileName(doc);
      const downloaded = await LocalFile.downloadFileAsync(
        url,
        new LocalFile(Paths.cache, fileName),
        {
          idempotent: true,
        },
      );
      if (await Sharing.isAvailableAsync()) {
        const extension = doc.object_path.split('.').pop()?.toLowerCase() || '';
        await Sharing.shareAsync(downloaded.uri, {
          dialogTitle: `Salva ${fileName}`,
          mimeType: MIME_TYPES[extension],
        });
      } else {
        Alert.alert('Download completato', 'Il documento è stato scaricato nell’app.');
      }
    } catch (e) {
      console.error('Failed to download document', doc.object_path, e);
      Alert.alert('Errore', 'Impossibile scaricare il documento.');
    } finally {
      setDownloadingPath(null);
    }
  }, []);

  if (error) {
    return (
      <View style={styles.statusBannerError}>
        <View style={styles.bannerHeader}>
          <View style={styles.bannerDot} />
          <Text style={styles.statusTextError}>{UI_DOCUMENTS_ERROR}</Text>
        </View>

        <TouchableOpacity style={styles.retryButton} onPress={refetch} activeOpacity={0.85}>
          <Text style={styles.retryButtonText}>Riprova</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { fontSize: Math.round(16 * textSizeMultiplier) }]}>
        Documenti
      </Text>
      <Text style={[styles.sectionHint, { fontSize: Math.round(12 * textSizeMultiplier) }]}>
        Tocca un documento per aprirlo nell’app.
      </Text>

      <View style={styles.list}>
        {data.map((doc) => (
          <View key={doc.id} style={styles.documentRow}>
            <TouchableOpacity
              style={styles.documentOpenButton}
              onPress={() => openDocument(doc)}
              activeOpacity={0.85}
            >
              <View style={styles.iconBox}>
                <DocumentIcon objectPath={doc.object_path} />
              </View>
              <Text
                style={[styles.documentName, { fontSize: Math.round(14 * textSizeMultiplier) }]}
                numberOfLines={2}
              >
                {doc.display_name}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => downloadDocument(doc)}
              activeOpacity={0.85}
              disabled={downloadingPath === doc.object_path}
              accessibilityRole="button"
              accessibilityLabel={`Scarica ${doc.display_name ?? 'documento'}`}
            >
              {downloadingPath === doc.object_path ? (
                <ActivityIndicator size="small" color={theme.secondary} />
              ) : (
                <>
                  <Download size={18} color={theme.secondary} />
                  <Text style={styles.downloadButtonText}>Scarica</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      alignSelf: 'stretch',
      backgroundColor: theme.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      marginBottom: 16,
      gap: 12,
    },
    sectionTitle: {
      fontSize: 16,
      color: theme.secondary,
      fontFamily: GraphitFonts.GraphitBold,
    },
    sectionHint: {
      marginTop: -6,
      color: colors.textMuted,
      fontFamily: GraphitFonts.GraphitRegular,
    },
    list: {
      gap: 10,
    },
    documentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
    },
    documentOpenButton: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
      paddingLeft: 12,
      paddingRight: 8,
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    documentName: {
      flex: 1,
      flexShrink: 1,
      fontSize: 14,
      color: '#1F1F1F',
      fontFamily: GraphitFonts.GraphitRegular,
    },
    downloadButton: {
      width: 84,
      alignSelf: 'stretch',
      flexDirection: 'row',
      gap: 4,
      alignItems: 'center',
      justifyContent: 'center',
      borderLeftWidth: 1,
      borderLeftColor: theme.border,
    },
    downloadButtonText: {
      color: theme.secondary,
      fontSize: 12,
      fontFamily: GraphitFonts.GraphitBold,
    },

    statusBannerError: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.secondary,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 16,
    },
    bannerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    bannerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.secondary },
    statusTextError: {
      flex: 1,
      fontFamily: GraphitFonts.GraphitRegular,
      color: '#D00000',
      fontSize: 14,
      lineHeight: 18,
    },
    retryButton: {
      marginTop: 10,
      backgroundColor: '#FFFFFF',
      paddingVertical: 12,
      borderRadius: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    retryButtonText: { color: theme.secondary, fontSize: 14, fontFamily: GraphitFonts.GraphitBold },
  });
