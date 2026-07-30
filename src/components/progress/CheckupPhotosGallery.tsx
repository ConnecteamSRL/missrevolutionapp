import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { File as PickedFile, Paths } from 'expo-file-system';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import { SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react-native';
import ImageViewing from 'react-native-image-viewing';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CheckupHistoryItem } from '@/src/hooks/progress/useCheckupHistory';
import type { CheckupPhotoCategory, CheckupPhotoItem } from '@/src/hooks/progress/useCheckupPhotos';
import { useTheme } from '@/src/contexts/ThemeContext';
import { GraphitFonts } from '@/src/theme';
import { AppTheme } from '@mr-types/theme.types';

const UI = {
  text: '#1F1F1F',
  muted: '#545454',
  danger: '#C62828',
  white: '#FFFFFF',
};

const CATEGORIES: { value: CheckupPhotoCategory; label: string }[] = [
  { value: 'bia', label: 'BIA' },
  { value: 'other', label: 'Altro' },
];

interface CheckupPhotosGalleryProps {
  checkups: CheckupHistoryItem[];
  photos: CheckupPhotoItem[];
  isLoading: boolean;
  error: string | null;
  uploadPhoto: (args: {
    checkupId: string;
    category: CheckupPhotoCategory;
    bytes: Uint8Array;
    contentType: string;
  }) => Promise<void>;
  replacePhoto: (photo: CheckupPhotoItem, bytes: Uint8Array, contentType: string) => Promise<void>;
  deletePhoto: (photo: CheckupPhotoItem) => Promise<void>;
}

type FileSource = 'camera' | 'library' | 'pdf';

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(iso),
  );

const pickerOptions = {
  mediaTypes: ['images'] as ImagePicker.MediaType[],
  allowsEditing: false,
  quality: 1,
  exif: false,
};

const pickImage = async (
  source: 'camera' | 'library',
): Promise<ImagePicker.ImagePickerAsset | null> => {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permesso negato', 'Consenti l’accesso alla fotocamera per aggiungere la foto.');
      return null;
    }
  } else {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permesso negato', 'Consenti l’accesso alle foto per scegliere l’immagine.');
      return null;
    }
  }

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(pickerOptions)
      : await ImagePicker.launchImageLibraryAsync(pickerOptions);

  return result.canceled ? null : (result.assets[0] ?? null);
};

const base64ToBytes = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return bytes;
};

const makeJpegBytes = async (asset: ImagePicker.ImagePickerAsset): Promise<Uint8Array> => {
  const attempts = [
    { maxDimension: 1600, compress: 0.82 },
    { maxDimension: 1280, compress: 0.72 },
    { maxDimension: 1024, compress: 0.65 },
  ];
  let lastBytes: Uint8Array | null = null;

  for (const attempt of attempts) {
    const context = ImageManipulator.ImageManipulator.manipulate(asset.uri);
    const longestSide = Math.max(asset.width ?? 0, asset.height ?? 0);

    if (longestSide > attempt.maxDimension) {
      if ((asset.width ?? 0) >= (asset.height ?? 0)) {
        context.resize({ width: attempt.maxDimension });
      } else {
        context.resize({ height: attempt.maxDimension });
      }
    }

    const rendered = await context.renderAsync();
    const output = await rendered.saveAsync({
      format: SaveFormat.JPEG,
      compress: attempt.compress,
      base64: true,
    });
    const bytes = base64ToBytes(output.base64 ?? '');
    lastBytes = bytes;

    if (bytes.byteLength > 0 && bytes.byteLength <= 5 * 1024 * 1024) return bytes;
  }

  if (!lastBytes?.byteLength || lastBytes.byteLength > 10 * 1024 * 1024) {
    throw new Error('Unable to normalize the selected image');
  }
  return lastBytes;
};

// Il bucket checkup_photos ha file_size_limit = 10485760: fermiamo qui i PDF
// troppo grandi, altrimenti lo storage risponde 413 dopo aver caricato tutto.
const MAX_PDF_BYTES = 10 * 1024 * 1024;

const pickPdfBytes = async (): Promise<Uint8Array | null> => {
  let picked: PickedFile | PickedFile[];
  try {
    picked = await PickedFile.pickFileAsync(undefined, 'application/pdf');
  } catch {
    // pickFileAsync rifiuta la promise quando l'utente annulla la scelta.
    return null;
  }

  const file = Array.isArray(picked) ? picked[0] : picked;
  if (file.size > MAX_PDF_BYTES) {
    Alert.alert('File troppo grande', 'Il PDF non può superare 10 MB.');
    return null;
  }
  return file.bytes();
};

// Il path lo scrive createPhoto, quindi l'estensione basta a distinguere
// un allegato PDF da una foto.
const isPdf = (photo: CheckupPhotoItem) => photo.storage_path.toLowerCase().endsWith('.pdf');

// Riepilogo dell'intestazione: dice cosa c'e' dentro la scheda senza doverla aprire.
// I file arrivano da una query piu' lenta di quella dei check-up, quindi finche' non
// e' finita non possiamo dire 'Nessun file': sarebbe falso quasi sempre all'apertura.
const formatSummary = (checkupPhotos: CheckupPhotoItem[], isLoading: boolean) => {
  if (checkupPhotos.length === 0) return isLoading ? 'Caricamento...' : 'Nessun file';
  const bia = checkupPhotos.filter((photo) => photo.pose_type === 'bia').length;
  return `${bia} BIA · ${checkupPhotos.length - bia} Altro`;
};

export const CheckupPhotosGallery: React.FC<CheckupPhotosGalleryProps> = ({
  checkups,
  photos,
  isLoading,
  error,
  uploadPhoto,
  replacePhoto,
  deletePhoto,
}) => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { showActionSheetWithOptions } = useActionSheet();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const enabledCheckups = useMemo(
    () =>
      [...checkups]
        .filter((checkup) => checkup.photos_enabled)
        .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)),
    [checkups],
  );
  const enabledIds = useMemo(
    () => new Set(enabledCheckups.map((checkup) => checkup.id)),
    [enabledCheckups],
  );
  const previewPhotos = useMemo(
    // I PDF restano fuori: ImageViewing ragiona per indice e un PDF in mezzo
    // sfaserebbe tutte le foto successive.
    () =>
      photos.filter(
        (photo) => photo.signedUrl && !isPdf(photo) && enabledIds.has(photo.checkup_id),
      ),
    [photos, enabledIds],
  );
  const viewerImages = useMemo(
    () => previewPhotos.map((photo) => ({ uri: photo.signedUrl! })),
    [previewPhotos],
  );

  const toggleCheckup = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const openPreview = (photo: CheckupPhotoItem) => {
    const index = previewPhotos.findIndex((item) => item.id === photo.id);
    if (index < 0) return;
    setCurrentImageIndex(index);
    setViewerVisible(true);
  };

  const openFile = async (photo: CheckupPhotoItem) => {
    if (!photo.signedUrl) return;
    if (!isPdf(photo)) {
      openPreview(photo);
      return;
    }

    try {
      setBusyKey(photo.id);
      // Il PDF non passa da un visore web di terzi: si scarica in cache privata
      // e lo apre il visore di sistema.
      const downloaded = await PickedFile.downloadFileAsync(
        photo.signedUrl,
        new PickedFile(Paths.cache, `checkup-${photo.id}.pdf`),
        { idempotent: true },
      );
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloaded.uri, {
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
          dialogTitle: 'Apri il PDF',
        });
      }
    } catch (openError) {
      console.error('[checkup photos] open pdf failed', openError);
      Alert.alert('Errore', 'Impossibile aprire il PDF. Riprova.');
    } finally {
      setBusyKey(null);
    }
  };

  const runFileMutation = async (
    source: FileSource,
    key: string,
    mutation: (bytes: Uint8Array, contentType: string) => Promise<void>,
    successMessage: string,
  ) => {
    try {
      if (source === 'pdf') {
        const bytes = await pickPdfBytes();
        if (!bytes) return;
        setBusyKey(key);
        // Il PDF non va ricompresso: si carica esattamente com'e'.
        await mutation(bytes, 'application/pdf');
      } else {
        const asset = await pickImage(source);
        if (!asset) return;
        setBusyKey(key);
        await mutation(await makeJpegBytes(asset), 'image/jpeg');
      }
      Alert.alert('Fatto', successMessage);
    } catch (mutationError) {
      console.error('[checkup photos] mutation failed', mutationError);
      Alert.alert('Errore', 'Operazione non riuscita. Riprova.');
    } finally {
      setBusyKey(null);
    }
  };

  const chooseSource = (
    key: string,
    mutation: (bytes: Uint8Array, contentType: string) => Promise<void>,
    successMessage: string,
  ) => {
    const options = ['Scatta foto', 'Scegli dalla libreria', 'Scegli un PDF', 'Annulla'];
    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: 3,
        title: 'Scegli la sorgente',
        containerStyle:
          Platform.OS === 'android' ? { paddingBottom: Math.max(insets.bottom, 12) } : undefined,
      },
      (selectedIndex?: number) => {
        if (selectedIndex === 0) {
          void runFileMutation('camera', key, mutation, successMessage);
        }
        if (selectedIndex === 1) {
          void runFileMutation('library', key, mutation, successMessage);
        }
        if (selectedIndex === 2) {
          void runFileMutation('pdf', key, mutation, successMessage);
        }
      },
    );
  };

  const confirmDelete = (photo: CheckupPhotoItem) => {
    Alert.alert('Elimina file', 'Vuoi eliminare questo file?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: async () => {
          try {
            setBusyKey(photo.id);
            await deletePhoto(photo);
          } catch (deleteError) {
            console.error('[checkup photos] delete failed', deleteError);
            Alert.alert('Errore', 'Non è stato possibile eliminare la foto. Riprova.');
          } finally {
            setBusyKey(null);
          }
        },
      },
    ]);
  };

  if (enabledCheckups.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>File check-up</Text>
      <Text style={styles.sectionSubtitle}>
        Aggiungi foto o PDF ai check-up creati dallo staff.
      </Text>

      {isLoading && photos.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.secondary} />
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {enabledCheckups.map((checkup) => {
        const checkupPhotos = photos.filter((photo) => photo.checkup_id === checkup.id);
        const isExpanded = expandedIds.includes(checkup.id);

        return (
          // La scheda anima la propria altezza: senza questo il corpo comparirebbe
          // a piena altezza e la sola opacita' non basterebbe a leggere il gesto.
          // Vale anche per le schede sotto, che scorrono invece di saltare.
          <Animated.View
            key={checkup.id}
            style={styles.checkupCard}
            layout={LinearTransition.duration(240)}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.checkupHeader}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityState={{ expanded: isExpanded }}
              onPress={() => toggleCheckup(checkup.id)}
            >
              <View style={styles.checkupHeaderTexts}>
                <Text style={styles.checkupTitle}>
                  Check-up del {formatDate(checkup.created_at)}
                </Text>
                <Text style={styles.checkupSummary}>{formatSummary(checkupPhotos, isLoading)}</Text>
              </View>
              {isExpanded ? (
                <ChevronUp size={20} color={theme.secondary} />
              ) : (
                <ChevronDown size={20} color={theme.secondary} />
              )}
            </TouchableOpacity>

            {isExpanded ? (
              <Animated.View
                entering={FadeIn.duration(160)}
                exiting={FadeOut.duration(100)}
                style={styles.checkupBody}
              >
                {CATEGORIES.map((category) => {
                  const categoryPhotos = checkupPhotos.filter(
                    (photo) => photo.pose_type === category.value,
                  );
                  const uploadKey = `${checkup.id}:${category.value}`;

                  return (
                    <View key={category.value} style={styles.categorySection}>
                      <View style={styles.categoryHeader}>
                        <Text style={styles.categoryTitle}>
                          {category.label} ({categoryPhotos.length})
                        </Text>
                        <TouchableOpacity
                          style={styles.addButton}
                          disabled={busyKey !== null}
                          onPress={() =>
                            chooseSource(
                              uploadKey,
                              (bytes, contentType) =>
                                uploadPhoto({
                                  checkupId: checkup.id,
                                  category: category.value,
                                  bytes,
                                  contentType,
                                }),
                              'File caricato con successo.',
                            )
                          }
                        >
                          {busyKey === uploadKey ? (
                            <ActivityIndicator size="small" color={UI.white} />
                          ) : (
                            <Text style={styles.addButtonText}>+ Aggiungi</Text>
                          )}
                        </TouchableOpacity>
                      </View>

                      {categoryPhotos.length === 0 ? (
                        <Text style={styles.categoryEmpty}>Nessun file in questa categoria.</Text>
                      ) : (
                        <View style={styles.photoGrid}>
                          {categoryPhotos.map((photo) => (
                            <View key={photo.id} style={styles.photoCard}>
                              <Pressable
                                disabled={!photo.signedUrl || busyKey !== null}
                                onPress={() => void openFile(photo)}
                              >
                                {isPdf(photo) ? (
                                  <View style={[styles.thumbnail, styles.pdfTile]}>
                                    <View style={styles.iconBox}>
                                      <FileText size={22} color={theme.secondary} />
                                    </View>
                                    <Text style={styles.categoryEmpty}>PDF</Text>
                                  </View>
                                ) : photo.signedUrl ? (
                                  <Image
                                    source={{ uri: photo.signedUrl }}
                                    style={styles.thumbnail}
                                    contentFit="cover"
                                    transition={200}
                                    cachePolicy="disk"
                                  />
                                ) : (
                                  <View style={[styles.thumbnail, styles.imageUnavailable]}>
                                    <Text style={styles.categoryEmpty}>
                                      Anteprima non disponibile
                                    </Text>
                                  </View>
                                )}
                                {busyKey === photo.id ? (
                                  <View style={styles.photoLoader}>
                                    <ActivityIndicator color={UI.white} />
                                  </View>
                                ) : null}
                              </Pressable>
                              <View style={styles.photoActions}>
                                <TouchableOpacity
                                  disabled={busyKey !== null}
                                  onPress={() =>
                                    chooseSource(
                                      photo.id,
                                      (bytes, contentType) =>
                                        replacePhoto(photo, bytes, contentType),
                                      'File sostituito con successo.',
                                    )
                                  }
                                >
                                  <Text style={styles.replaceText}>Sostituisci</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  disabled={busyKey !== null}
                                  onPress={() => confirmDelete(photo)}
                                >
                                  <Text style={styles.deleteText}>Elimina</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
              </Animated.View>
            ) : null}
          </Animated.View>
        );
      })}

      <ImageViewing
        images={viewerImages}
        imageIndex={currentImageIndex}
        visible={viewerVisible && viewerImages.length > 0}
        onRequestClose={() => setViewerVisible(false)}
        HeaderComponent={() => (
          <View
            style={[
              styles.viewerHeader,
              {
                paddingTop: insets.top + 12,
                paddingLeft: insets.left + 16,
                paddingRight: insets.right + 16,
              },
            ]}
          >
            <Pressable onPress={() => setViewerVisible(false)} hitSlop={12}>
              <Text style={styles.viewerCloseText}>Chiudi</Text>
            </Pressable>
          </View>
        )}
        FooterComponent={({ imageIndex }) => {
          const photo = previewPhotos[imageIndex];
          return photo ? (
            <View
              style={[
                styles.viewerFooter,
                {
                  paddingLeft: insets.left + 20,
                  paddingRight: insets.right + 20,
                  paddingBottom: insets.bottom + 24,
                },
              ]}
            >
              <Text style={styles.viewerFooterText}>
                {photo.pose_type === 'bia' ? 'BIA' : 'Altro'} · {formatDate(photo.created_at)}
              </Text>
            </View>
          ) : null;
        }}
      />
    </View>
  );
};

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: { marginTop: 24, marginBottom: 40 },
    sectionTitle: {
      fontSize: 20,
      color: theme.secondary,
      fontFamily: GraphitFonts.GraphitBold,
    },
    sectionSubtitle: {
      marginTop: 4,
      marginBottom: 16,
      fontSize: 13,
      lineHeight: 18,
      color: UI.muted,
      fontFamily: GraphitFonts.GraphitRegular,
    },
    loadingContainer: { padding: 24, alignItems: 'center' },
    errorText: {
      marginBottom: 12,
      color: UI.danger,
      fontFamily: GraphitFonts.GraphitMedium,
    },
    checkupCard: {
      marginBottom: 16,
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.border,
      // Mentre la scheda si apre il corpo e' gia' alto quanto sara' alla fine:
      // senza il taglio sborderebbe oltre il bordo arrotondato.
      overflow: 'hidden',
    },
    checkupTitle: {
      fontSize: 16,
      color: UI.text,
      fontFamily: GraphitFonts.GraphitBold,
    },
    checkupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    checkupHeaderTexts: { flex: 1 },
    checkupSummary: {
      marginTop: 2,
      fontSize: 12,
      color: UI.muted,
      fontFamily: GraphitFonts.GraphitRegular,
    },
    // Il titolo non ha piu' margine inferiore, che ora staccherebbe anche il riepilogo:
    // questi 4px, sommati al marginTop di categorySection, danno i 12px che separano
    // l'intestazione dalla prima sezione (in Yoga i margini non collassano).
    checkupBody: { marginTop: 4 },
    categorySection: {
      marginTop: 8,
      padding: 12,
      borderRadius: 14,
      backgroundColor: UI.white,
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    categoryTitle: {
      color: UI.text,
      fontSize: 14,
      fontFamily: GraphitFonts.GraphitBold,
    },
    addButton: {
      minWidth: 92,
      minHeight: 34,
      paddingHorizontal: 12,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 17,
      backgroundColor: theme.secondary,
    },
    addButtonText: {
      color: UI.white,
      fontSize: 12,
      fontFamily: GraphitFonts.GraphitBold,
    },
    categoryEmpty: {
      color: UI.muted,
      fontSize: 12,
      fontFamily: GraphitFonts.GraphitRegular,
    },
    photoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      rowGap: 12,
    },
    photoCard: {
      width: '48%',
      overflow: 'hidden',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
    },
    thumbnail: { width: '100%', height: 130, backgroundColor: theme.surface },
    pdfTile: { alignItems: 'center', justifyContent: 'center', gap: 6 },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    imageUnavailable: { alignItems: 'center', justifyContent: 'center', padding: 8 },
    photoLoader: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    photoActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
      paddingVertical: 9,
    },
    replaceText: {
      color: theme.secondary,
      fontSize: 11,
      fontFamily: GraphitFonts.GraphitBold,
    },
    deleteText: {
      color: UI.danger,
      fontSize: 11,
      fontFamily: GraphitFonts.GraphitBold,
    },
    viewerHeader: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 2,
      alignItems: 'flex-end',
    },
    viewerCloseText: {
      color: UI.white,
      fontSize: 16,
      fontFamily: GraphitFonts.GraphitBold,
    },
    viewerFooter: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
    },
    viewerFooterText: {
      color: UI.white,
      fontSize: 14,
      fontFamily: GraphitFonts.GraphitMedium,
    },
  });
