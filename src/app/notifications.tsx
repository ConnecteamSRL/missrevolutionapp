import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import ContentScreenLayout from '@components/layouts/ContentScreenLayout';
import { colors, GraphitFonts } from '@/src/theme';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useNotifications } from '@/src/hooks/core/useNotifications';

export default function NotificationsScreen() {
  const {
    notifications,
    loading,
    refreshing,
    refresh,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    unreadCount,
  } = useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    return (
      <Animated.View layout={LinearTransition} entering={FadeIn.delay(index * 50)}>
        <TouchableOpacity
          style={[styles.card, !item.is_read && styles.unreadCard]}
          onPress={() => !item.is_read && markAsRead(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              {!item.is_read && <View style={styles.dot} />}
              <Text style={[styles.title, !item.is_read && styles.unreadText]}>{item.title}</Text>
            </View>
            <Text style={styles.date}>
              {format(new Date(item.sent_at), 'dd MMM HH:mm', { locale: it })}
            </Text>
          </View>

          <Text style={styles.body}>{item.description}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <ContentScreenLayout title="Notifiche">
      <View style={styles.actionsContainer}>
        <Text style={styles.counter}>
          {unreadCount > 0 ? `${unreadCount} nuove` : 'Tutte lette'}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAll}>Segna tutte come lette</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={colors.secondary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={refresh}
          refreshing={refreshing}
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
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  counter: {
    fontFamily: GraphitFonts.GraphitRegular,
    color: colors.secondary,
    fontSize: 14,
  },
  markAll: {
    fontFamily: GraphitFonts.GraphitMedium,
    color: '#C388F0',
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  unreadCard: {
    backgroundColor: '#F9F5FF', // Leggero tint viola
    borderColor: '#EBD4FF',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C388F0',
    marginRight: 8,
  },
  title: {
    fontFamily: GraphitFonts.GraphitMedium,
    fontSize: 16,
    color: '#333',
  },
  unreadText: {
    fontFamily: GraphitFonts.GraphitBold,
  },
  date: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 12,
    color: '#999',
  },
  body: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: GraphitFonts.GraphitRegular,
    color: '#999',
    fontSize: 16,
  },
});
