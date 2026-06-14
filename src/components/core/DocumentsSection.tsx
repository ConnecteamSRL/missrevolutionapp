import React, { useCallback, useRef } from 'react';
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { File, FileSpreadsheet, FileText, Presentation } from 'lucide-react-native';
import { GraphitFonts } from '@/src/theme';
import { supabase } from '@/src/lib/supabase';
import { Attachment, useAttachments } from '@/src/hooks/content/useAttachments';
import {
  CONTENT_TEXT_SIZE_MULTIPLIERS,
  useContentTextSizeStore,
} from '@/src/store/contentTextSizeStore';

type Props = {
  assignmentId?: string | null;
};

const ICON_COLOR = '#ED5192';
const UI_DOCUMENTS_ERROR = 'Impossibile caricare i documenti.';

function DocumentIcon({ objectPath }: { objectPath: string | null }) {
  const ext = objectPath?.split('.').pop()?.toLowerCase() ?? '';
  switch (ext) {
    case 'xls':
    case 'xlsx':
      return <FileSpreadsheet size={22} color={ICON_COLOR} />;
    case 'ppt':
    case 'pptx':
      return <Presentation size={22} color={ICON_COLOR} />;
    case 'pdf':
    case 'doc':
    case 'docx':
      return <FileText size={22} color={ICON_COLOR} />;
    default:
      return <File size={22} color={ICON_COLOR} />;
  }
}

export default function DocumentsSection({ assignmentId }: Props) {
  const { data, error, refetch } = useAttachments(assignmentId);
  const isFirstFocus = useRef(true);

  // This section is only mounted on the workout/diet/recipe card surfaces,
  // so it always follows the persisted content text size (no opt-in prop).
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

  const openDocument = useCallback(async (doc: Attachment) => {
    if (!doc.object_path) return;
    const { data: urlData } = supabase.storage
      .from('content-documents')
      .getPublicUrl(doc.object_path);
    if (!urlData.publicUrl) return;
    try {
      await Linking.openURL(urlData.publicUrl);
    } catch (e) {
      console.error('Failed to open document', doc.object_path, e);
      Alert.alert('Errore', 'Impossibile aprire il documento.');
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

      <View style={styles.list}>
        {data.map((doc) => (
          <TouchableOpacity
            key={doc.id}
            style={styles.documentRow}
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
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    backgroundColor: '#FFE7F1',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#FFD1E4',
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#ED5192',
    fontFamily: GraphitFonts.GraphitBold,
  },
  list: {
    gap: 10,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD1E4',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFE7F1',
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

  statusBannerError: {
    backgroundColor: '#FFE7F1',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ED5192',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  bannerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bannerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ED5192' },
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
    borderColor: '#FFD1E4',
  },
  retryButtonText: { color: '#ED5192', fontSize: 14, fontFamily: GraphitFonts.GraphitBold },
});
