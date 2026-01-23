import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import SearchIcon from '@components/ui/icons/SearchIcon';
import { GraphitFonts } from '@/src/theme';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

function VideoSearchBar({
  value,
  onChangeText,
  placeholder = 'Cerca categorie o video...',
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <SearchIcon size={20} color={'#ED5192'} />
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
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
