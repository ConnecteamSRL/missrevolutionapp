import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, StyleSheet, Text, View } from 'react-native';
import ContentScreenLayout from '@components/layouts/ContentScreenLayout';
import { useGymVideosByCategory } from '@/src/hooks/content/useGymVideosByCategory';
import { useUser } from '@/src/contexts/UserContext';
import VideoCategoryBadges from '@components/video/VideoCategoryBadges';
import VideoCard from '@components/video/VideoCard';
import { GymVideoCategoryWithVideos } from '@mr-types/video.types';
import VideoSearchBar from '@components/video/VideoSearchBar';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

type FlatVideoItem = {
  video: GymVideoCategoryWithVideos['videos'][number];
  categoryName: string;
  searchTitle: string;
};

export default function VideoLibraryScreen() {
  const { me } = useUser();
  const gymId = me?.gym?.id;

  const { data: categories, loading, error, refresh, refreshing } = useGymVideosByCategory(gymId);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const visibleCategories = useMemo(
    () => (selectedCategoryId ? categories.filter((c) => c.id === selectedCategoryId) : categories),
    [categories, selectedCategoryId],
  );

  const visibleVideos = useMemo<FlatVideoItem[]>(() => {
    const list: FlatVideoItem[] = [];
    visibleCategories.forEach((cat) => {
      cat.videos.forEach((video) => {
        list.push({
          video,
          categoryName: cat.name,
          searchTitle: video.title.toLowerCase(),
        });
      });
    });
    list.sort((a, b) =>
      a.video.title.localeCompare(b.video.title, undefined, {
        sensitivity: 'base',
      }),
    );
    return list;
  }, [visibleCategories]);

  const filteredVideos = useMemo<FlatVideoItem[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return visibleVideos;
    return visibleVideos.filter((item) => item.searchTitle.includes(q));
  }, [visibleVideos, searchQuery]);

  const handleOpenVideo = async (vimeoId: string) => {
    const vimeoUrl = `https://vimeo.com/${vimeoId}`;
    Alert.alert(
      'Aprire il video sul browser esterno?',
      vimeoUrl,
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'Apri',
          onPress: async () => {
            const supported = await Linking.canOpenURL(vimeoUrl);
            if (supported) {
              await Linking.openURL(vimeoUrl);
            } else {
              Alert.alert('Errore', 'Non è possibile aprire questo link.');
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  if (!gymId) {
    return (
      <ContentScreenLayout title="Libreria Video">
        <View style={styles.centered}>
          <Text>Nessuna palestra selezionata.</Text>
        </View>
      </ContentScreenLayout>
    );
  }

  if (loading && categories.length === 0) {
    return (
      <ContentScreenLayout title="Libreria Video">
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={'#C388F0'} />
          <Text style={styles.loadingText}>Caricamento video...</Text>
        </View>
      </ContentScreenLayout>
    );
  }

  if (error) {
    return (
      <ContentScreenLayout title="Libreria Video">
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Text onPress={refresh} style={styles.retryText}>
            Riprova
          </Text>
        </View>
      </ContentScreenLayout>
    );
  }

  return (
    <ContentScreenLayout title="Libreria Video">
      <VideoSearchBar value={searchQuery} onChangeText={setSearchQuery} />

      <VideoCategoryBadges
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
      />

      <FlatList
        data={filteredVideos}
        keyExtractor={(item) => item.video.id}
        onRefresh={refresh}
        refreshing={refreshing}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <Animated.View
            layout={LinearTransition.duration(180)}
            entering={FadeIn.duration(140).delay(index * 20)}
            exiting={FadeOut.duration(100)}
          >
            <VideoCard
              video={item.video}
              categoryName={item.categoryName}
              onPress={() => {
                if (!item.video.vimeo_id) return;
                handleOpenVideo(item.video.vimeo_id);
              }}
            />
          </Animated.View>
        )}
      />
    </ContentScreenLayout>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
  },
  errorText: {
    color: 'red',
  },
  retryText: {
    marginTop: 8,
    textDecorationLine: 'underline',
  },
  listContent: {
    paddingBottom: 24,
  },
});
