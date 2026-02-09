import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  ImageBackground,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { VolumeX, Volume2 } from 'lucide-react-native';
import { colors, GraphitFonts } from '@/src/theme';
import { useUser } from '@/src/contexts/UserContext';
import { supabase } from '@/src/lib/supabase';
import { useGymEditorial } from '@/src/hooks/content/useGymEditorial';
import { getCachedBannerUri } from '@/src/utils/bannerCache';

const VIDEO_EXTENSIONS = ['.mp4'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

function getMediaType(key: string): 'video' | 'image' | null {
  const lower = key.toLowerCase();
  if (VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext))) return 'video';
  if (IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))) return 'image';
  return null;
}

export default function HomeBannerComponent() {
  const { me } = useUser();
  const { config, isLoading: isConfigLoading } = useGymEditorial(me?.gym?.id);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [cachedUri, setCachedUri] = useState<string | null>(null);
  const [isCaching, setIsCaching] = useState(false);
  const cacheRequestRef = useRef(0);

  const armImage = require('../../../assets/images/misc/arm.png');

  const bannerUrl = useMemo(() => {
    if (config?.banner_key) {
      return supabase.storage.from('editorial').getPublicUrl(config.banner_key).data.publicUrl;
    }
    return null;
  }, [config?.banner_key]);

  const mediaType = useMemo(() => {
    if (!config?.banner_key) return null;
    return getMediaType(config.banner_key);
  }, [config?.banner_key]);

  useEffect(() => {
    if (!config?.banner_key || !bannerUrl) {
      setCachedUri(null);
      return;
    }
    const requestId = ++cacheRequestRef.current;
    setIsCaching(true);
    getCachedBannerUri(config.banner_key, bannerUrl).then((uri) => {
      if (requestId === cacheRequestRef.current) {
        setCachedUri(uri);
        setIsCaching(false);
      }
    });
  }, [config?.banner_key, bannerUrl]);

  const player = useVideoPlayer(mediaType === 'video' && cachedUri ? cachedUri : null, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    if (!player) return;
    player.muted = isMuted;
  }, [player, isMuted]);

  useEffect(() => {
    if (!player) return;
    const sub = player.addListener('statusChange', (payload) => {
      if (payload.status === 'readyToPlay') {
        setIsVideoReady(true);
      }
    });
    return () => sub.remove();
  }, [player]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const isImageBanner = mediaType === 'image';
  const isVideoBanner = mediaType === 'video';
  const isLoading =
    isConfigLoading ||
    isCaching ||
    (isImageBanner && !!cachedUri && isImageLoading) ||
    (isVideoBanner && !isVideoReady);

  const renderTextContent = () => (
    <View style={homeStyle.textWrapper}>
      <Text style={homeStyle.title}>Rifletti. Migliora.{'\n'}Ripeti.</Text>
      <Text style={homeStyle.subtitle}>Rimani consapevole delle tue abitudini.</Text>
    </View>
  );

  const renderBannerContent = () => {
    if (isVideoBanner && cachedUri && player) {
      return (
        <View style={homeStyle.bannerFull}>
          <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            nativeControls={false}
            contentFit="cover"
          />
          <Pressable
            onPress={toggleMute}
            style={homeStyle.muteButton}
            hitSlop={12}
            accessibilityLabel={isMuted ? 'Attiva audio' : 'Disattiva audio'}
            accessibilityRole="button"
          >
            {isMuted ? (
              <VolumeX size={18} color={colors.white} />
            ) : (
              <Volume2 size={18} color={colors.white} />
            )}
          </Pressable>
        </View>
      );
    }

    if (isImageBanner && cachedUri) {
      return (
        <ImageBackground
          source={{ uri: cachedUri }}
          style={homeStyle.bannerFull}
          imageStyle={homeStyle.bannerImageCover}
          onLoadStart={() => setIsImageLoading(true)}
          onLoadEnd={() => setIsImageLoading(false)}
        />
      );
    }

    return (
      <View style={homeStyle.bannerFallback}>
        {renderTextContent()}
        <View style={homeStyle.imageWrapperFallback}>
          <Image source={armImage} style={homeStyle.imageFallback} />
        </View>
      </View>
    );
  };

  return (
    <View style={homeStyle.container}>
      {isLoading && (
        <View style={[StyleSheet.absoluteFill, homeStyle.skeleton]}>
          <ActivityIndicator color={colors.white} />
        </View>
      )}
      {renderBannerContent()}
    </View>
  );
}

const homeStyle = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 180,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.primary,
    position: 'relative',
  },
  skeleton: {
    backgroundColor: colors.primary,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerFull: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  bannerImageCover: {
    resizeMode: 'cover',
  },
  muteButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerFallback: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 45,
    paddingLeft: 20,
    backgroundColor: colors.primary,
  },
  imageWrapperFallback: {
    position: 'absolute',
    right: -20,
    top: 30,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 0,
  },
  imageFallback: {
    width: 170,
    height: 250,
    resizeMode: 'contain',
  },
  textWrapper: {
    maxWidth: '70%',
    flexDirection: 'column',
    gap: 9,
    zIndex: 1,
  },
  title: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 22,
    color: colors.white,
  },
  subtitle: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 16,
    lineHeight: 20,
    color: colors.white,
  },
});
