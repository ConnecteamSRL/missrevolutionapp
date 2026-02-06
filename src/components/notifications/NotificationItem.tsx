import React from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  interpolateColor,
  Extrapolation,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { Bell, Trash2, Eye } from 'lucide-react-native';
import { colors, GraphitFonts } from '@/src/theme';
import { NotificationItem as NotificationItemType } from '@/src/types/notification.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

type Props = {
  item: NotificationItemType;
  index: number;
  onDelete: (id: string) => void;
  onMarkAsRead: (id: string) => void;
};

export const NotificationItem = ({ item, index, onDelete, onMarkAsRead }: Props) => {
  const router = useRouter();
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(1);
  const containerOpacity = useSharedValue(1);
  const pressed = useSharedValue(0);

  const date = parseISO(item.sent_at);
  const timeAgo = formatDistanceToNow(date, { addSuffix: true, locale: it });

  const handleDelete = () => {
    onDelete(item.id);
  };

  const handleMarkAsRead = () => {
    if (!item.is_read) {
      onMarkAsRead(item.id);
    }
  };

  const handlePress = () => {
    router.push('/');
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onStart(() => {
      pressed.value = withTiming(0, { duration: 100 });
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_WIDTH, { duration: 200 });
        itemHeight.value = withTiming(0, { duration: 200 });
        containerOpacity.value = withTiming(0, { duration: 200 }, () => {
          runOnJS(handleDelete)();
        });
      } else if (event.translationX > SWIPE_THRESHOLD) {
        translateX.value = withSpring(0);
        runOnJS(handleMarkAsRead)();
      } else {
        translateX.value = withSpring(0);
      }
    });

  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      pressed.value = withTiming(1, { duration: 100 });
    })
    .onFinalize(() => {
      pressed.value = withTiming(0, { duration: 150 });
    })
    .onEnd(() => {
      runOnJS(handlePress)();
    });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const animatedItemStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: interpolate(pressed.value, [0, 1], [1, 0.97], Extrapolation.CLAMP) },
    ],
    backgroundColor: interpolateColor(pressed.value, [0, 1], ['#FFE7F1', '#FFD6E8']),
  }));

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scaleY: itemHeight.value }],
    marginVertical: interpolate(itemHeight.value, [0, 1], [0, 4], Extrapolation.CLAMP),
  }));

  const leftActionStyle = useAnimatedStyle(() => {
    const actionOpacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      opacity: actionOpacity,
    };
  });

  const rightActionStyle = useAnimatedStyle(() => {
    const actionOpacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP,
    );
    return {
      opacity: actionOpacity,
    };
  });

  return (
    <Animated.View entering={FadeIn.delay(index * 50)}>
      <Animated.View style={animatedContainerStyle}>
        <View style={styles.actionsContainer}>
          <Animated.View style={[styles.actionLeft, leftActionStyle]}>
            <Eye size={20} color="#fff" />
            <Text style={styles.actionText}>Leggi</Text>
          </Animated.View>
          <Animated.View style={[styles.actionRight, rightActionStyle]}>
            <Trash2 size={20} color="#fff" />
            <Text style={styles.actionText}>Elimina</Text>
          </Animated.View>
        </View>

        <GestureDetector gesture={composedGesture}>
          <Animated.View
            style={[
              styles.itemContainer,
              !item.is_read && styles.itemContainerUnread,
              animatedItemStyle,
            ]}
          >
            {!item.is_read && <View style={styles.unreadAccent} />}

            <View style={styles.iconCircle}>
              <Bell size={18} color={colors.secondary} />
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

              <Text style={styles.body} numberOfLines={1}>
                {item.description}
              </Text>

              <Text style={styles.timeText}>{timeAgo}</Text>
            </View>
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  actionsContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionLeft: {
    backgroundColor: '#4CAF50',
    height: '100%',
    width: '50%',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 20,
    borderRadius: 16,
  },
  actionRight: {
    backgroundColor: '#F44336',
    height: '100%',
    width: '50%',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
    borderRadius: 16,
  },
  actionText: {
    fontFamily: GraphitFonts.GraphitMedium,
    fontSize: 11,
    color: '#fff',
    marginTop: 2,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD1E4',
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: 'rgba(204, 174, 227, 0.20)',
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  itemContainerUnread: {
    borderColor: '#FFB8D6',
  },
  unreadAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#ED5192',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFD1E4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontFamily: GraphitFonts.GraphitBold,
    fontSize: 14,
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  newBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFD1E4',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBadgeText: {
    fontFamily: GraphitFonts.GraphitMedium,
    fontSize: 9,
    color: '#ED5192',
  },
  body: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 12,
    color: 'rgba(31, 31, 31, 0.78)',
    marginBottom: 2,
    lineHeight: 16,
  },
  timeText: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 11,
    color: 'rgba(31, 31, 31, 0.55)',
  },
});
