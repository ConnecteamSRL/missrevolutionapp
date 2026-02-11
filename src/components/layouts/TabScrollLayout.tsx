import React from 'react';
import { ScrollView } from 'react-native';
import ResponsiveContainer from '@components/layouts/ResponsiveContainer';
import { useResponsive } from '@/src/hooks/core/useResponsive';

interface TabScrollLayoutProps {
  children: React.ReactNode;
}

const TabScrollLayout: React.FC<TabScrollLayoutProps> = ({ children }) => {
  const { sp } = useResponsive();

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: sp(8),
      }}
    >
      <ResponsiveContainer>{children}</ResponsiveContainer>
    </ScrollView>
  );
};

export default TabScrollLayout;
