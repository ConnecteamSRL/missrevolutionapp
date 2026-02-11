import React from 'react';
import { View } from 'react-native';
import { useResponsive } from '@/src/hooks/core/useResponsive';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
}

export default function ResponsiveContainer({ children, maxWidth }: ResponsiveContainerProps) {
  const { isTablet, contentMaxWidth } = useResponsive();

  if (!isTablet) return <>{children}</>;

  return (
    <View style={{ maxWidth: maxWidth ?? contentMaxWidth, alignSelf: 'center', width: '100%' }}>
      {children}
    </View>
  );
}
