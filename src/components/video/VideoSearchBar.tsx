import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import SearchIcon from '@components/ui/icons/SearchIcon';
import { GraphitFonts } from '@/src/theme';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useLayoutStretto } from '@/src/hooks/core/useLayoutStretto';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** Suggerimento corto per il testo ingrandito: quello intero andava a capo e il
   * campo, alto una riga, ne tagliava la seconda. Chi usa lo screen reader sente
   * comunque quello intero. */
  placeholderBreve?: string;
};

function VideoSearchBar({
  value,
  onChangeText,
  placeholder = 'Cerca categorie o video...',
  placeholderBreve = 'Cerca',
}: Props) {
  const theme = useTheme();
  const stretto = useLayoutStretto();

  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <SearchIcon size={20} color={theme.secondary} />
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={stretto ? placeholderBreve : placeholder}
        accessibilityLabel={placeholder}
        placeholderTextColor="#545454"
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
    </View>
  );
}

export default React.memo(VideoSearchBar);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  iconWrapper: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#545454',
    fontFamily: GraphitFonts.GraphitRegular,
  },
});
