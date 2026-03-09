import React, {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity, ActivityIndicator} from 'react-native';
import {FlashList} from '@shopify/flash-list';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {Users, Search as SearchIcon} from 'lucide-react-native';
import {Header, Avatar, SearchInput} from '../../components/ui';
import {colors} from '../../theme/colors';
import {messagingService} from '../../services/messaging.service';
import type {UserSnippet} from '../../types/messaging.types';

export default function NewConversationScreen() {
  const navigation = useNavigation<any>();
  const [contacts, setContacts] = useState<UserSnippet[]>([]);
  const [searchResults, setSearchResults] = useState<UserSnippet[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (search.length >= 2) {
      const timer = setTimeout(() => searchUsers(search), 400);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [search]);

  const loadContacts = async () => {
    try {
      const data = await messagingService.getContacts();
      setContacts(Array.isArray(data) ? data : []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (q: string) => {
    setSearching(true);
    try {
      const data = await messagingService.searchUsers(q);
      setSearchResults(Array.isArray(data) ? data : []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const startConversation = async (user: UserSnippet) => {
    if (starting) return;
    setStarting(true);
    try {
      const conversation = await messagingService.createConversation(user._id);
      navigation.replace('Chat', {
        conversationId: conversation._id,
        conversation,
      });
    } catch {
      setStarting(false);
    }
  };

  const displayList = search.length >= 2 ? searchResults : contacts;
  const isSearchMode = search.length >= 2;

  const renderUser = ({item}: {item: UserSnippet}) => {
    const isSpec = item.user_type === 'Specialist';
    const name = isSpec
      ? `Dr. ${item.profile?.first_name} ${item.profile?.last_name || ''}`.trim()
      : `${item.profile?.first_name} ${item.profile?.last_name || ''}`.trim();

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => startConversation(item)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}>
        <Avatar
          uri={item.profile?.profile_photo}
          firstName={item.profile?.first_name || ''}
          lastName={item.profile?.last_name || ''}
          size="md"
        />
        <View style={{flex: 1}}>
          <Text style={{fontSize: 14, fontWeight: '600', color: colors.foreground}}>
            {name || 'User'}
          </Text>
          <Text style={{fontSize: 12, color: colors.mutedForeground, marginTop: 1}}>
            {item.specialty || item.user_type || item.email}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
      <Header title="New Conversation" onBack={() => navigation.goBack()} />

      <View style={{paddingHorizontal: 16, paddingBottom: 8}}>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or email..."
        />
      </View>

      {/* Section label */}
      <View style={{paddingHorizontal: 16, paddingVertical: 8}}>
        <Text style={{fontSize: 12, fontWeight: '600', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 0.5}}>
          {isSearchMode ? 'Search Results' : 'Your Contacts'}
        </Text>
      </View>

      {loading || searching ? (
        <View style={{alignItems: 'center', paddingTop: 40}}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlashList
          data={displayList}
          keyExtractor={item => item._id}
          renderItem={renderUser}
          estimatedItemSize={64}
          ListEmptyComponent={
            <View style={{alignItems: 'center', paddingTop: 60, paddingHorizontal: 40}}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: colors.muted,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}>
                {isSearchMode ? (
                  <SearchIcon size={24} color={colors.mutedForeground} />
                ) : (
                  <Users size={24} color={colors.mutedForeground} />
                )}
              </View>
              <Text style={{fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 4}}>
                {isSearchMode ? 'No users found' : 'No contacts yet'}
              </Text>
              <Text style={{fontSize: 12, color: colors.mutedForeground, textAlign: 'center'}}>
                {isSearchMode
                  ? 'Try a different search term'
                  : 'Book an appointment to connect with specialists'}
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => (
            <View style={{height: 1, backgroundColor: colors.border, marginLeft: 76}} />
          )}
        />
      )}

      {starting && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <ActivityIndicator size="large" color={colors.white} />
        </View>
      )}
    </SafeAreaView>
  );
}
