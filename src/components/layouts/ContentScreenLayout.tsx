import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackgroundGradientComponent from '@components/core/BackgroundGradientComponent';
import BackArrowButtonComponent from '@components/core/BackArrowButtonComponent';
import { colors, GraphitFonts } from '@/src/theme';
import NotificationButton from '@components/tab/NotificationButton';

interface ContentScreenLayoutProps {
  children: React.ReactNode;
  title?: string;
  showNotificationButton?: boolean;
}

export default function ContentScreenLayout({
  children,
  title,
  showNotificationButton,
}: ContentScreenLayoutProps) {
  return (
    <SafeAreaView style={styles.container}>
      <BackgroundGradientComponent />
      <View style={[styles.header]}>
        <BackArrowButtonComponent />
        {/* Due righe: con il testo ingrandito una sola riduceva il titolo a «Chat con St…». */}
        <Text style={styles.title} numberOfLines={2}>
          {title ?? 'Contenuto'}
        </Text>
        {showNotificationButton && <NotificationButton />}
      </View>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: {
    fontSize: 16,
    fontFamily: GraphitFonts.GraphitRegular,
    color: colors.text,
    marginRight: 'auto',
    flexShrink: 1,
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
});
