import { StyleSheet, View } from 'react-native';
import GridCtaItem from './GridCtaItem';
import ChatCtaIcon from '@components/ui/icons/ChatCtaIcon';
import SurveyCtaIcon from '@components/ui/icons/SurveyCtaIcon';
import FaqCtaIcon from '@components/ui/icons/FaqCtaIcon';
import VideoCtaIcon from '@components/ui/icons/VideoCtaIcon';
import { useRouter } from 'expo-router';
import { useChatUnread } from '@/src/contexts/ChatUnreadContext';
import { useTheme } from '@/src/contexts/ThemeContext';

export default function HomeCtaSection() {
  const router = useRouter();
  const { unreadCount } = useChatUnread();
  const theme = useTheme();
  // Le quattro sfumature arrivano dal tema nello stesso ordine delle card.
  const [videoGradient, surveyGradient, faqGradient, chatGradient] = theme.ctaGradients;

  return (
    <View style={styles.gridContainer}>
      <View style={styles.row}>
        <View style={styles.itemWrapper}>
          <GridCtaItem
            title="Video"
            gradientColors={videoGradient}
            icon={<VideoCtaIcon size={20} />}
            onPress={() => router.push('/video')}
          />
        </View>
        <View style={styles.itemWrapper}>
          <GridCtaItem
            title="Survey"
            gradientColors={surveyGradient}
            icon={<SurveyCtaIcon size={20} />}
            onPress={() => router.push('/survey')}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.itemWrapper}>
          <GridCtaItem
            title="FAQs"
            gradientColors={faqGradient}
            icon={<FaqCtaIcon size={20} />}
            onPress={() => router.push('/faq')}
          />
        </View>
        <View style={styles.itemWrapper}>
          <GridCtaItem
            title="Chat"
            gradientColors={chatGradient}
            icon={<ChatCtaIcon size={20} />}
            onPress={() => router.push('/(chat)/chat')}
            badgeCount={unreadCount}
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
