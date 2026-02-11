import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackgroundGradientComponent from '@components/core/BackgroundGradientComponent';
import BackArrowButtonComponent from '@components/core/BackArrowButtonComponent';
import { colors, GraphitFonts } from '@/src/theme';
import NotificationButton from '@components/tab/NotificationButton';
import ResponsiveContainer from '@components/layouts/ResponsiveContainer';
import { useResponsive } from '@/src/hooks/core/useResponsive';

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
  const { sp } = useResponsive();

  return (
    <SafeAreaView style={[styles.container, { padding: sp(16) }]}>
      <BackgroundGradientComponent />
      <ResponsiveContainer>
        <View style={[styles.header]}>
          <BackArrowButtonComponent />
          <Text style={styles.title}>{title ?? 'Contenuto'}</Text>
          {showNotificationButton && <NotificationButton />}
        </View>
        {children}
      </ResponsiveContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: {
    fontSize: 16,
    fontFamily: GraphitFonts.GraphitRegular,
    color: colors.text,
    marginRight: 'auto',
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
