import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Badge from '@components/ui/Badge';

export type FaqCategory = {
  id: string;
  name: string;
  position: number;
};

type Props = {
  categories: FaqCategory[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  showAllBadge?: boolean;
};

export default function FaqCategoryBadges({
  categories,
  selectedCategoryId,
  onSelectCategory,
  showAllBadge = true,
}: Props) {
  const sortedCategories = [...categories].sort((a, b) => a.position - b.position);

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

        {sortedCategories.map((cat) => (
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
