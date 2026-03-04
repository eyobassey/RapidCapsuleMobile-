import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ArrowLeft, BrainCircuit, Clock, Plus, Send} from 'lucide-react-native';
import {colors} from '../../theme/colors';
import {useNavigation} from '@react-navigation/native';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  time: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content:
      "Hello Sarah. I'm Eka, your AI health companion. I noticed your blood pressure was slightly elevated yesterday. How are you feeling today?",
    time: '9:41 AM',
  },
];

const QUICK_ACTIONS = [
  {label: 'Symptom Checker', color: 'text-primary'},
  {label: 'Analyze Rx', color: 'text-secondary'},
];

export default function EkaChatScreen() {
  const navigation = useNavigation<any>();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
    };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    // TODO: send to Eka API and get response
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="pt-2 pb-4 px-4 bg-card border-b border-border flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full bg-background border border-border items-center justify-center">
          <ArrowLeft size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View className="flex-row items-center gap-2">
          <View
            className="w-8 h-8 rounded-lg items-center justify-center"
            style={{backgroundColor: colors.primary}}>
            <BrainCircuit size={16} color={colors.white} />
          </View>
          <View>
            <Text className="font-bold text-sm text-foreground leading-tight">Eka AI</Text>
            <View className="flex-row items-center gap-1">
              <View className="w-1.5 h-1.5 rounded-full bg-primary" />
              <Text className="text-[10px] text-primary font-medium">Online</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity className="w-10 h-10 rounded-full bg-background border border-border items-center justify-center">
          <Clock size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={0}>
        <ScrollView className="flex-1 p-4" contentContainerClassName="gap-4 pb-40">
          <Text className="text-center text-xs text-muted-foreground font-medium my-2">
            Today, 9:41 AM
          </Text>
          {messages.map(msg => (
            <View
              key={msg.id}
              className={`flex-row ${msg.role === 'user' ? 'justify-end' : 'gap-3'}`}>
              {msg.role === 'assistant' && (
                <View className="w-8 h-8 rounded-full bg-primary items-center justify-center mt-auto">
                  <BrainCircuit size={16} color={colors.white} />
                </View>
              )}
              <View
                className={`max-w-[80%] rounded-2xl p-3.5 ${
                  msg.role === 'assistant'
                    ? 'bg-card border border-border rounded-bl-sm'
                    : 'bg-primary rounded-br-sm'
                }`}>
                <Text
                  className={`text-sm ${
                    msg.role === 'assistant' ? 'text-foreground' : 'text-white'
                  }`}>
                  {msg.content}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Input Area */}
        <View className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border pb-8">
          {/* Quick action chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-3"
            contentContainerClassName="gap-2">
            {QUICK_ACTIONS.map((action, i) => (
              <TouchableOpacity
                key={i}
                className="px-3 py-1.5 rounded-full bg-card border border-border">
                <Text className={`text-xs font-medium ${action.color}`}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Chat input bar */}
          <View className="bg-card border border-border rounded-2xl flex-row items-center p-1.5">
            <TouchableOpacity className="w-10 h-10 rounded-xl items-center justify-center">
              <Plus size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={colors.mutedForeground}
              className="flex-1 text-sm text-foreground px-2 py-2"
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <TouchableOpacity
              onPress={handleSend}
              className="w-10 h-10 rounded-xl bg-primary items-center justify-center"
              style={{
                shadowColor: colors.primary,
                shadowOffset: {width: 0, height: 2},
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4,
              }}>
              <Send size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
