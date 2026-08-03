import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import TabScrollLayout from '@components/layouts/TabScrollLayout';
import HomeBannerComponent from '@components/home/HomeBannerComponent';
import HomeCtaSection from '@components/home/HomeCtaSection';
import HomeWeightCard from '@components/home/HomeWeightCard';
import { useUser } from '@/src/contexts/UserContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useLatestCheckup } from '@/src/hooks/progress/useLatestCheckup';

const HomeScreen: React.FC = () => {
  const theme = useTheme();
  const { me, isUserLoading } = useUser();
  const {
    latestCheckup,
    isLoading: isCheckupLoading,
    error: checkupError,
  } = useLatestCheckup(me?.user_id);

  // Il check-up si aspetta solo se c'e' davvero un profilo da cui prendere
  // l'id: useLatestCheckup senza userId resta "in caricamento" per sempre, e
  // senza questa condizione un profilo che non arriva lasciava la home a
  // girare la rotella all'infinito, senza mai dire cosa fosse successo.
  const isLoadingData = isUserLoading || (!!me && isCheckupLoading);

  if (isLoadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.accent} />
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

  // Profilo assente a caricamento finito: e' un errore, non una schermata
  // vuota. Prima si usciva con null e restava una pagina bianca muta.
  if (!me) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Errore nel caricamento dati: Riprova più tardi.</Text>
      </View>
    );
  }

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
