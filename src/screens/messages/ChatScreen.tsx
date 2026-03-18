import { useNavigation, useRoute } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import {
  Camera,
  File as FileIcon,
  Image as ImageIcon,
  Mic,
  Paperclip,
  Send,
  Trash2,
  Video as VideoIcon,
  X,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Platform, TouchableOpacity, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { launchImageLibrary } from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

import MessageBubble from '../../components/messages/MessageBubble';
import TypingIndicator from '../../components/messages/TypingIndicator';
import { Avatar, Header } from '../../components/ui';
import { Text } from '../../components/ui/Text';
import { TextInput } from '../../components/ui/TextInput';
import { messagingService } from '../../services/messaging.service';
import { socketService } from '../../services/socket.service';
import { useAuthStore } from '../../store/auth';
import { useMessagingStore } from '../../store/messaging';
import { colors } from '../../theme/colors';
import type {
  Conversation,
  Message,
  PresenceStatus,
  UserSnippet,
} from '../../types/messaging.types';

// Lazy-init to avoid crash if native module isn't linked
let audioRecorderPlayer: any = null;
function getRecorder() {
  if (!audioRecorderPlayer) {
    try {
      const ARP = require('react-native-audio-recorder-player').default;
      audioRecorderPlayer = new ARP();
    } catch {
      return null;
    }
  }
  return audioRecorderPlayer;
}

export default function ChatScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { conversationId, conversation: initialConv } = route.params as {
    conversationId: string;
    conversation?: Conversation;
  };

  const myUserId = useAuthStore((s) => s.user?._id) || '';
  const allMessages = useMessagingStore((s) => s.messages);
  const allHasMore = useMessagingStore((s) => s.hasMoreMessages);
  const allTyping = useMessagingStore((s) => s.typingMap);
  const presenceMap = useMessagingStore((s) => s.presenceMap);
  const fetchMessages = useMessagingStore((s) => s.fetchMessages);
  const markConversationRead = useMessagingStore((s) => s.markConversationRead);
  const deleteMessageLocal = useMessagingStore((s) => s.deleteMessageLocal);
  const addIncomingMessage = useMessagingStore((s) => s.addIncomingMessage);
  const updatePresence = useMessagingStore((s) => s.updatePresence);

  const messages = useMemo(() => allMessages[conversationId] || [], [allMessages, conversationId]);
  const hasMore = allHasMore[conversationId] ?? true;
  const typingUsers = useMemo(() => allTyping[conversationId] || [], [allTyping, conversationId]);

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const flatListRef = useRef<FlashList<Message>>(null);
  const recordingPathRef = useRef<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Get partner info
  const otherParticipant = initialConv?.participants.find((p) => {
    const uid = typeof p.user === 'string' ? p.user : (p.user as UserSnippet)?._id;
    return uid !== myUserId;
  });
  const otherUser =
    typeof otherParticipant?.user === 'object' ? (otherParticipant.user as UserSnippet) : null;
  const otherId =
    typeof otherParticipant?.user === 'string' ? otherParticipant.user : otherUser?._id || '';
  const isSpecialist = otherUser?.user_type === 'Specialist';
  const partnerName = otherUser
    ? isSpecialist
      ? `Dr. ${otherUser.profile?.first_name} ${otherUser.profile?.last_name || ''}`.trim()
      : `${otherUser.profile?.first_name} ${otherUser.profile?.last_name || ''}`.trim()
    : 'Chat';
  const partnerPhoto = otherUser?.profile?.profile_photo;
  const isOnline = presenceMap[otherId] === 'online';

  // ── Socket: ensure connected + listen for presence ──
  useEffect(() => {
    socketService.connect();

    const unsubPresence = socketService.on(
      'presence_update',
      (data: { userId: string; status: PresenceStatus }) => {
        updatePresence(data.userId, data.status);
      }
    );

    const unsubConnected = socketService.on('connected', (data: any) => {
      if (data?.presence) {
        Object.entries(data.presence).forEach(([uid, status]) => {
          updatePresence(uid, status as PresenceStatus);
        });
      }
    });

    const unsubNewMsg = socketService.on(
      'new_message',
      (data: { message: Message; conversation: Conversation }) => {
        addIncomingMessage(data.message, data.conversation);
      }
    );

    return () => {
      unsubPresence();
      unsubConnected();
      unsubNewMsg();
    };
  }, [addIncomingMessage, updatePresence]);

  // Load messages on mount
  useEffect(() => {
    fetchMessages(conversationId);
    markConversationRead(conversationId);
  }, [conversationId, fetchMessages, markConversationRead]);

  // Mark read on new messages
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[0];
      const senderId =
        typeof lastMsg.sender === 'string' ? lastMsg.sender : (lastMsg.sender as UserSnippet)?._id;
      if (senderId !== myUserId) {
        markConversationRead(conversationId);
        socketService.markRead(conversationId, lastMsg._id);
      }
    }
  }, [messages, conversationId, myUserId, markConversationRead]);

  // ── Recording pulse animation ──
  useEffect(() => {
    if (isRecording) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

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
      const sent = await messagingService.sendMessage(conversationId, {
        type: 'text',
        content: trimmed,
        reply_to: replyTo?._id,
      });
      if (sent?._id && initialConv) {
        addIncomingMessage(sent, initialConv);
      }
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
          const sent = await messagingService.sendAttachment(conversationId, formData);
          if (sent?._id && initialConv) {
            addIncomingMessage(sent, initialConv);
          }
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

  // Send video
  const handlePickVideo = async () => {
    setShowAttachMenu(false);
    try {
      const result = await launchImageLibrary({
        mediaType: 'video',
        selectionLimit: 1,
      });
      if (result.assets?.[0]) {
        const asset = result.assets[0];
        const formData = new FormData();
        formData.append('type', 'video');
        formData.append('file', {
          uri: asset.uri,
          type: asset.type || 'video/mp4',
          name: asset.fileName || `video_${Date.now()}.mp4`,
        } as any);

        setSending(true);
        try {
          const sent = await messagingService.sendAttachment(conversationId, formData);
          if (sent?._id && initialConv) {
            addIncomingMessage(sent, initialConv);
          }
        } catch {
          Alert.alert('Error', 'Failed to send video.');
        } finally {
          setSending(false);
        }
      }
    } catch {
      // cancelled
    }
  };

  // ── Voice recording ──
  const handleStartRecording = async () => {
    const recorder = getRecorder();
    if (!recorder) {
      Alert.alert('Unavailable', 'Voice recording is not available on this device.');
      return;
    }
    try {
      const path = Platform.select({
        ios: `voice_${Date.now()}.m4a`,
        android: `${
          Platform.OS === 'android' ? '/data/user/0/com.rapidcapsulemobile/cache/' : ''
        }voice_${Date.now()}.mp4`,
      });
      const result = await recorder.startRecorder(path);
      recordingPathRef.current = result;
      setIsRecording(true);
      setRecordDuration(0);

      recorder.addRecordBackListener((e: any) => {
        setRecordDuration(Math.floor(e.currentPosition / 1000));
      });
    } catch {
      Alert.alert('Error', 'Could not start recording. Please check microphone permissions.');
    }
  };

  const handleStopAndSend = async () => {
    try {
      const recorder = getRecorder();
      const filePath = await recorder?.stopRecorder();
      recorder?.removeRecordBackListener();
      setIsRecording(false);

      if (!filePath || recordDuration < 1) {
        setRecordDuration(0);
        return;
      }

      const formData = new FormData();
      formData.append('type', 'voice_note');
      formData.append('file', {
        uri: Platform.OS === 'android' ? `file:// === 'm4a'${filePath}` : filePath,
        type: filePath.split('.').pop() === 'm4a' ? 'audio/m4a' : 'audio/mp4',
        name: `voice_${Date.now()}.${filePath.split('.').pop() || 'm4a'}`,
      } as any);

      setSending(true);
      try {
        const sent = await messagingService.sendAttachment(conversationId, formData);
        if (sent?._id && initialConv) {
          addIncomingMessage(sent, initialConv);
        }
      } catch {
        Alert.alert('Error', 'Failed to send voice message.');
      } finally {
        setSending(false);
        setRecordDuration(0);
      }
    } catch {
      setIsRecording(false);
      setRecordDuration(0);
    }
  };

  const handleCancelRecording = async () => {
    try {
      const recorder = getRecorder();
      await recorder?.stopRecorder();
      recorder?.removeRecordBackListener();
    } catch {
      // ignore
    }
    setIsRecording(false);
    setRecordDuration(0);
    recordingPathRef.current = null;
  };

  const formatRecordTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // Delete message
  const handleDelete = async (messageId: string) => {
    Alert.alert('Delete Message', 'This message will be removed for everyone.', [
      { text: 'Cancel', style: 'cancel' },
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
  }, [hasMore, loadingMore, conversationId, fetchMessages]);

  const renderItem = ({ item }: { item: Message }) => {
    const senderId =
      typeof item.sender === 'string' ? item.sender : (item.sender as UserSnippet)?._id;
    return (
      <MessageBubble
        message={item}
        isMine={senderId === myUserId}
        onImagePress={(url) => navigation.navigate('MediaPreview', { url, type: 'image' })}
        onDelete={senderId === myUserId ? handleDelete : undefined}
        onReply={setReplyTo}
      />
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* Header */}
      <Header
        title=""
        onBack={() => navigation.goBack()}
        center={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
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
              <Text
                style={{ fontSize: 14, fontWeight: '700', color: colors.foreground }}
                numberOfLines={1}
              >
                {partnerName}
              </Text>
              <Text
                style={{ fontSize: 11, color: isOnline ? colors.success : colors.mutedForeground }}
              >
                {typingUsers.length > 0 ? 'typing...' : isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
        }
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Messages list (inverted) */}
        <FlashList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          inverted
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 8 }}
          estimatedItemSize={80}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={typingUsers.length > 0 ? <TypingIndicator /> : null}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ padding: 16, alignItems: 'center' }}>
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
            }}
          >
            <View
              style={{
                flex: 1,
                borderLeftWidth: 3,
                borderLeftColor: colors.accent,
                paddingLeft: 10,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.accent }}>
                Replying to{' '}
                {typeof replyTo.sender === 'object'
                  ? (replyTo.sender as UserSnippet).profile?.first_name
                  : 'User'}
              </Text>
              <Text numberOfLines={1} style={{ fontSize: 12, color: colors.mutedForeground }}>
                {replyTo.content || replyTo.type}
              </Text>
            </View>
            <TouchableOpacity
              hitSlop={8}
              onPress={() => setReplyTo(null)}
              accessibilityRole="button"
              accessibilityLabel="Cancel reply"
            >
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
            }}
          >
            <TouchableOpacity
              onPress={handlePickImage}
              accessibilityRole="button"
              accessibilityLabel="Send a photo"
              style={{ alignItems: 'center', gap: 4 }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: `${colors.primary}15`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ImageIcon size={20} color={colors.primary} />
              </View>
              <Text style={{ fontSize: 10, color: colors.mutedForeground }}>Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePickVideo}
              accessibilityRole="button"
              accessibilityLabel="Send a video"
              style={{ alignItems: 'center', gap: 4 }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: `${colors.accent}15`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <VideoIcon size={20} color={colors.accent} />
              </View>
              <Text style={{ fontSize: 10, color: colors.mutedForeground }}>Video</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Take a photo"
              onPress={() => {
                setShowAttachMenu(false);
                launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 })
                  .then((r) => {
                    // Camera option uses same flow
                    if (r.assets?.[0]) {
                      const asset = r.assets[0];
                      const fd = new FormData();
                      fd.append('type', 'image');
                      fd.append('file', {
                        uri: asset.uri,
                        type: asset.type || 'image/jpeg',
                        name: asset.fileName || 'photo.jpg',
                      } as any);
                      setSending(true);
                      messagingService
                        .sendAttachment(conversationId, fd)
                        .then((sent) => {
                          if (sent?._id && initialConv) addIncomingMessage(sent, initialConv);
                        })
                        .catch(() => Alert.alert('Error', 'Failed to send photo.'))
                        .finally(() => setSending(false));
                    }
                  })
                  .catch(() => {});
              }}
              style={{ alignItems: 'center', gap: 4 }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: `${colors.success}15`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Camera size={20} color={colors.success} />
              </View>
              <Text style={{ fontSize: 10, color: colors.mutedForeground }}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowAttachMenu(false)}
              accessibilityRole="button"
              accessibilityLabel="Send a file"
              style={{ alignItems: 'center', gap: 4 }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: `${colors.secondary}15`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileIcon size={20} color={colors.secondary} />
              </View>
              <Text style={{ fontSize: 10, color: colors.mutedForeground }}>File</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input bar */}
        {isRecording ? (
          /* ── Recording UI ── */
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              backgroundColor: colors.background,
            }}
          >
            {/* Cancel */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleCancelRecording}
              accessibilityRole="button"
              accessibilityLabel="Cancel recording"
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: `${colors.destructive}15`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trash2 size={18} color={colors.destructive} />
            </TouchableOpacity>

            {/* Recording indicator */}
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Animated.View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: colors.destructive,
                  transform: [{ scale: pulseAnim }],
                }}
              />
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                {formatRecordTime(recordDuration)}
              </Text>
              <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Recording...</Text>
            </View>

            {/* Send voice */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleStopAndSend}
              accessibilityRole="button"
              accessibilityLabel="Stop recording and send voice message"
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Send size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
        ) : (
          /* ── Normal input bar ── */
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
            }}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowAttachMenu(!showAttachMenu)}
              accessibilityRole="button"
              accessibilityLabel="Attach file"
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.muted,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
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
              }}
            >
              <TextInput
                value={text}
                onChangeText={handleTextChange}
                placeholder="Type a message..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                accessibilityLabel="Type a message"
                style={{
                  fontSize: 14,
                  color: colors.foreground,
                  maxHeight: 100,
                }}
              />
            </View>

            {text.trim() ? (
              /* Send text button */
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleSend}
                disabled={sending}
                accessibilityRole="button"
                accessibilityLabel="Send message"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Send size={18} color={colors.white} />
                )}
              </TouchableOpacity>
            ) : (
              /* Mic button */
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleStartRecording}
                disabled={sending}
                accessibilityRole="button"
                accessibilityLabel="Record voice message"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: sending ? colors.muted : colors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Mic size={18} color={colors.white} />
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
