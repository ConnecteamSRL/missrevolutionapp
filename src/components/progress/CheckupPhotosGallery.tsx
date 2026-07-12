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
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import { SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import ImageViewing from 'react-native-image-viewing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CheckupHistoryItem } from '@/src/hooks/progress/useCheckupHistory';
import type { CheckupPhotoCategory, CheckupPhotoItem } from '@/src/hooks/progress/useCheckupPhotos';
import { GraphitFonts } from '@/src/theme';

const UI = {
  cardBg: '#FFD7E8',
  miniCardBg: '#FFE7F1',
  border: '#FFD1E4',
  text: '#1F1F1F',
  muted: '#545454',
  accent: '#ED5192',
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
  }) => Promise<void>;
  replacePhoto: (photo: CheckupPhotoItem, bytes: Uint8Array) => Promise<void>;
  deletePhoto: (photo: CheckupPhotoItem) => Promise<void>;
}

type PhotoSource = 'camera' | 'library';

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

const pickImage = async (source: PhotoSource): Promise<ImagePicker.ImagePickerAsset | null> => {
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

export const CheckupPhotosGallery: React.FC<CheckupPhotosGalleryProps> = ({
  checkups,
  photos,
  isLoading,
  error,
  uploadPhoto,
  replacePhoto,
  deletePhoto,
}) => {
  const insets = useSafeAreaInsets();
  const { showActionSheetWithOptions } = useActionSheet();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
    () => photos.filter((photo) => photo.signedUrl && enabledIds.has(photo.checkup_id)),
    [photos, enabledIds],
  );
  const viewerImages = useMemo(
    () => previewPhotos.map((photo) => ({ uri: photo.signedUrl! })),
    [previewPhotos],
  );

  const openPreview = (photo: CheckupPhotoItem) => {
    const index = previewPhotos.findIndex((item) => item.id === photo.id);
    if (index < 0) return;
    setCurrentImageIndex(index);
    setViewerVisible(true);
  };

  const runImageMutation = async (
    source: PhotoSource,
    key: string,
    mutation: (bytes: Uint8Array) => Promise<void>,
    successMessage: string,
  ) => {
    try {
      const asset = await pickImage(source);
      if (!asset) return;
      setBusyKey(key);
      const bytes = await makeJpegBytes(asset);
      await mutation(bytes);
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
    mutation: (bytes: Uint8Array) => Promise<void>,
    successMessage: string,
  ) => {
    const options = ['Scatta foto', 'Scegli dalla libreria', 'Annulla'];
    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: 2,
        title: 'Scegli la sorgente',
        containerStyle:
          Platform.OS === 'android' ? { paddingBottom: Math.max(insets.bottom, 12) } : undefined,
      },
      (selectedIndex?: number) => {
        if (selectedIndex === 0) {
          void runImageMutation('camera', key, mutation, successMessage);
        }
        if (selectedIndex === 1) {
          void runImageMutation('library', key, mutation, successMessage);
        }
      },
    );
  };

  const confirmDelete = (photo: CheckupPhotoItem) => {
    Alert.alert('Elimina foto', 'Sei sicura di voler eliminare questa foto?', [
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
      <Text style={styles.sectionTitle}>Foto check-up</Text>
      <Text style={styles.sectionSubtitle}>
        Aggiungi le tue foto BIA o altre immagini ai check-up creati dallo staff.
      </Text>

      {isLoading && photos.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={UI.accent} />
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {enabledCheckups.map((checkup) => (
        <View key={checkup.id} style={styles.checkupCard}>
          <Text style={styles.checkupTitle}>Check-up del {formatDate(checkup.created_at)}</Text>

          {CATEGORIES.map((category) => {
            const categoryPhotos = photos.filter(
              (photo) => photo.checkup_id === checkup.id && photo.pose_type === category.value,
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
                        (bytes) =>
                          uploadPhoto({
                            checkupId: checkup.id,
                            category: category.value,
                            bytes,
                          }),
                        'Foto caricata con successo.',
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
                  <Text style={styles.categoryEmpty}>Nessuna foto in questa categoria.</Text>
                ) : (
                  <View style={styles.photoGrid}>
                    {categoryPhotos.map((photo) => (
                      <View key={photo.id} style={styles.photoCard}>
                        <Pressable
                          disabled={!photo.signedUrl || busyKey !== null}
                          onPress={() => openPreview(photo)}
                        >
                          {photo.signedUrl ? (
                            <Image
                              source={{ uri: photo.signedUrl }}
                              style={styles.thumbnail}
                              contentFit="cover"
                              transition={200}
                              cachePolicy="disk"
                            />
                          ) : (
                            <View style={[styles.thumbnail, styles.imageUnavailable]}>
                              <Text style={styles.categoryEmpty}>Anteprima non disponibile</Text>
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
                                (bytes) => replacePhoto(photo, bytes),
                                'Foto sostituita con successo.',
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
        </View>
      ))}

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

const styles = StyleSheet.create({
  container: { marginTop: 24, marginBottom: 40 },
  sectionTitle: {
    fontSize: 20,
    color: UI.accent,
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
    borderColor: UI.border,
    backgroundColor: UI.cardBg,
  },
  checkupTitle: {
    marginBottom: 12,
    fontSize: 16,
    color: UI.text,
    fontFamily: GraphitFonts.GraphitBold,
  },
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
    backgroundColor: UI.accent,
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
    borderColor: UI.border,
    backgroundColor: UI.miniCardBg,
  },
  thumbnail: { width: '100%', height: 130, backgroundColor: UI.miniCardBg },
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
    color: UI.accent,
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
