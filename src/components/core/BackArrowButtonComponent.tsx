import { StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/src/theme';
import React from 'react';
import ArrowLeft from '@components/ui/icons/ArrowLeftIcon';
import { useRouter } from 'expo-router';

export default function BackArrowButtonComponent() {
  const router = useRouter();

  return (
    <TouchableOpacity style={styles.button} onPress={() => router.back()}>
      <ArrowLeft color={'#292D32'} size={25} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.white,
    padding: 10,
    borderRadius: 50,
    borderColor: colors.gray,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
