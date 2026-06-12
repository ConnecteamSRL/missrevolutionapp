import React from 'react';
import { RefreshControlProps, ScrollView } from 'react-native';

interface TabScrollLayoutProps {
  children: React.ReactNode;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

const TabScrollLayout: React.FC<TabScrollLayoutProps> = ({ children, refreshControl }) => {
  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: 8,
      }}
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  );
};

export default TabScrollLayout;
