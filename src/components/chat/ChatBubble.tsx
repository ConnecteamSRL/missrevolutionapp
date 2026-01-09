import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { colors, GraphitFonts } from '@/src/theme';
import { ChatMessage } from '@/src/types/chat.types';
import UserAvatarComponent from '@components/tab/UserAvatarComponent';

type Props = {
  message: ChatMessage;
  isMe: boolean;
  showMyAvatar?: boolean;
};

export const ChatBubble = ({ message, isMe, showMyAvatar = false }: Props) => {
  const isBot = !isMe && message.sender_type === 'bot';

  let senderLabel: string | null = null;
  if (isMe) senderLabel = 'Tu';
  else if (message.sender_type === 'operator') senderLabel = 'Operatore';
  else if (message.sender_type === 'bot') senderLabel = 'AI Bot';

  return (
    <Animated.View
      style={[styles.container, isMe ? styles.rightContainer : styles.leftContainer]}
      entering={FadeInUp.springify().damping(18).stiffness(150)}
      layout={Layout.springify().damping(18).stiffness(150)}
    >
      <View style={[styles.row, isMe ? styles.rowRight : styles.rowLeft]}>
        <View
          style={[
            styles.bubble,
            isMe ? styles.rightBubble : isBot ? styles.botBubble : styles.leftBubble,
          ]}
        >
          {senderLabel && (
            <Text
              style={[
                styles.senderLabel,
                isMe
                  ? styles.rightSenderLabel
                  : isBot
                    ? styles.botSenderLabel
                    : styles.leftSenderLabel,
              ]}
            >
              {senderLabel}
            </Text>
          )}
          <Text
            style={[
              styles.text,
              isMe ? styles.rightText : isBot ? styles.botText : styles.leftText,
            ]}
          >
            {message.content}
          </Text>
        </View>

        {isMe && showMyAvatar && (
          <View style={styles.myAvatar}>
            <UserAvatarComponent size={24} />
          </View>
        )}
      </View>

      <Text style={[styles.time, isMe ? styles.rightTime : styles.leftTime]}>
        {new Date(message.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  rightContainer: {
    alignItems: 'flex-end',
  },
  leftContainer: {
    alignItems: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  myAvatar: {
    marginBottom: 2,
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  rightBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 2,
  },
  leftBubble: {
    backgroundColor: '#FFD7E8',
    borderBottomLeftRadius: 2,
  },
  botBubble: {
    backgroundColor: colors.secondary,
    borderBottomLeftRadius: 2,
  },
  senderLabel: {
    fontSize: 10,
    fontFamily: GraphitFonts.GraphitBold,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  rightSenderLabel: {
    color: 'rgba(255,255,255,0.7)',
  },
  leftSenderLabel: {
    color: '#666',
  },
  botSenderLabel: {
    color: 'rgba(255,255,255,0.8)',
  },
  text: {
    fontSize: 15,
    fontFamily: GraphitFonts.GraphitRegular,
    lineHeight: 20,
  },
  rightText: {
    color: '#FFFFFF',
  },
  leftText: {
    color: '#000000',
  },
  botText: {
    color: '#FFFFFF',
  },
  time: {
    fontSize: 10,
    marginTop: 4,
    fontFamily: GraphitFonts.GraphitRegular,
  },
  rightTime: {
    color: 'rgba(0,0,0,0.4)',
    alignSelf: 'flex-end',
  },
  leftTime: {
    color: 'rgba(0,0,0,0.4)',
    alignSelf: 'flex-start',
  },
});
