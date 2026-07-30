import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { VideoCategoryChild } from '@mr-types/video.types';
import { ChevronRight, LayoutGrid } from 'lucide-react-native';
import { colors, GraphitFonts } from '@/src/theme';
import { useTheme } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@mr-types/theme.types';

type Props = {
  item: VideoCategoryChild;
  onPress: (id: string) => void;
};

export default function CategoryItem({ item, onPress }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const count = item.videos_count + item.children_count;
  const countLabel = count === 1 ? 'elemento' : 'elementi';

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.7} onPress={() => onPress(item.id)}>
      <View style={styles.iconContainer}>
        <LayoutGrid size={24} color={theme.secondary} />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.subtitle}>
          {count} {countLabel}
        </Text>
      </View>

      <ChevronRight size={20} color={colors.textPlaceholder} />
    </TouchableOpacity>
  );
}

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
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
      backgroundColor: theme.surface,
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
