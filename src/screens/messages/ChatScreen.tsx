import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  Send,
  Paperclip,
  X,
  Image as ImageIcon,
  File as FileIcon,
  Camera,
} from 'lucide-react-native';
import {launchImageLibrary} from 'react-native-image-picker';

import {Header, Avatar} from '../../components/ui';
import MessageBubble from '../../components/messages/MessageBubble';
import TypingIndicator from '../../components/messages/TypingIndicator';
import {colors} from '../../theme/colors';
import {useMessagingStore} from '../../store/messaging';
import {useAuthStore} from '../../store/auth';
import {messagingService} from '../../services/messaging.service';
import {socketService} from '../../services/socket.service';
import type {Conversation, Message, UserSnippet} from '../../types/messaging.types';

export default function ChatScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {conversationId, conversation: initialConv} = route.params as {
    conversationId: string;
    conversation?: Conversation;
  };

  const myUserId = useAuthStore(s => s.user?._id) || '';
  const messages = useMessagingStore(s => s.messages[conversationId] || []);
  const hasMore = useMessagingStore(s => s.hasMoreMessages[conversationId] ?? true);
  const typingUsers = useMessagingStore(s => s.typingMap[conversationId] || []);
  const presenceMap = useMessagingStore(s => s.presenceMap);
  const fetchMessages = useMessagingStore(s => s.fetchMessages);
  const markConversationRead = useMessagingStore(s => s.markConversationRead);
  const deleteMessageLocal = useMessagingStore(s => s.deleteMessageLocal);

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const flatListRef = useRef<FlatList>(null);

  // Get partner info
  const otherParticipant = initialConv?.participants.find(p => {
    const uid = typeof p.user === 'string' ? p.user : (p.user as UserSnippet)?._id;
    return uid !== myUserId;
  });
  const otherUser =
    typeof otherParticipant?.user === 'object'
      ? (otherParticipant.user as UserSnippet)
      : null;
  const otherId =
    typeof otherParticipant?.user === 'string'
      ? otherParticipant.user
      : otherUser?._id || '';
  const isSpecialist = otherUser?.user_type === 'Specialist';
  const partnerName = otherUser
    ? isSpecialist
      ? `Dr. ${otherUser.profile?.first_name} ${otherUser.profile?.last_name || ''}`.trim()
      : `${otherUser.profile?.first_name} ${otherUser.profile?.last_name || ''}`.trim()
    : 'Chat';
  const partnerPhoto = otherUser?.profile?.profile_photo;
  const isOnline = presenceMap[otherId] === 'online';

  // Load messages on mount
  useEffect(() => {
    fetchMessages(conversationId);
    markConversationRead(conversationId);
  }, [conversationId]);

  // Mark read on new messages
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[0];
      const senderId =
        typeof lastMsg.sender === 'string'
          ? lastMsg.sender
          : (lastMsg.sender as UserSnippet)?._id;
      if (senderId !== myUserId) {
        markConversationRead(conversationId);
        socketService.markRead(conversationId, lastMsg._id);
      }
    }
  }, [messages.length]);

  // Typing indicator logic
  const handleTextChange = (val: string) => {
    setText(val);

    if (val.length > 0 && !isTypingRef.current) {
      isTypingRef.current = true;
      socketService.typingStart(conversationId);
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        socketService.typingStop(conversationId);
      }
    }, 2000);
  };

  // Send text message
  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setText('');
    setReplyTo(null);

    if (isTypingRef.current) {
      isTypingRef.current = false;
      socketService.typingStop(conversationId);
    }

    try {
      await messagingService.sendMessage(conversationId, {
        type: 'text',
        content: trimmed,
        reply_to: replyTo?._id,
      });
    } catch {
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  // Send image
  const handlePickImage = async () => {
    setShowAttachMenu(false);
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
      });
      if (result.assets?.[0]) {
        const asset = result.assets[0];
        const formData = new FormData();
        formData.append('type', 'image');
        formData.append('file', {
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || 'photo.jpg',
        } as any);

        setSending(true);
        try {
          await messagingService.sendAttachment(conversationId, formData);
        } catch {
          Alert.alert('Error', 'Failed to send image.');
        } finally {
          setSending(false);
        }
      }
    } catch {
      // cancelled
    }
  };

  // Delete message
  const handleDelete = async (messageId: string) => {
    Alert.alert('Delete Message', 'This message will be removed for everyone.', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await messagingService.deleteMessage(messageId);
            deleteMessageLocal(conversationId, messageId);
          } catch {
            Alert.alert('Error', 'Failed to delete message.');
          }
        },
      },
    ]);
  };

  // Load more messages
  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    await fetchMessages(conversationId, true);
    setLoadingMore(false);
  }, [hasMore, loadingMore, conversationId]);

  const renderItem = ({item}: {item: Message}) => {
    const senderId =
      typeof item.sender === 'string'
        ? item.sender
        : (item.sender as UserSnippet)?._id;
    return (
      <MessageBubble
        message={item}
        isMine={senderId === myUserId}
        onImagePress={(url) => navigation.navigate('MediaPreview', {url, type: 'image'})}
        onDelete={senderId === myUserId ? handleDelete : undefined}
        onReply={setReplyTo}
      />
    );
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
      {/* Header */}
      <Header
        title=""
        onBack={() => navigation.goBack()}
        center={
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
            <View>
              <Avatar
                uri={partnerPhoto}
                firstName={otherUser?.profile?.first_name || ''}
                lastName={otherUser?.profile?.last_name || ''}
                size="sm"
              />
              {isOnline && (
                <View
                  style={{
                    position: 'absolute',
                    bottom: -1,
                    right: -1,
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: colors.success,
                    borderWidth: 2,
                    borderColor: colors.background,
                  }}
                />
              )}
            </View>
            <View>
              <Text style={{fontSize: 14, fontWeight: '700', color: colors.foreground}} numberOfLines={1}>
                {partnerName}
              </Text>
              <Text style={{fontSize: 11, color: isOnline ? colors.success : colors.mutedForeground}}>
                {typingUsers.length > 0 ? 'typing...' : isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
        }
      />

      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        {/* Messages list (inverted) */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          inverted
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingVertical: 8}}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={
            typingUsers.length > 0 ? <TypingIndicator /> : null
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={{padding: 16, alignItems: 'center'}}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
        />

        {/* Reply banner */}
        {replyTo && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.card,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}>
            <View
              style={{
                flex: 1,
                borderLeftWidth: 3,
                borderLeftColor: colors.accent,
                paddingLeft: 10,
              }}>
              <Text style={{fontSize: 11, fontWeight: '700', color: colors.accent}}>
                Replying to{' '}
                {typeof replyTo.sender === 'object'
                  ? (replyTo.sender as UserSnippet).profile?.first_name
                  : 'User'}
              </Text>
              <Text numberOfLines={1} style={{fontSize: 12, color: colors.mutedForeground}}>
                {replyTo.content || replyTo.type}
              </Text>
            </View>
            <TouchableOpacity hitSlop={8} onPress={() => setReplyTo(null)}>
              <X size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        )}

        {/* Attachment menu */}
        {showAttachMenu && (
          <View
            style={{
              flexDirection: 'row',
              gap: 16,
              paddingHorizontal: 16,
              paddingVertical: 10,
              backgroundColor: colors.card,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}>
            <TouchableOpacity
              onPress={handlePickImage}
              style={{alignItems: 'center', gap: 4}}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: `${colors.primary}15`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <ImageIcon size={20} color={colors.primary} />
              </View>
              <Text style={{fontSize: 10, color: colors.mutedForeground}}>Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowAttachMenu(false)}
              style={{alignItems: 'center', gap: 4}}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: `${colors.accent}15`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <FileIcon size={20} color={colors.accent} />
              </View>
              <Text style={{fontSize: 10, color: colors.mutedForeground}}>File</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePickImage}
              style={{alignItems: 'center', gap: 4}}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: `${colors.success}15`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Camera size={20} color={colors.success} />
              </View>
              <Text style={{fontSize: 10, color: colors.mutedForeground}}>Camera</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowAttachMenu(!showAttachMenu)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.muted,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Paperclip size={18} color={colors.mutedForeground} />
          </TouchableOpacity>

          <View
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: Platform.OS === 'ios' ? 8 : 4,
              maxHeight: 120,
            }}>
            <TextInput
              value={text}
              onChangeText={handleTextChange}
              placeholder="Type a message..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              style={{
                fontSize: 14,
                color: colors.foreground,
                maxHeight: 100,
              }}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleSend}
            disabled={!text.trim() || sending}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: text.trim() ? colors.primary : colors.muted,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {sending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Send
                size={18}
                color={text.trim() ? colors.white : colors.mutedForeground}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
