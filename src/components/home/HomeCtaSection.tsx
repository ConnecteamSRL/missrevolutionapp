import { StyleSheet, View } from 'react-native';
import GridCtaItem from './GridCtaItem';
import ChatCtaIcon from '@components/ui/icons/ChatCtaIcon';
import SurveyCtaIcon from '@components/ui/icons/SurveyCtaIcon';
import FaqCtaIcon from '@components/ui/icons/FaqCtaIcon';
import VideoCtaIcon from '@components/ui/icons/VideoCtaIcon';
import { useRouter } from 'expo-router';

export default function HomeCtaSection() {
  const router = useRouter();
  return (
    <View style={styles.gridContainer}>
      <View style={styles.row}>
        <View style={styles.itemWrapper}>
          <GridCtaItem
            title="Video"
            gradientColors={['#E8B3E2', '#EFB4E9']}
            icon={<VideoCtaIcon size={20} />}
            onPress={() => router.push('/video')}
          />
        </View>
        <View style={styles.itemWrapper}>
          <GridCtaItem
            title="Survey"
            gradientColors={['#FFBFD3', '#FFBFD3']}
            icon={<SurveyCtaIcon size={20} />}
            onPress={() => router.push('/survey')}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.itemWrapper}>
          <GridCtaItem
            title="FAQs"
            gradientColors={['#FFB1E0', '#FFB1E0']}
            icon={<FaqCtaIcon size={20} />}
            onPress={() => router.push('/faq')}
          />
        </View>
        <View style={styles.itemWrapper}>
          <GridCtaItem
            title="Chat"
            gradientColors={['#FFCDBF', '#FFCDBF']}
            icon={<ChatCtaIcon size={20} />}
            onPress={() => router.push('/(chat)/chat')}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'column',
    gap: 16,
    width: '100%',
    marginTop: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  itemWrapper: {
    flex: 1,
  },
});
