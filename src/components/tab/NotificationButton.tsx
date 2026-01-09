import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import NotificationIcon from '@components/ui/icons/NotificationIcon';
import { colors } from '@/src/theme';

export default function NotificationButton() {
  const [showNotifications, setShowNotifications] = useState<boolean>(true);

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => setShowNotifications(!showNotifications)}
      activeOpacity={0.7}
    >
      <View style={styles.iconWrapper}>
        <NotificationIcon color={'#6A717A'} size={25} />
        {showNotifications && <View style={styles.badge} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.white,
    padding: 10,
    borderRadius: 50,
    borderColor: colors.gray,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF5DA2',
    borderWidth: 1.5,
    borderColor: colors.white,
    zIndex: 2,
  },
});
