import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import TabScrollLayout from '@components/layouts/TabScrollLayout';
import HomeBannerComponent from '@components/home/HomeBannerComponent';
import HomeCtaSection from '@components/home/HomeCtaSection';
import HomeWeightCard from '@components/home/HomeWeightCard';
import { useUser } from '@/src/contexts/UserContext';
import { useLatestCheckup } from '@/src/hooks/progress/useLatestCheckup';

const HomeScreen: React.FC = () => {
  const { me, isUserLoading } = useUser();
  const {
    latestCheckup,
    isLoading: isCheckupLoading,
    error: checkupError,
  } = useLatestCheckup(me?.user_id);

  const isLoadingData = isUserLoading || isCheckupLoading;

  if (isLoadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C388F0" />
      </View>
    );
  }

  if (checkupError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Errore nel caricamento dati: Riprova più tardi.</Text>
      </View>
    );
  }

  if (!me) return null;

  return (
    <TabScrollLayout>
      <View style={styles.container}>
        <HomeBannerComponent />
        <HomeCtaSection />
        <HomeWeightCard
          weight={latestCheckup?.weight_kg}
          objective={me.profile.current_objective}
        />
      </View>
    </TabScrollLayout>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
});
