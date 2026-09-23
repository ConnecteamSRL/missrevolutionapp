import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import { SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Camera, X } from 'lucide-react-native';
import { colors } from '@/src/theme';
import { useTheme } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@mr-types/theme.types';
import { FaqAgentDraft, FaqAgentImage } from '@mr-types/faqAgent.types';
import { ChatInput } from '@components/chat/ChatInput';

const MAX_PHOTO_SIDE = 1280;
const PHOTO_QUALITY = 0.7;

const alertPermission = (title: string, message: string) =>
  Alert.alert(title, message, [
    { text: 'Annulla', style: 'cancel' },
    { text: 'Apri Impostazioni', onPress: () => void Linking.openSettings() },
  ]);

// Lato lungo al massimo 1280 px, JPEG ~0.7, base64 per il servizio.
async function compressPhoto(asset: ImagePicker.ImagePickerAsset): Promise<FaqAgentImage> {
  const context = ImageManipulator.ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > MAX_PHOTO_SIDE) {
    context.resize(
      asset.width >= asset.height ? { width: MAX_PHOTO_SIDE } : { height: MAX_PHOTO_SIDE },
    );
  }
  const rendered = await context.renderAsync();
  const output = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: PHOTO_QUALITY,
    base64: true,
  });
  if (!output.base64) throw new Error('Compressed photo without base64');
  return { uri: output.uri, base64: output.base64 };
}

type Props = {
  /** True se il messaggio e' partito: solo allora il campo si svuota. */
  onSend: (draft: FaqAgentDraft) => Promise<boolean>;
  /** Foto ancora ammesse: i messaggi in attesa di risposta occupano posti. */
  maxImages: number;
};

export default function FaqAgentComposer({ onSend, maxImages }: Props) {
  const theme = useTheme();
  const themed = useMemo(() => makeStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { showActionSheetWithOptions } = useActionSheet();

  const [text, setText] = useState('');
  const [images, setImages] = useState<FaqAgentImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const canSend = (text.trim().length > 0 || images.length > 0) && !isProcessing;

  const addPhotos = async (source: 'camera' | 'library') => {
    const slots = maxImages - images.length;

    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        alertPermission(
          'Fotocamera non disponibile',
          'Per scattare una foto consenti l’accesso alla fotocamera dalle Impostazioni del telefono.',
        );
        return;
      }
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      quality: 1,
      exif: false,
    };
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync({
            ...options,
            allowsMultipleSelection: true,
            selectionLimit: slots,
          });
    if (result.canceled) return;

    setIsProcessing(true);
    try {
      const compressed = await Promise.all(result.assets.slice(0, slots).map(compressPhoto));
      setImages((prev) => [...prev, ...compressed].slice(0, maxImages));
    } catch (error) {
      if (__DEV__) console.error('[faq-agent] photo', error);
      Alert.alert('Errore', 'Non è stato possibile preparare la foto. Riprova.');
    } finally {
      setIsProcessing(false);
    }
  };

  const choosePhotoSource = () => {
    if (images.length >= maxImages) {
      Alert.alert(
        'Limite di foto raggiunto',
        'Puoi mandare al massimo 4 foto per domanda. Aspetta la risposta dell’assistente per mandarne altre.',
      );
      return;
    }
    showActionSheetWithOptions(
      {
        options: ['Scatta una foto', 'Scegli dalla galleria', 'Annulla'],
        cancelButtonIndex: 2,
        title: 'Allega una foto',
        containerStyle:
          Platform.OS === 'android' ? { paddingBottom: Math.max(insets.bottom, 12) } : undefined,
      },
      (selectedIndex?: number) => {
        if (selectedIndex === 0) void addPhotos('camera');
        if (selectedIndex === 1) void addPhotos('library');
      },
    );
  };

  // Testo e allegati restano nel campo se l'invio non parte (consenso negato).
  const handleSend = async () => {
    if (!canSend) return;
    setIsSending(true);
    const sent = await onSend({ text: text.trim(), images });
    setIsSending(false);
    if (!sent) return;
    setText('');
    setImages([]);
  };

  const preview =
    images.length > 0 ? (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={themed.previewScroll}
        contentContainerStyle={themed.previewRow}
        keyboardShouldPersistTaps="handled"
      >
        {images.map((image, index) => (
          <View key={`${image.uri}-${index}`} style={themed.previewThumbWrap}>
            <Image source={{ uri: image.uri }} style={themed.previewThumb} contentFit="cover" />
            <TouchableOpacity
              style={themed.removeButton}
              onPress={() => setImages((prev) => prev.filter((_, i) => i !== index))}
              accessibilityRole="button"
              accessibilityLabel={`Rimuovi la foto ${index + 1}`}
              hitSlop={8}
            >
              <X color={colors.white} size={12} strokeWidth={3} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    ) : null;

  const actions = isProcessing ? (
    <View style={themed.iconButton}>
      <ActivityIndicator size="small" color={theme.accent} />
    </View>
  ) : (
    <TouchableOpacity
      style={themed.iconButton}
      onPress={choosePhotoSource}
      accessibilityRole="button"
      accessibilityLabel="Allega una foto"
    >
      <Camera color={theme.secondary} size={22} />
    </TouchableOpacity>
  );

  return (
    <ChatInput
      onSend={handleSend}
      isLoading={isSending}
      value={text}
      onChangeText={setText}
      placeholder="Scrivi la tua domanda..."
      maxLength={1000}
      canSend={canSend}
      preview={preview}
      actions={actions}
    />
  );
}

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
    previewScroll: {
      marginBottom: 8,
    },
    previewRow: {
      gap: 8,
      alignItems: 'center',
      paddingTop: 6,
      paddingRight: 6,
    },
    previewThumbWrap: {
      width: 64,
      height: 64,
    },
    previewThumb: {
      width: 64,
      height: 64,
      borderRadius: 12,
      backgroundColor: theme.surface,
    },
    removeButton: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: 'rgba(0,0,0,0.65)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 2,
    },
  });
