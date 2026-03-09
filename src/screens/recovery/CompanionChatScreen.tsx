import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {FlashList} from '@shopify/flash-list';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Send, BrainCircuit, AlertTriangle} from 'lucide-react-native';
import {Header} from '../../components/ui';
import {colors} from '../../theme/colors';
import {recoveryService} from '../../services/recovery.service';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  crisis_detected?: boolean;
}

export default function CompanionChatScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const initialSessionId = (route.params as any)?.sessionId;

  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(!initialSessionId);
  const flatListRef = useRef<FlashList<ChatMessage>>(null);

  useEffect(() => {
    if (!initialSessionId) {
      startSession();
    }
  }, []);

  const startSession = async () => {
    setStarting(true);
    try {
      const session = await recoveryService.startCompanion();
      setSessionId(session.session_id);
      if (session.greeting) {
        setMessages([{
          id: '0',
          role: 'assistant',
          content: session.greeting,
          timestamp: new Date().toISOString(),
        }]);
      }
    } catch {
      Alert.alert('Error', 'Failed to start companion session.', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } finally {
      setStarting(false);
    }
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || !sessionId) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setText('');
    setSending(true);

    try {
      const response = await recoveryService.sendCompanionMessage(sessionId, trimmed);

      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: response.ai_response,
        timestamp: response.timestamp || new Date().toISOString(),
        crisis_detected: response.conversation_analysis?.crisis_detected,
      };

      setMessages(prev => [...prev, aiMsg]);

      // If crisis detected, show alert
      if (response.conversation_analysis?.crisis_detected) {
        Alert.alert(
          'We\'re Concerned',
          'It sounds like you may be in crisis. Would you like to access crisis support?',
          [
            {text: 'Continue Chat', style: 'cancel'},
            {
              text: 'Crisis Support',
              onPress: () => navigation.navigate('Crisis'),
            },
          ],
        );
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          content: 'I\'m sorry, I couldn\'t process that. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleEnd = async () => {
    if (!sessionId) return;
    Alert.alert('End Session', 'Would you like to end this companion session?', [
      {text: 'Continue', style: 'cancel'},
      {
        text: 'End Session',
        onPress: async () => {
          try {
            await recoveryService.endCompanion(sessionId);
          } catch {
            // ignore
          }
          navigation.goBack();
        },
      },
    ]);
  };

  const renderMessage = ({item}: {item: ChatMessage}) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={{
          alignSelf: isUser ? 'flex-end' : 'flex-start',
          maxWidth: '80%',
          marginHorizontal: 12,
          marginVertical: 3,
        }}>
        {!isUser && (
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4}}>
            <BrainCircuit size={12} color={colors.accent} />
            <Text style={{fontSize: 10, fontWeight: '600', color: colors.accent}}>
              AI Companion
            </Text>
          </View>
        )}
        <View
          style={{
            backgroundColor: isUser ? colors.primary : colors.card,
            borderRadius: 16,
            borderBottomRightRadius: isUser ? 4 : 16,
            borderBottomLeftRadius: isUser ? 16 : 4,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderWidth: isUser ? 0 : 1,
            borderColor: colors.border,
          }}>
          <Text
            style={{
              fontSize: 14,
              lineHeight: 20,
              color: isUser ? colors.white : colors.foreground,
            }}>
            {item.content}
          </Text>
        </View>
        {item.crisis_detected && (
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4}}>
            <AlertTriangle size={10} color={colors.destructive} />
            <Text style={{fontSize: 10, color: colors.destructive}}>
              Crisis indicators detected
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (starting) {
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
        <Header title="AI Companion" onBack={() => navigation.goBack()} />
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12}}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={{fontSize: 13, color: colors.mutedForeground}}>
            Starting companion session...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
      <Header
        title="AI Companion"
        onBack={handleEnd}
        right={
          <TouchableOpacity onPress={handleEnd} hitSlop={8} accessibilityRole="button" accessibilityLabel="End companion session">
            <Text style={{fontSize: 13, fontWeight: '600', color: colors.destructive}}>End</Text>
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlashList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{paddingVertical: 8}}
          estimatedItemSize={80}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({animated: true})}
        />

        {/* Typing indicator when sending */}
        {sending && (
          <View style={{paddingHorizontal: 16, paddingVertical: 4}}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: colors.muted,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 6,
                alignSelf: 'flex-start',
              }}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={{fontSize: 11, color: colors.mutedForeground}}>Thinking...</Text>
            </View>
          </View>
        )}

        {/* Input */}
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
              onChangeText={setText}
              placeholder="How are you feeling..."
              placeholderTextColor={colors.mutedForeground}
              accessibilityLabel="Message to AI companion"
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
            accessibilityRole="button"
            accessibilityLabel="Send message"
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: text.trim() ? colors.accent : colors.muted,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Send
              size={18}
              color={text.trim() ? colors.white : colors.mutedForeground}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
