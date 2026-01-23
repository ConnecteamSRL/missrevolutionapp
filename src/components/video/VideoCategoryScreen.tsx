import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import ContentScreenLayout from '@components/layouts/ContentScreenLayout';
import VideoSearchBar from '@components/video/VideoSearchBar';
import VideoBreadcrumbs from '@components/video/VideoBreadcrumbs';
import CategoryFolderItem from '@components/video/CategoryFolderItem';
import VideoCard from '@components/video/VideoCard';
import { GraphitFonts } from '@/src/theme';
import { VideoBreadcrumbItem, VideoItem } from '@mr-types/video.types';
import { useVideoPage } from '@/src/hooks/content/useVideoPage';

export default function VideoCategoryScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const { data, loading, refreshing, refresh, error } = useVideoPage(categoryId);
  const [searchText, setSearchText] = useState('');

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
    console.log('Open video', video.title);
  };

  const filteredData = useMemo(() => {
    if (!data) return { folders: [], videos: [] };

    const lowerSearch = searchText.toLowerCase();

    const folders = data.children.filter((c) => c.name.toLowerCase().includes(lowerSearch));

    const videos = data.videos.filter((v) => v.title.toLowerCase().includes(lowerSearch));

    return { folders, videos };
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

    const hasContent = filteredData.folders.length > 0 || filteredData.videos.length > 0;

    return (
      <FlatList
        data={filteredData.videos}
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
              placeholder="Cerca cartelle o video..."
            />

            <VideoBreadcrumbs items={data.breadcrumb} onPress={handleBreadcrumbPress} />

            {filteredData.folders.length > 0 && (
              <View style={styles.section}>
                {filteredData.folders.map((folder) => (
                  <CategoryFolderItem key={folder.id} item={folder} onPress={handleCategoryPress} />
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
