import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useUser } from '@/src/contexts/UserContext';
import { useUserMemberships, UserMembershipDetail } from '@/src/hooks/core/useUserMemberships';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, GraphitFonts } from '@/src/theme';
import React from 'react';

export default function MembershipsSection() {
  const { me } = useUser();
  const userId = me?.user_id;
  const { data, loading } = useUserMemberships(userId);

  const iconColor = (colors as any).secondary || '#ED5192';

  const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString('it-IT') : '∞');

  const renderMembershipItem = (item: UserMembershipDetail, index: number) => {
    const status = item.status_label;
    const planName = item.membership?.name || 'Piano sconosciuto';
    const period = `${fmt(item.start_date)} – ${fmt(item.end_date)}`;
    const isLast = index === data.length - 1;

    return (
      <View key={item.id} style={[styles.membershipBlock, !isLast && styles.separator]}>
        <View style={styles.infoGroup}>
          <Text style={styles.infoLabel}>Stato</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoText} numberOfLines={1}>
              {status}
            </Text>
            <View style={styles.iconBox}>
              <MaterialIcons name="verified" size={24} color={iconColor} />
            </View>
          </View>
        </View>

        <View style={styles.infoGroup}>
          <Text style={styles.infoLabel}>Nome piano</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoText} numberOfLines={1}>
              {planName}
            </Text>
            <View style={styles.iconBox}>
              <MaterialIcons name="assignment" size={24} color={iconColor} />
            </View>
          </View>
        </View>

        <View style={styles.infoGroup}>
          <Text style={styles.infoLabel}>Periodo</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoText} numberOfLines={1}>
              {period}
            </Text>
            <View style={styles.iconBox}>
              <MaterialIcons name="event" size={24} color={iconColor} />
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Dettagli Abbonamento</Text>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={'#C388F0'} />
        </View>
      ) : (
        <View style={styles.infoList}>
          {!data || data.length === 0 ? (
            <View style={styles.infoGroup}>
              <Text style={styles.infoLabel}>Membership</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoText}>Nessuna membership attiva</Text>
                <View style={styles.iconBox}>
                  <MaterialIcons name="card-membership" size={24} color={iconColor} />
                </View>
              </View>
            </View>
          ) : (
            data.map((item, index) => renderMembershipItem(item, index))
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderRadius: 30,
    backgroundColor: '#FFE7F1',
    borderWidth: 1,
    borderColor: '#FFD1E4',
    gap: 16,
  },
  loadingRow: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  infoList: {
    gap: 24,
  },
  membershipBlock: {
    gap: 14,
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: '#FFD1E4',
    paddingBottom: 24,
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
  sectionTitle: {
    fontSize: 16,
    color: '#ED5192',
    fontFamily: GraphitFonts.GraphitMedium,
    marginTop: 4,
    marginLeft: 6,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFE7F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
