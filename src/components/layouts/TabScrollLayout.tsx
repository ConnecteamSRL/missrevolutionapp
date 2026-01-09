import React from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TabScrollLayoutProps {
  children: React.ReactNode;
}

const TabScrollLayout: React.FC<TabScrollLayoutProps> = ({ children }) => {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: 8,
        paddingBottom: insets.bottom + 16,
      }}
    >
      {children}
    </ScrollView>
  );
};

export default TabScrollLayout;
