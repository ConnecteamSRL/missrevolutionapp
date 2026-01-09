import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import NotificationButton from '@components/tab/NotificationButton';
import UserAvatarComponent from '@components/tab/UserAvatarComponent';
import { useRouter } from 'expo-router';

export default function HeaderTabComponent() {
  const logo = require('../../../assets/images/logo-ext.png');
  const router = useRouter();

  return (
    <View style={styles.headerContainer}>
      <Image source={logo} style={styles.logo} contentFit="contain" />
      <View style={styles.rightContainer}>
        <NotificationButton />
        <UserAvatarComponent onPress={() => router.push('/profile')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rightContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
  },
  logo: {
    width: 150,
    height: 55,
  },
});
