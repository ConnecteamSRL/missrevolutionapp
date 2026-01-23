import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { VideoCategoryChild } from '@mr-types/video.types';
import { ChevronRight, LayoutGrid } from 'lucide-react-native';
import { GraphitFonts } from '@/src/theme';

type Props = {
  item: VideoCategoryChild;
  onPress: (id: string) => void;
};

export default function CategoryItem({ item, onPress }: Props) {
  const count = item.videos_count + item.children_count;
  const countLabel = count === 1 ? 'elemento' : 'elementi';

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.7} onPress={() => onPress(item.id)}>
      <View style={styles.iconContainer}>
        <LayoutGrid size={24} color="#ED5192" />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.subtitle}>
          {count} {countLabel}
        </Text>
      </View>

      <ChevronRight size={20} color="#B0A7AF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF0F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    color: '#363636',
    fontFamily: GraphitFonts.GraphitRegular,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: GraphitFonts.GraphitRegular,
  },
});
