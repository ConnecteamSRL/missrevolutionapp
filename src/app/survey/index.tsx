import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import ContentScreenLayout from '@components/layouts/ContentScreenLayout';
import { useMySurveys } from '@/src/hooks/core/useSurveys';
import { router } from 'expo-router';
import SurveyList from '@components/survey/SurveyList';

export default function SurveyListScreen() {
  const { surveys, loading, refresh, refreshing, fetchSurveys } = useMySurveys();

  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  const handlePress = (surveyId: string, title: string) => {
    router.push({
      pathname: '/survey/[surveyId]',
      params: { surveyId, title },
    });
  };

  if (loading && !refreshing) {
    return (
      <ContentScreenLayout title="Survey">
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={'#C388F0'} />
        </View>
      </ContentScreenLayout>
    );
  }

  return (
    <ContentScreenLayout title="Survey" showNotificationButton={true}>
      <SurveyList
        surveys={surveys}
        refreshing={refreshing}
        onRefresh={refresh}
        onPressSurvey={handlePress}
      />
    </ContentScreenLayout>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
});
