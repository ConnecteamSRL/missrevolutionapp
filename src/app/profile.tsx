import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import UserAvatarComponent from '@components/tab/UserAvatarComponent';
import ContentScreenLayout from '@components/layouts/ContentScreenLayout';
import { useUser } from '@/src/contexts/UserContext';
import { colors, GraphitFonts } from '@/src/theme';
import { useAppUserProfile } from '@/src/hooks/core/useAppUserProfile';
import { MaterialIcons } from '@expo/vector-icons';
import MembershipsSection from '@components/core/MembershipsSection';
import { logout } from '@/src/hooks/auth/useLogout';

export default function Profile() {
  const { me } = useUser();
  const userId = me?.profile.user_id;
  const { data, loading } = useAppUserProfile(userId);
  const [signOutLoading, setSignOutLoading] = useState(false);

  const displayName =
    [data?.first_name, data?.last_name].filter(Boolean).join(' ') ||
    me?.profile.display_name ||
    data?.primary_email ||
    me?.profile.email ||
    'Utente';

  const address = [
    data?.address_line1,
    data?.address_line2,
    [data?.postal_code, data?.city].filter(Boolean).join(' '),
    data?.region,
  ]
    .filter(Boolean)
    .join(', ');

  const iconColor = (colors as any).secondary || colors.gray;

  const handleSignOut = async (): Promise<void> => {
    setSignOutLoading(true);
    try {
      await logout();
    } catch (e) {
      console.error('Error cleaning up local state:', e);
    } finally {
      setSignOutLoading(false);
    }
  };

  return (
    <ContentScreenLayout title="Profilo">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.avatarContainer}>
            <UserAvatarComponent size={80} editable={true} />
            <View>
              {loading ? (
                <ActivityIndicator size="small" color={'#C388F0'} />
              ) : (
                <Text style={styles.displayName}>{displayName}</Text>
              )}
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={'#C388F0'} />
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Informazioni personali</Text>
              <View style={styles.infoList}>
                <View style={styles.infoGroup}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoText} numberOfLines={1}>
                      {data?.primary_email || '-'}
                    </Text>
                    <View style={styles.iconBox}>
                      <MaterialIcons name="email" size={24} color={iconColor} />
                    </View>
                  </View>
                </View>

                <View style={styles.infoGroup}>
                  <Text style={styles.infoLabel}>Numero di telefono</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoText} numberOfLines={1}>
                      {data?.phone_number || '-'}
                    </Text>
                    <View style={styles.iconBox}>
                      <MaterialIcons name="phone" size={24} color={iconColor} />
                    </View>
                  </View>
                </View>

                <View style={styles.infoGroup}>
                  <Text style={styles.infoLabel}>Indirizzo</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoText} numberOfLines={2}>
                      {address || '-'}
                    </Text>
                    <View style={styles.iconBox}>
                      <MaterialIcons name="location-on" size={24} color={iconColor} />
                    </View>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>

        <MembershipsSection />

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={handleSignOut}
            disabled={signOutLoading}
            style={[styles.logoutButton, signOutLoading && { opacity: 0.7 }]}
            activeOpacity={0.8}
          >
            {signOutLoading ? (
              <ActivityIndicator size="small" color={'#C388F0'} />
            ) : (
              <View style={styles.logoutRow}>
                <MaterialIcons name="logout" size={20} color="#1F1F1F" />
                <Text style={styles.logoutText}>Logout</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ContentScreenLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 24,
    rowGap: 20,
  },
  container: {
    padding: 10,
    borderRadius: 30,
    backgroundColor: '#FFE7F1',
    borderWidth: 1,
    borderColor: '#FFD1E4',
    gap: 16,
  },
  avatarContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 24,
    padding: 16,
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  displayName: {
    color: colors.white,
    fontSize: 18,
    fontFamily: GraphitFonts.GraphitBold,
  },
  loadingRow: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    color: '#ED5192',
    fontFamily: GraphitFonts.GraphitMedium,
    marginTop: 4,
    marginLeft: 6,
  },
  infoList: {
    gap: 14,
  },
  infoGroup: {
    gap: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: '#565656',
    fontFamily: GraphitFonts.GraphitMedium,
    marginLeft: 6,
  },
  infoRow: {
    flexDirection: 'row',
    backgroundColor: '#FFD7E8',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD1E4',
    paddingLeft: 18,
    paddingTop: 12,
    paddingRight: 8,
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 60,
  },
  infoText: {
    flex: 1,
    fontSize: 16,
    color: '#1E1E1E',
    fontFamily: GraphitFonts.GraphitRegular,
    marginRight: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFE7F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 60,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: GraphitFonts.GraphitBold,
    color: '#1F1F1F',
  },
});
