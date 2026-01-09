import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { GymVideoCategoryWithVideos } from '@mr-types/video.types';
import Badge from '@components/ui/Badge';

type Props = {
  categories: GymVideoCategoryWithVideos[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  showAllBadge?: boolean;
};

export default function VideoCategoryBadges({
  categories,
  selectedCategoryId,
  onSelectCategory,
  showAllBadge = true,
}: Props) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {showAllBadge && (
          <Badge
            label="Tutte"
            active={selectedCategoryId === null}
            onPress={() => onSelectCategory(null)}
          />
        )}

        {categories.map((cat) => (
          <Badge
            key={cat.id}
            label={cat.name}
            active={selectedCategoryId === cat.id}
            onPress={() => onSelectCategory(cat.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  content: {},
});
