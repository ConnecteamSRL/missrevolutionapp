import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MasonryList from '@react-native-seoul/masonry-list';
import ImageViewing from 'react-native-image-viewing';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CheckupPhotoItem, useCheckupPhotos } from '@/src/hooks/progress/useCheckupPhotos';
import { GraphitFonts } from '@/src/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const UI = {
  background: '#FCF0FB',
  cardBg: '#FFD7E8',
  miniCardBg: '#FFE7F1',
  border: '#FFD1E4',
  text: '#1F1F1F',
  muted: '#545454',
  accent: '#ED5192',
  white: '#FFFFFF',
};

interface CheckupPhotosGalleryProps {
  userId: string | undefined;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

export const CheckupPhotosGallery: React.FC<CheckupPhotosGalleryProps> = ({ userId }) => {
  const insets = useSafeAreaInsets();

  const { photos, isLoading, error } = useCheckupPhotos(userId);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [viewerVisible, setViewerVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const sortedPhotos = useMemo(() => {
    const valid = photos.filter((p) => p.signedUrl);
    return valid.sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });
  }, [photos, sortOrder]);

  const viewerImages = useMemo(
    () => sortedPhotos.map((p) => ({ uri: p.signedUrl! })),
    [sortedPhotos],
  );

  const handleOpenImage = (item: CheckupPhotoItem) => {
    const index = sortedPhotos.findIndex((p) => p.id === item.id);
    if (index >= 0) {
      setCurrentImageIndex(index);
      setViewerVisible(true);
    }
  };

  const renderItem = ({ item, i }: { item: unknown; i?: number }) => {
    const photoItem = item as CheckupPhotoItem;
    const index = i ?? 0;
    const isEven = index % 2 === 0;

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 50).duration(500)}
        style={[styles.photoContainer, { marginLeft: isEven ? 0 : 8, marginRight: isEven ? 8 : 0 }]}
      >
        <Pressable onPress={() => handleOpenImage(photoItem)}>
          <Image
            source={{ uri: photoItem.signedUrl! }}
            style={styles.thumbnail}
            contentFit="cover"
            transition={300}
            cachePolicy="disk"
          />
          <View style={styles.metaBadge}>
            <Text style={styles.metaText}>{formatDate(photoItem.created_at)}</Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={'#C388F0'} />
      </View>
    );
  }

  if (error) return null;
  if (sortedPhotos.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>Galleria Progressi</Text>
        </View>

        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
        >
          <Text style={styles.sortText}>
            {sortOrder === 'desc' ? 'Più recenti' : 'Meno recenti'}
          </Text>
          <Text style={{ fontSize: 12, color: UI.accent }}>{sortOrder === 'desc' ? '↓' : '↑'}</Text>
        </TouchableOpacity>
      </View>

      <MasonryList
        data={sortedPhotos}
        keyExtractor={(item): string => (item as CheckupPhotoItem).id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        scrollEnabled={false}
      />

      <ImageViewing
        images={viewerImages}
        imageIndex={currentImageIndex}
        visible={viewerVisible}
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
            <Pressable
              onPress={() => setViewerVisible(false)}
              hitSlop={12}
              style={styles.viewerCloseBtn}
            >
              <Text style={styles.viewerCloseText}>Chiudi</Text>
            </Pressable>
          </View>
        )}
        FooterComponent={({ imageIndex }) => (
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
              {formatDate(sortedPhotos[imageIndex].created_at)}
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 40,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    color: UI.accent,
    fontFamily: GraphitFonts.GraphitBold,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: UI.miniCardBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: UI.border,
  },
  sortText: {
    fontSize: 12,
    color: UI.muted,
    fontFamily: GraphitFonts.GraphitMedium,
  },
  listContent: {
    paddingBottom: 20,
  },
  photoContainer: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: UI.white,
    borderWidth: 1,
    borderColor: UI.border,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  thumbnail: {
    width: '100%',
    height: 200,
    backgroundColor: UI.miniCardBg,
  },
  metaBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backdropFilter: 'blur(10px)',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  metaText: {
    fontSize: 11,
    fontFamily: GraphitFonts.GraphitMedium,
    color: UI.text,
  },
  viewerHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  viewerCloseBtn: {
    backgroundColor: 'rgba(237, 81, 146, 0.4)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  viewerCloseText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: GraphitFonts.GraphitMedium,
  },
  viewerFooter: {
    alignItems: 'center',
    paddingTop: 20,
  },
  viewerFooterText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: GraphitFonts.GraphitMedium,
  },
});
