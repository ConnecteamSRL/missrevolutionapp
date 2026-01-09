import React, { useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View, ImageBackground, ActivityIndicator } from 'react-native';
import { colors, GraphitFonts } from '@/src/theme';
import { useUser } from '@/src/contexts/UserContext';
import { supabase } from '@/src/lib/supabase';
import { useGymEditorial } from '@/src/hooks/content/useGymEditorial';

export default function HomeBannerComponent() {
  const { me } = useUser();
  const { config, isLoading: isConfigLoading } = useGymEditorial(me?.gym?.id);
  const [isImageLoading, setIsImageLoading] = useState(true);

  const armImage = require('../../../assets/images/misc/arm.png');

  const bannerUrl = useMemo(() => {
    if (config?.banner_key) {
      return supabase.storage.from('editorial').getPublicUrl(config.banner_key).data.publicUrl;
    }
    return null;
  }, [config?.banner_key]);

  const isLoading = isConfigLoading || (!!bannerUrl && isImageLoading);

  const renderTextContent = () => (
    <View style={homeStyle.textWrapper}>
      <Text style={homeStyle.title}>Rifletti. Migliora.{'\n'}Ripeti.</Text>
      <Text style={homeStyle.subtitle}>Rimani consapevole delle tue abitudini.</Text>
    </View>
  );

  return (
    <View style={homeStyle.container}>
      {isLoading && (
        <View style={[StyleSheet.absoluteFill, homeStyle.skeleton]}>
          <ActivityIndicator color={colors.white} />
        </View>
      )}

      {bannerUrl ? (
        <ImageBackground
          source={{ uri: bannerUrl }}
          style={homeStyle.bannerFull}
          imageStyle={homeStyle.bannerImageCover}
          onLoadStart={() => setIsImageLoading(true)}
          onLoadEnd={() => setIsImageLoading(false)}
        />
      ) : (
        <View style={homeStyle.bannerFallback}>
          {renderTextContent()}
          <View style={homeStyle.imageWrapperFallback}>
            <Image source={armImage} style={homeStyle.imageFallback} />
          </View>
        </View>
      )}
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
