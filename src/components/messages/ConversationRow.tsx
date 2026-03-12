import { File as FileIcon, Image as ImageIcon, Mic, Video } from 'lucide-react-native';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { colors } from '../../theme/colors';
import type { Conversation, PresenceStatus, UserSnippet } from '../../types/messaging.types';
import { formatRelativeDate } from '../../utils/formatters';
import { Avatar } from '../ui';
import { Text } from '../ui/Text';

interface Props {
  conversation: Conversation;
  myUserId: string;
  presenceMap: Record<string, PresenceStatus>;
  onPress: () => void;
}

export default function ConversationRow({ conversation, myUserId, presenceMap, onPress }: Props) {
  // Get the other participant
  const otherParticipant = conversation.participants.find((p) => {
    const uid = typeof p.user === 'string' ? p.user : (p.user as UserSnippet)?._id;
    return uid !== myUserId;
  });

  const otherUser =
    typeof otherParticipant?.user === 'object' ? (otherParticipant.user as UserSnippet) : null;

  const otherId =
    typeof otherParticipant?.user === 'string' ? otherParticipant.user : otherUser?._id || '';

  const firstName = otherUser?.profile?.first_name || '';
  const lastName = otherUser?.profile?.last_name || '';
  const photo = otherUser?.profile?.profile_photo;
  const isSpecialist = otherUser?.user_type === 'Specialist';
  const displayName = isSpecialist
    ? `Dr. ${firstName} ${lastName}`.trim()
    : `${firstName} ${lastName}`.trim() || 'User';

  const unreadCount = conversation.unread_counts?.[myUserId] || 0;
  const isOnline = presenceMap[otherId] === 'online';
  const lastMsg = conversation.last_message;

  const getLastMessagePreview = () => {
    if (!lastMsg) return 'No messages yet';
    const isMyMsg = lastMsg.sender === myUserId;
    const prefix = isMyMsg ? 'You: ' : '';

    switch (lastMsg.type) {
      case 'image':
        return `${prefix}Sent a photo`;
      case 'file':
        return `${prefix}Sent a file`;
      case 'voice_note':
        return `${prefix}Voice note`;
      case 'video':
        return `${prefix}Sent a video`;
      case 'system':
        return lastMsg.content;
      default:
        return `${prefix}${lastMsg.content || ''}`;
    }
  };

  const getMessageIcon = () => {
    if (!lastMsg) return null;
    switch (lastMsg.type) {
      case 'image':
        return <ImageIcon size={12} color={colors.mutedForeground} />;
      case 'file':
        return <FileIcon size={12} color={colors.mutedForeground} />;
      case 'voice_note':
        return <Mic size={12} color={colors.mutedForeground} />;
      case 'video':
        return <Video size={12} color={colors.mutedForeground} />;
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: unreadCount > 0 ? `${colors.primary}06` : 'transparent',
      }}
    >
      {/* Avatar with presence dot */}
      <View>
        <Avatar uri={photo} firstName={firstName} lastName={lastName} size="md" />
        {isOnline && (
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: colors.success,
              borderWidth: 2,
              borderColor: colors.background,
            }}
          />
        )}
      </View>

      {/* Name + last message */}
      <View style={{ flex: 1 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text
            numberOfLines={1}
            style={{
              fontSize: 14,
              fontWeight: unreadCount > 0 ? '700' : '600',
              color: colors.foreground,
              flex: 1,
              marginRight: 8,
            }}
          >
            {displayName}
          </Text>
          {lastMsg?.sent_at && (
            <Text
              style={{
                fontSize: 11,
                color: unreadCount > 0 ? colors.primary : colors.mutedForeground,
                fontWeight: unreadCount > 0 ? '600' : '400',
              }}
            >
              {formatRelativeDate(lastMsg.sent_at)}
            </Text>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
          {getMessageIcon()}
          <Text
            numberOfLines={1}
            style={{
              fontSize: 12,
              color: unreadCount > 0 ? colors.foreground : colors.mutedForeground,
              fontWeight: unreadCount > 0 ? '500' : '400',
              flex: 1,
            }}
          >
            {getLastMessagePreview()}
          </Text>

          {/* Unread badge */}
          {unreadCount > 0 && (
            <View
              style={{
                minWidth: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 5,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '700', color: colors.white }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
