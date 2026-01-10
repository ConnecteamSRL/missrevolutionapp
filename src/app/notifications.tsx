import React, { useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import ContentScreenLayout from '@components/layouts/ContentScreenLayout';
import { colors, GraphitFonts } from '@/src/theme';
import Animated, { FadeIn } from 'react-native-reanimated';
import { formatDistanceToNow, isToday, isThisWeek, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { useNotifications } from '@/src/hooks/core/useNotifications';
import { Bell } from 'lucide-react-native';

export default function NotificationsScreen() {
  const { notifications, loading, refreshing, refresh, fetchNotifications, markAsRead } =
    useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const sections = useMemo(() => {
    const today: any[] = [];
    const thisWeek: any[] = [];
    const older: any[] = [];

    notifications.forEach((n) => {
      const date = parseISO(n.sent_at);
      if (isToday(date)) today.push(n);
      else if (isThisWeek(date)) thisWeek.push(n);
      else older.push(n);
    });

    const result: { title: string; data: any[] }[] = [];
    if (today.length > 0) result.push({ title: 'Oggi', data: today });
    if (thisWeek.length > 0) result.push({ title: 'Questa Settimana', data: thisWeek });
    if (older.length > 0) result.push({ title: 'Precedenti', data: older });

    return result;
  }, [notifications]);

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const date = parseISO(item.sent_at);
    const timeAgo = formatDistanceToNow(date, { addSuffix: true, locale: it });

    return (
      <Animated.View entering={FadeIn.delay(index * 50)}>
        <TouchableOpacity
          style={[styles.itemContainer, !item.is_read && styles.itemContainerUnread]}
          onPress={() => !item.is_read && markAsRead(item.id)}
          activeOpacity={0.85}
        >
          {!item.is_read && <View style={styles.unreadAccent} />}

          <View style={styles.iconCircle}>
            <Bell size={24} color={colors.secondary} />
          </View>

          <View style={styles.textContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>
              {!item.is_read && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>New</Text>
                </View>
              )}
            </View>

            <Text style={styles.body} numberOfLines={2}>
              {item.description}
            </Text>

            <Text style={styles.timeText}>{timeAgo}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  return (
    <ContentScreenLayout title="Notifiche">
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={colors.secondary} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={refresh}
          refreshing={refreshing}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nessuna notifica presente</Text>
            </View>
          }
        />
      )}
    </ContentScreenLayout>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 40,
  },
  sectionHeader: {
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  sectionHeaderText: {
    fontFamily: GraphitFonts.GraphitMedium,
    fontSize: 18,
    color: colors.secondary,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFE7F1',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD1E4',
    paddingVertical: 26,
    paddingHorizontal: 12,
    marginVertical: 6,
    shadowColor: 'rgba(204, 174, 227, 0.20)',
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  itemContainerUnread: {
    backgroundColor: '#FFE7F1',
    borderColor: '#FFB8D6',
  },
  unreadAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#ED5192',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFD1E4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: GraphitFonts.GraphitBold,
    fontSize: 15,
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  newBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFD1E4',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBadgeText: {
    fontFamily: GraphitFonts.GraphitMedium,
    fontSize: 10,
    color: '#ED5192',
  },
  body: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 13,
    color: 'rgba(31, 31, 31, 0.78)',
    marginBottom: 6,
    lineHeight: 18,
  },
  timeText: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 12,
    color: 'rgba(31, 31, 31, 0.55)',
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: GraphitFonts.GraphitRegular,
    color: 'rgba(31, 31, 31, 0.55)',
    fontSize: 16,
  },
});
