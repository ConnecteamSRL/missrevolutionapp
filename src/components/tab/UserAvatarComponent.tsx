import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
  Dimensions,
  Platform,
} from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { SaveFormat } from 'expo-image-manipulator';
import { useActionSheet } from '@expo/react-native-action-sheet';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/src/theme';
import { useUser } from '@/src/contexts/UserContext';
import { clearAvatarCache, getCachedAvatarUrl } from '@/src/utils/avatar.utils';
import { supabase } from '@/src/lib/supabase';

type Props = {
  size?: number;
  onPress?: () => void;
  editable?: boolean;
};

const BUCKET_AVATARS = 'avatars' as const;
const UI_GENERIC_ERROR = 'Operazione non riuscita. Riprova.';
const MAX_SIZE = 800 * 1024;
const SIGNED_URL_TTL_SEC = 60 * 60;

export default function UserAvatarComponent({ size = 42, onPress, editable = false }: Props) {
  const { me, refetchMe } = useUser();
  const { showActionSheetWithOptions } = useActionSheet();
  const insets = useSafeAreaInsets();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showFullscreen, setShowFullscreen] = useState<boolean>(false);

  const placeholderAsset = require('../../../assets/images/misc/placeholder.jpg');

  const side = Math.round(size);
  const radius = side / 2;

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const key = me?.avatar?.key ?? null;
        const url = await getCachedAvatarUrl(key);
        if (alive) setAvatarUrl(url);
      } finally {
        if (alive) setIsLoading(false);
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, [me?.avatar?.key]);

  const pickerOptions = useMemo(() => {
    const compatibleMode = (ImagePicker as any)?.UIImagePickerPreferredAssetRepresentationMode
      ?.Compatible;

    return {
      mediaTypes: ['images'] as any,
      allowsEditing: true,
      aspect: [1, 1] as [number, number],
      quality: 1,
      exif: false,
      ...(compatibleMode ? { preferredAssetRepresentationMode: compatibleMode } : {}),
    };
  }, []);

  const handleViewAvatar = () => {
    if (onPress) onPress();
    else setShowFullscreen(true);
  };

  const handleChangeAvatar = async () => {
    try {
      if (!me?.user_id) {
        Alert.alert('Errore', UI_GENERIC_ERROR);
        return;
      }

      setIsLoading(true);

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permesso negato', 'Consenti l’accesso alle foto per cambiare avatar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      if (!asset?.uri) throw new Error('asset.uri missing');

      const { signedUrl } = await uploadAvatarOrThrow({
        userId: me.user_id,
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      });

      await clearAvatarCache();
      await refetchMe();
      setAvatarUrl(signedUrl);
    } catch (e) {
      console.error('[avatar] upload failed', e);
      Alert.alert('Errore', UI_GENERIC_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    Alert.alert('Elimina avatar', 'Sei sicuro di voler rimuovere la tua immagine del profilo?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: async () => {
          try {
            if (!me?.user_id) {
              Alert.alert('Errore', UI_GENERIC_ERROR);
              return;
            }

            setIsLoading(true);
            await deleteAvatarOrThrow({ userId: me.user_id });
            await clearAvatarCache();
            await refetchMe();
            setAvatarUrl(null);
          } catch (e) {
            console.error('[avatar] delete failed', e);
            Alert.alert('Errore', UI_GENERIC_ERROR);
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  const handlePress = () => {
    if (!editable) {
      onPress?.();
      return;
    }

    const hasAvatar = Boolean(me?.avatar?.key);

    const options = hasAvatar
      ? ['Visualizza avatar', 'Modifica avatar', 'Elimina avatar', 'Annulla']
      : ['Modifica avatar', 'Annulla'];

    const destructiveButtonIndex = hasAvatar ? 2 : undefined;
    const cancelButtonIndex = hasAvatar ? 3 : 1;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
        title: "Scegli un'azione",
        containerStyle:
          Platform.OS === 'android' ? { paddingBottom: Math.max(insets.bottom, 12) } : undefined,
      },
      (selectedIndex?: number) => {
        if (!hasAvatar) {
          if (selectedIndex === 0) void handleChangeAvatar();
          return;
        }
        if (selectedIndex === 0) handleViewAvatar();
        if (selectedIndex === 1) void handleChangeAvatar();
        if (selectedIndex === 2) void handleDeleteAvatar();
      },
    );
  };

  const imageSource: ImageSource = avatarUrl ? { uri: avatarUrl } : placeholderAsset;
  const recyclingKey = avatarUrl ?? 'placeholder';

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.container, { width: side, height: side, borderRadius: radius }]}
        onPress={handlePress}
        disabled={isLoading}
      >
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={'#C388F0'} />
          </View>
        ) : (
          <Image
            recyclingKey={recyclingKey}
            source={imageSource}
            placeholder={placeholderAsset}
            style={{ width: '100%', height: '100%', borderRadius: radius }}
            contentFit="cover"
            transition={250}
          />
        )}
      </TouchableOpacity>

      <Modal
        visible={showFullscreen}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFullscreen(false)}
      >
        <TouchableOpacity
          style={styles.fullscreenContainer}
          activeOpacity={1}
          onPress={() => setShowFullscreen(false)}
        >
          <Image source={imageSource} style={styles.fullscreenImage} contentFit="contain" />
        </TouchableOpacity>
      </Modal>
    </>
  );
}

async function deleteAvatarOrThrow(args: { userId: string }): Promise<void> {
  const { userId } = args;

  const { error } = await supabase.rpc('set_avatar_key', {
    p_user_id: userId,
    p_key: null,
  });

  if (error) throw error;
}

async function uploadAvatarOrThrow(args: {
  userId: string;
  uri: string;
  width?: number;
  height?: number;
}): Promise<{ objectName: string; signedUrl: string }> {
  const { userId, uri, width, height } = args;

  const { bytes } = await makeSquareJpegBytesUnderMaxBytes({
    uri,
    width,
    height,
    maxBytes: MAX_SIZE,
  });

  if (!bytes || bytes.byteLength === 0) throw new Error('avatar bytes are 0');

  const objectName = `${userId}/avatar-${Date.now()}.jpg`;
  const newKey = `${BUCKET_AVATARS}/${objectName}`;

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET_AVATARS)
    .upload(objectName, bytes, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadErr) throw uploadErr;

  const { error: rpcErr } = await supabase.rpc('set_avatar_key', {
    p_user_id: userId,
    p_key: newKey,
  });

  if (rpcErr) {
    await supabase.storage
      .from(BUCKET_AVATARS)
      .remove([objectName])
      .catch(() => {});
    throw rpcErr;
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from(BUCKET_AVATARS)
    .createSignedUrl(objectName, SIGNED_URL_TTL_SEC);

  if (signErr || !signed?.signedUrl) throw signErr ?? new Error('signedUrl missing');

  return { objectName, signedUrl: signed.signedUrl };
}

async function makeSquareJpegBytesUnderMaxBytes(args: {
  uri: string;
  width?: number;
  height?: number;
  maxBytes: number;
}): Promise<{ bytes: Uint8Array; uri: string }> {
  const { uri, width, height, maxBytes } = args;

  const cropRect =
    typeof width === 'number' &&
    typeof height === 'number' &&
    width > 0 &&
    height > 0 &&
    width !== height
      ? (() => {
          const s = Math.min(width, height);
          return {
            originX: Math.floor((width - s) / 2),
            originY: Math.floor((height - s) / 2),
            width: s,
            height: s,
          };
        })()
      : null;

  const attempts: { size: number; compress: number }[] = [
    { size: 1024, compress: 0.85 },
    { size: 1024, compress: 0.75 },
    { size: 900, compress: 0.7 },
    { size: 768, compress: 0.65 },
  ];

  let lastUri = uri;
  let lastBytes: Uint8Array | null = null;

  for (const a of attempts) {
    const ctx = ImageManipulator.ImageManipulator.manipulate(uri);
    if (cropRect) ctx.crop(cropRect);
    ctx.resize({ width: a.size, height: a.size });

    const ref = await ctx.renderAsync();
    const out = await ref.saveAsync({
      format: SaveFormat.JPEG,
      compress: a.compress,
      base64: true,
    });

    lastUri = out.uri;

    const b64 = out.base64 ?? '';
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }

    lastBytes = bytes;

    if (bytes.byteLength > 0 && bytes.byteLength <= maxBytes) {
      return { bytes, uri: out.uri };
    }
  }

  if (!lastBytes || lastBytes.byteLength === 0)
    throw new Error('failed to produce non-empty avatar bytes');

  return { bytes: lastBytes, uri: lastUri };
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderColor: colors.gray,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  loaderContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});
