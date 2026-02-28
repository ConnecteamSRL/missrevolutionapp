import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import ContentScreenLayout from '@components/layouts/ContentScreenLayout';
import VideoSearchBar from '@components/video/VideoSearchBar';
import CategoryItem from '@components/video/CategoryItem';
import VideoCard from '@components/video/VideoCard';
import { GraphitFonts } from '@/src/theme';
import { VideoBreadcrumbItem, VideoItem } from '@mr-types/video.types';
import VideoBreadcrumbs from '@components/video/VideoBreadcrumbs';
import { useVideoPage } from '@/src/hooks/content/useVideoPage';

export default function VideoCategoryScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const { data, loading, refreshing, refresh, refetch, error } = useVideoPage(categoryId);
  const [searchText, setSearchText] = useState('');
  const isFirstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      refetch();
    }, [refetch]),
  );

  const handleBreadcrumbPress = (item: VideoBreadcrumbItem) => {
    if (item.slug === 'master') {
      router.dismissAll();
      router.replace('/video');
    } else {
      router.push({ pathname: '/video/[categoryId]', params: { categoryId: item.id } });
    }
  };

  const handleCategoryPress = (id: string) => {
    router.push({ pathname: '/video/[categoryId]', params: { categoryId: id } });
  };

  const handleVideoPress = (video: VideoItem) => {
    router.push({ pathname: '/(video)/[videoId]', params: { videoId: video.id } });
  };

  const filteredData = useMemo(() => {
    if (!data) return { categories: [], videos: [] };

    const lowerSearch = searchText.toLowerCase();

    const categories = data.children.filter((c) => c.name.toLowerCase().includes(lowerSearch));

    const videos = data.videos.filter((v) => v.title.toLowerCase().includes(lowerSearch));

    return { categories, videos };
  }, [data, searchText]);

  const renderContent = () => {
    if (loading && !refreshing && !data) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#C388F0" />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    if (!data) return null;

    const hasContent = filteredData.categories.length > 0 || filteredData.videos.length > 0;

    return (
      <FlatList
        data={filteredData.videos}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#C388F0" />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <VideoSearchBar
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Cerca categorie o video..."
            />

            <VideoBreadcrumbs items={data.breadcrumb} onPress={handleBreadcrumbPress} />

            {filteredData.categories.length > 0 && (
              <View style={styles.section}>
                {filteredData.categories.map((cat) => (
                  <CategoryItem key={cat.id} item={cat} onPress={handleCategoryPress} />
                ))}
              </View>
            )}

            {!hasContent && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Nessun contenuto trovato</Text>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => (
          <VideoCard video={item} categoryName={data.category.name} onPress={handleVideoPress} />
        )}
      />
    );
  };

  return (
    <ContentScreenLayout
      title={data?.category.slug === 'master' ? 'Video' : data?.category.name || 'Video'}
      showNotificationButton={true}
    >
      {renderContent()}
    </ContentScreenLayout>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContent: {
    paddingBottom: 40,
  },
  section: {
    marginBottom: 16,
  },
  errorText: {
    fontFamily: GraphitFonts.GraphitRegular,
    color: '#EF4444',
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: GraphitFonts.GraphitRegular,
    color: '#9CA3AF',
    fontSize: 16,
  },
});
