import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, SectionList, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ContentScreenLayout from '@components/layouts/ContentScreenLayout';
import { colors, GraphitFonts } from '@/src/theme';
import { isToday, isThisWeek, parseISO } from 'date-fns';
import { useNotifications } from '@/src/hooks/core/useNotifications';
import { NotificationItem } from '@/src/components/notifications/NotificationItem';
import { NotificationItem as NotificationItemType } from '@/src/types/notification.types';

export default function NotificationsScreen() {
  const {
    notifications,
    loading,
    refreshing,
    refresh,
    fetchNotifications,
    markAsRead,
    deleteNotification,
  } = useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const sections = useMemo(() => {
    const today: NotificationItemType[] = [];
    const thisWeek: NotificationItemType[] = [];
    const older: NotificationItemType[] = [];

    notifications.forEach((n) => {
      const date = parseISO(n.sent_at);
      if (isToday(date)) today.push(n);
      else if (isThisWeek(date)) thisWeek.push(n);
      else older.push(n);
    });

    const result: { title: string; data: NotificationItemType[] }[] = [];
    if (today.length > 0) result.push({ title: 'Oggi', data: today });
    if (thisWeek.length > 0) result.push({ title: 'Questa Settimana', data: thisWeek });
    if (older.length > 0) result.push({ title: 'Precedenti', data: older });

    return result;
  }, [notifications]);

  const renderItem = ({ item, index }: { item: NotificationItemType; index: number }) => (
    <NotificationItem
      item={item}
      index={index}
      onDelete={deleteNotification}
      onMarkAsRead={markAsRead}
    />
  );

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  return (
    <ContentScreenLayout title="Notifiche">
      <GestureHandlerRootView style={styles.gestureRoot}>
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
      </GestureHandlerRootView>
    </ContentScreenLayout>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
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
