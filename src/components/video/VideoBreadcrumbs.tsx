import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { VideoBreadcrumbItem } from '@mr-types/video.types';
import { ChevronRight, Home } from 'lucide-react-native';
import { colors, GraphitFonts } from '@/src/theme';
import { useTheme } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@mr-types/theme.types';

type Props = {
  items: VideoBreadcrumbItem[];
  onPress: (item: VideoBreadcrumbItem) => void;
};

export default function VideoBreadcrumbs({ items, onPress }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  if (!items || items.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isMaster = item.slug === 'master';

          return (
            <View key={item.id} style={styles.itemContainer}>
              <TouchableOpacity
                onPress={() => !isLast && onPress(item)}
                disabled={isLast}
                style={styles.touchable}
              >
                {isMaster ? (
                  <View style={styles.iconWrapper}>
                    <Home size={16} color={isLast ? theme.secondary : '#545454'} />
                  </View>
                ) : (
                  <Text style={[styles.text, isLast ? styles.textActive : styles.textInactive]}>
                    {item.name}
                  </Text>
                )}
              </TouchableOpacity>

              {!isLast && (
                <View style={styles.separator}>
                  <ChevronRight size={14} color={colors.textPlaceholder} />
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      marginBottom: 12,
      height: 40,
    },
    scrollContent: {
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    touchable: {
      paddingVertical: 4,
      paddingHorizontal: 4,
    },
    iconWrapper: {
      paddingTop: 2,
    },
    text: {
      fontSize: 14,
      fontFamily: GraphitFonts.GraphitRegular,
    },
    textInactive: {
      color: '#545454',
    },
    textActive: {
      color: theme.secondary,
      fontWeight: '600',
    },
    separator: {
      marginHorizontal: 2,
    },
  });
