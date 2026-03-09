import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, TouchableOpacity, ActivityIndicator} from 'react-native';
import {FlashList} from '@shopify/flash-list';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {PenSquare, MessageCircle} from 'lucide-react-native';
import {Header, SearchInput} from '../../components/ui';
import ConversationRow from '../../components/messages/ConversationRow';
import {colors} from '../../theme/colors';
import {useMessagingStore} from '../../store/messaging';
import {useAuthStore} from '../../store/auth';
import {useSocket} from '../../hooks/useSocket';

export default function ConversationsListScreen() {
  const navigation = useNavigation<any>();
  const myUserId = useAuthStore(s => s.user?._id) || '';

  const conversations = useMessagingStore(s => s.conversations);
  const hasMore = useMessagingStore(s => s.hasMoreConversations);
  const currentPage = useMessagingStore(s => s.currentPage);
  const isLoading = useMessagingStore(s => s.isLoading);
  const presenceMap = useMessagingStore(s => s.presenceMap);
  const fetchConversations = useMessagingStore(s => s.fetchConversations);
  const computeUnreadTotal = useMessagingStore(s => s.computeUnreadTotal);

  const [search, setSearch] = useState('');

  // Connect socket
  useSocket();

  // Load on focus
  useFocusEffect(
    useCallback(() => {
      fetchConversations(1, search || undefined);
    }, [search]),
  );

  // Compute unread whenever conversations change
  useEffect(() => {
    computeUnreadTotal(myUserId);
  }, [conversations, myUserId]);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchConversations(currentPage + 1, search || undefined);
    }
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={{alignItems: 'center', paddingTop: 80, paddingHorizontal: 40}}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: `${colors.primary}15`,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}>
          <MessageCircle size={28} color={colors.primary} />
        </View>
        <Text style={{fontSize: 16, fontWeight: '700', color: colors.foreground, marginBottom: 6}}>
          No conversations yet
        </Text>
        <Text style={{fontSize: 13, color: colors.mutedForeground, textAlign: 'center', lineHeight: 20}}>
          Start a conversation with your healthcare specialist to get started.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
      <Header
        title="Messages"
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('NewConversation')}
            accessibilityRole="button"
            accessibilityLabel="New conversation"
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <PenSquare size={16} color={colors.white} />
          </TouchableOpacity>
        }
      />

      {/* Search bar */}
      <View style={{paddingHorizontal: 16, paddingBottom: 8}}>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search conversations..."
        />
      </View>

      <FlashList
        data={conversations}
        keyExtractor={item => item._id}
        estimatedItemSize={80}
        renderItem={({item}) => (
          <ConversationRow
            conversation={item}
            myUserId={myUserId}
            presenceMap={presenceMap}
            onPress={() =>
              navigation.navigate('Chat', {
                conversationId: item._id,
                conversation: item,
              })
            }
          />
        )}
        ListEmptyComponent={renderEmpty}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ItemSeparatorComponent={() => (
          <View
            style={{
              height: 1,
              backgroundColor: colors.border,
              marginLeft: 76,
            }}
          />
        )}
        ListFooterComponent={
          isLoading && conversations.length > 0 ? (
            <View style={{padding: 16, alignItems: 'center'}}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
