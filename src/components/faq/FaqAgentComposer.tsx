import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  RecordingOptions,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { File } from 'expo-file-system';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import { SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { AudioLines, Camera, Mic, Square, X } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors, GraphitFonts } from '@/src/theme';
import { useTheme } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@mr-types/theme.types';
import { FaqAgentAudio, FaqAgentDraft, FaqAgentImage } from '@mr-types/faqAgent.types';
import { ChatInput } from '@components/chat/ChatInput';
import { formatVoiceDuration } from '@components/faq/FaqAgentBubble';

const MAX_PHOTO_SIDE = 1280;
const PHOTO_QUALITY = 0.7;
const MAX_RECORDING_MS = 2 * 60 * 1000;

// AAC in contenitore .m4a su iOS e Android; mono a 64 kbps basta per la voce e
// tiene un vocale di 2 minuti sotto il mega.
const VOICE_RECORDING: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  numberOfChannels: 1,
  bitRate: 64000,
};

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

function RecordingDot() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.25, { duration: 600 }), -1, true);
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.recordingDot, style]} />;
}

type Props = {
  /** True se il messaggio e' partito: solo allora il campo si svuota. */
  onSend: (draft: FaqAgentDraft) => Promise<boolean>;
  /** Foto e vocali ancora ammessi: i messaggi in attesa di risposta occupano posti. */
  maxImages: number;
  maxAudios: number;
};

export default function FaqAgentComposer({ onSend, maxImages, maxAudios }: Props) {
  const theme = useTheme();
  const themed = useMemo(() => makeStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { showActionSheetWithOptions } = useActionSheet();

  const [text, setText] = useState('');
  const [images, setImages] = useState<FaqAgentImage[]>([]);
  const [audios, setAudios] = useState<FaqAgentAudio[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const recorder = useAudioRecorder(VOICE_RECORDING);
  const recorderState = useAudioRecorderState(recorder, 250);
  // Evita doppi stop (pulsante + limite dei 2 minuti + app in background).
  const recordingRef = useRef(false);

  const canSend =
    (text.trim().length > 0 || images.length > 0 || audios.length > 0) &&
    !isProcessing &&
    !isRecording;

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

  const startRecording = async () => {
    if (audios.length >= maxAudios) {
      Alert.alert(
        'Limite di vocali raggiunto',
        'Puoi mandare al massimo 3 vocali per domanda. Aspetta la risposta dell’assistente per mandarne altri.',
      );
      return;
    }

    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      alertPermission(
        'Microfono non disponibile',
        'Per registrare un vocale consenti l’accesso al microfono dalle Impostazioni del telefono.',
      );
      return;
    }

    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      recordingRef.current = true;
      setIsRecording(true);
    } catch (error) {
      if (__DEV__) console.error('[faq-agent] record', error);
      Alert.alert('Errore', 'Non è stato possibile avviare la registrazione. Riprova.');
      void setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    }
  };

  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) return;
    recordingRef.current = false;
    const durationMillis = Math.min(recorder.getStatus().durationMillis, MAX_RECORDING_MS);
    setIsRecording(false);
    setIsProcessing(true);

    try {
      await recorder.stop();
      if (!recorder.uri) throw new Error('Recording without uri');
      const base64 = await new File(recorder.uri).base64();
      // Un vocale vuoto il servizio lo rifiuta (422) e, accorpato, bloccherebbe i messaggi dopo.
      if (!base64) throw new Error('Empty recording');
      setAudios((prev) => [...prev, { base64, durationMillis }]);
    } catch (error) {
      if (__DEV__) console.error('[faq-agent] stop', error);
      Alert.alert('Errore', 'Non è stato possibile salvare il vocale. Riprova.');
    } finally {
      setIsProcessing(false);
      void setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    }
  }, [recorder]);

  // Limite dei 2 minuti: la registrazione si ferma e il vocale resta allegato.
  // Si rilegge lo stato dal recorder perche' quello campionato puo' essere
  // ancora quello del vocale precedente nei primi 250 ms.
  useEffect(() => {
    if (isRecording && recorder.getStatus().durationMillis >= MAX_RECORDING_MS) {
      void stopRecording();
    }
  }, [isRecording, recorder, recorderState.durationMillis, stopRecording]);

  // In background iOS interrompe il microfono: si chiude il vocale finche' e' valido.
  useEffect(() => {
    if (!isRecording) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') void stopRecording();
    });
    return () => subscription.remove();
  }, [isRecording, stopRecording]);

  // Uscendo dalla schermata mentre si registra il recorder viene rilasciato
  // dall'hook: si rimette la sessione audio in sola riproduzione.
  useEffect(
    () => () => {
      if (recordingRef.current) void setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    },
    [],
  );

  // Testo e allegati restano nel campo se l'invio non parte (consenso negato).
  const handleSend = async () => {
    if (!canSend) return;
    setIsSending(true);
    const sent = await onSend({ text: text.trim(), images, audios });
    setIsSending(false);
    if (!sent) return;
    setText('');
    setImages([]);
    setAudios([]);
  };

  const hasAttachments = images.length > 0 || audios.length > 0;

  const preview = hasAttachments ? (
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
      {audios.map((audio, index) => (
        <View key={`audio-${index}`} style={themed.previewVoice}>
          <AudioLines color={theme.secondary} size={16} />
          <Text style={themed.previewVoiceText}>
            Vocale · {formatVoiceDuration(audio.durationMillis)}
          </Text>
          <TouchableOpacity
            onPress={() => setAudios((prev) => prev.filter((_, i) => i !== index))}
            accessibilityRole="button"
            accessibilityLabel={`Rimuovi il vocale ${index + 1}`}
            hitSlop={8}
          >
            <X color={colors.textMuted} size={16} />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  ) : null;

  const recordingInfo = isRecording ? (
    <View style={themed.recordingInfo}>
      <RecordingDot />
      <Text style={themed.recordingText}>
        {formatVoiceDuration(recorderState.durationMillis)} /{' '}
        {formatVoiceDuration(MAX_RECORDING_MS)}
      </Text>
      <Text style={themed.recordingHint} numberOfLines={1}>
        Registrazione in corso
      </Text>
    </View>
  ) : null;

  const actions = (
    <>
      {!isRecording && (
        <TouchableOpacity
          style={themed.iconButton}
          onPress={choosePhotoSource}
          disabled={isProcessing}
          accessibilityRole="button"
          accessibilityLabel="Allega una foto"
        >
          <Camera color={theme.secondary} size={22} />
        </TouchableOpacity>
      )}
      {isProcessing ? (
        <View style={themed.iconButton}>
          <ActivityIndicator size="small" color={theme.accent} />
        </View>
      ) : (
        <TouchableOpacity
          style={[themed.iconButton, isRecording && themed.stopButton]}
          onPress={isRecording ? stopRecording : startRecording}
          accessibilityRole="button"
          accessibilityLabel={
            isRecording ? 'Ferma la registrazione' : 'Registra un messaggio vocale'
          }
        >
          {isRecording ? (
            <Square color={colors.white} fill={colors.white} size={14} />
          ) : (
            <Mic color={theme.secondary} size={22} />
          )}
        </TouchableOpacity>
      )}
    </>
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
      inputReplacement={recordingInfo}
    />
  );
}

const styles = StyleSheet.create({
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E53935',
  },
});

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
    previewVoice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      height: 40,
      paddingHorizontal: 12,
      borderRadius: 60,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    previewVoiceText: {
      color: colors.text,
      fontFamily: GraphitFonts.GraphitMedium,
      fontSize: 13,
    },
    // Stessa altezza del campo di testo di ChatInput, che qui sostituisce.
    recordingInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      height: 36,
      marginRight: 8,
    },
    recordingText: {
      color: colors.text,
      fontFamily: GraphitFonts.GraphitBold,
      fontSize: 14,
      fontVariant: ['tabular-nums'],
    },
    recordingHint: {
      flexShrink: 1,
      color: colors.textMuted,
      fontFamily: GraphitFonts.GraphitRegular,
      fontSize: 13,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 2,
    },
    stopButton: {
      backgroundColor: '#E53935',
    },
  });
