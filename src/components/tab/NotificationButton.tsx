import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import NotificationIcon from '@components/ui/icons/NotificationIcon';
import { colors } from '@/src/theme';
import { router } from 'expo-router';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useUser } from '@/src/contexts/UserContext';
import { AppTheme } from '@mr-types/theme.types';
import { useAreaAperta } from '@/src/hooks/core/useAreaAperta';
import LucchettoBadge from '@components/core/LucchettoBadge';

export default function NotificationButton() {
  const { me } = useUser();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // Con l'accesso limitato le notifiche sono chiuse: al posto del pallino il
  // lucchetto, perche' un pallino che non si puo' mai azzerare inviterebbe
  // a toccare per niente.
  const aperte = useAreaAperta('notifiche');
  const hasNotification = aperte && (me?.notifications_to_read || 0) > 0;

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => router.push('/notifications')}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={
        !aperte
          ? 'Notifiche, richiede un abbonamento attivo'
          : hasNotification
            ? 'Notifiche, ci sono notifiche da leggere'
            : 'Notifiche'
      }
    >
      <View style={styles.iconWrapper}>
        <NotificationIcon color={'#6A717A'} size={25} />
        {hasNotification && <View style={styles.badge} />}
        {!aperte && <LucchettoBadge lato={16} style={styles.lucchetto} />}
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
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
    lucchetto: {
      top: -6,
      right: -7,
    },
    badge: {
      position: 'absolute',
      top: -2,
      right: 1,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.secondary,
      borderWidth: 1.5,
      borderColor: colors.white,
      zIndex: 2,
    },
  });
