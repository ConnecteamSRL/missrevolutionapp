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
import { useTheme } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@mr-types/theme.types';
import { useUser } from '@/src/contexts/UserContext';
import { supabase } from '@/src/lib/supabase';
import { useAppConfig } from '@/src/contexts/AppConfigContext';
import { getCachedBannerUri } from '@/src/utils/bannerCache';

const VIDEO_EXTENSIONS = ['.mp4'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// Oltre questo tempo si smette di aspettare il banner e si mostra il ripiego.
// Il banner e' decorativo: una grafica di riserva vale sempre piu' di una
// rotella che gira per sempre. Lo scaricamento non viene interrotto, quindi se
// arriva tardi resta in cache e al prossimo avvio si vede subito.
const MAX_ATTESA_MS = 10000;

function getMediaType(key: string): 'video' | 'image' | null {
  const lower = key.toLowerCase();
  if (VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext))) return 'video';
  if (IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))) return 'image';
  return null;
}

export default function HomeBannerComponent() {
  const theme = useTheme();
  const homeStyle = useMemo(() => makeStyles(theme), [theme]);
  const { me } = useUser();
  const { config, isLoading: isConfigLoading } = useAppConfig();
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [cachedUri, setCachedUri] = useState<string | null>(null);
  const [isCaching, setIsCaching] = useState(false);
  const [rinunciato, setRinunciato] = useState(false);
  const cacheRequestRef = useRef(0);

  const armImage = require('../../../assets/images/misc/arm.png');

  // Il banner e' del brand, non della palestra: arriva dalla configurazione
  // globale (app_config). Solo gli utenti "maschio" vedono la variante
  // maschile, e solo se e' stata caricata: altrimenti vale quella predefinita.
  const bannerKey = useMemo(() => {
    if (!config) return null;
    if (me?.profile?.gender === 'maschio' && config.banner_key_male) {
      return config.banner_key_male;
    }
    return config.banner_key;
  }, [config, me?.profile?.gender]);

  const bannerUrl = useMemo(() => {
    if (bannerKey) {
      return supabase.storage.from('editorial').getPublicUrl(bannerKey).data.publicUrl;
    }
    return null;
  }, [bannerKey]);

  const mediaType = useMemo(() => {
    if (!bannerKey) return null;
    return getMediaType(bannerKey);
  }, [bannerKey]);

  const isImageBanner = mediaType === 'image';
  const isVideoBanner = mediaType === 'video';

  useEffect(() => {
    // Banner nuovo: si riparte da capo, compresa l'eventuale rinuncia
    // precedente e lo stato di caricamento del media.
    setRinunciato(false);
    setIsImageLoading(true);
    setIsVideoReady(false);

    if (!bannerKey || !bannerUrl) {
      setCachedUri(null);
      setIsCaching(false);
      return;
    }
    const requestId = ++cacheRequestRef.current;
    setIsCaching(true);
    getCachedBannerUri(bannerKey, bannerUrl)
      .then((uri) => {
        if (requestId === cacheRequestRef.current) {
          setCachedUri(uri);
          setIsCaching(false);
        }
      })
      // Oggi getCachedBannerUri non rifiuta mai, ma senza questo ramo basta un
      // domani perche' isCaching resti acceso e la rotella non si fermi piu'.
      .catch(() => {
        if (requestId === cacheRequestRef.current) {
          setCachedUri(null);
          setIsCaching(false);
        }
      });
  }, [bannerKey, bannerUrl]);

  const staAspettando =
    isConfigLoading ||
    isCaching ||
    (isImageBanner && !!cachedUri && isImageLoading) ||
    // Il `!!cachedUri` vale anche per il video: senza, un banner che punta a un
    // file inesistente non arriva mai a 'readyToPlay' e la rotella non si ferma
    // piu'. Se non c'e' nulla da riprodurre non c'e' nulla da attendere.
    (isVideoBanner && !!cachedUri && !isVideoReady);

  // Rete che si impianta a meta' scaricamento, file illeggibile, video che non
  // diventa mai riproducibile: i motivi per restare in attesa sono troppi per
  // coprirli uno per uno. Questo e' il freno di sicurezza che vale per tutti.
  useEffect(() => {
    if (!staAspettando || rinunciato) return;
    const timer = setTimeout(() => setRinunciato(true), MAX_ATTESA_MS);
    return () => clearTimeout(timer);
  }, [staAspettando, rinunciato]);

  // Dopo la rinuncia il banner si considera non disponibile: il ripiego prende
  // il suo posto e la rotella si spegne.
  const bannerUri = rinunciato ? null : cachedUri;
  const isLoading = staAspettando && !rinunciato;

  const player = useVideoPlayer(isVideoBanner && bannerUri ? bannerUri : null, (p) => {
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
      // Un video che va in errore non arrivera' mai a 'readyToPlay': senza
      // questo ramo si aspetterebbe fino al freno di sicurezza per niente.
      if (payload.status === 'error') {
        setCachedUri(null);
      }
    });
    return () => sub.remove();
  }, [player]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const renderTextContent = () => (
    <View style={homeStyle.textWrapper}>
      <Text style={homeStyle.title}>Rifletti. Migliora.{'\n'}Ripeti.</Text>
      <Text style={homeStyle.subtitle}>Rimani consapevole delle tue abitudini.</Text>
    </View>
  );

  const renderBannerContent = () => {
    if (isVideoBanner && bannerUri && player) {
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

    if (isImageBanner && bannerUri) {
      return (
        <ImageBackground
          source={{ uri: bannerUri }}
          style={homeStyle.bannerFull}
          imageStyle={homeStyle.bannerImageCover}
          // Niente onLoadStart: su iOS arriva a volte DOPO onLoadEnd, e
          // rimettendo l'attesa a true dopo che l'immagine e' gia' comparsa
          // lasciava la rotella accesa per sempre. L'attesa parte gia' da true
          // e viene rimessa a true quando cambia il banner: non serve altro.
          onLoadEnd={() => setIsImageLoading(false)}
          // Immagine illeggibile o sparita: si passa subito al ripiego invece
          // di lasciare un rettangolo vuoto fino al freno di sicurezza.
          onError={() => {
            setIsImageLoading(false);
            setCachedUri(null);
          }}
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

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: '100%',
      minHeight: 180,
      borderRadius: 20,
      overflow: 'hidden',
      backgroundColor: theme.primary,
      position: 'relative',
    },
    skeleton: {
      backgroundColor: theme.primary,
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
      backgroundColor: theme.primary,
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
      color: theme.onPrimary,
    },
    subtitle: {
      fontFamily: GraphitFonts.GraphitRegular,
      fontSize: 16,
      lineHeight: 20,
      color: theme.onPrimary,
    },
  });
