import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Users, Calendar, User, UserPlus, UserMinus } from 'lucide-react-native';
import { Header, Text } from '../../components/ui';
import { colors } from '../../theme/colors';
import { recoveryService } from '../../services/recovery.service';
import type { GroupSession } from '../../types/recovery.types';

type Tab = 'available' | 'mine';

export default function GroupSessionsScreen() {
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<Tab>('mine');
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data =
        tab === 'mine'
          ? await recoveryService.getMyGroupSessions()
          : await recoveryService.getGroupSessions({ status: 'scheduled' });
      setSessions(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (id: string) => {
    setActionLoading(id);
    try {
      await recoveryService.joinGroupSession(id);
      Alert.alert('Joined', 'You have been enrolled in this session.');
      loadSessions();
    } catch {
      Alert.alert('Error', 'Failed to join session.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeave = async (id: string) => {
    Alert.alert('Leave Session', 'Are you sure you want to leave this group session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(id);
          try {
            await recoveryService.leaveGroupSession(id);
            loadSessions();
          } catch {
            Alert.alert('Error', 'Failed to leave session.');
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const renderSession = ({ item }: { item: GroupSession }) => {
    const facilitatorName = item.facilitator?.profile
      ? `${item.facilitator.profile.first_name} ${item.facilitator.profile.last_name}`
      : 'TBA';
    const isMember = tab === 'mine';
    const isActionLoading = actionLoading === item._id;

    return (
      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 16,
          padding: 16,
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}>
          {item.title}
        </Text>
        {item.description && (
          <Text
            numberOfLines={2}
            style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 4 }}
          >
            {item.description}
          </Text>
        )}

        <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
          {item.schedule?.day_of_week && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Calendar size={12} color={colors.mutedForeground} />
              <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                {item.schedule.day_of_week} {item.schedule.time || ''}
              </Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <User size={12} color={colors.mutedForeground} />
            <Text style={{ fontSize: 11, color: colors.mutedForeground }}>{facilitatorName}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Users size={12} color={colors.mutedForeground} />
            <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
              {item.current_members}/{item.max_members}
            </Text>
          </View>
        </View>

        {item.category && (
          <View
            style={{
              alignSelf: 'flex-start',
              backgroundColor: `${colors.primary}15`,
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 2,
              marginTop: 10,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: '600',
                color: colors.primary,
                textTransform: 'capitalize',
              }}
            >
              {item.category}
            </Text>
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.7}
          disabled={isActionLoading}
          onPress={() => (isMember ? handleLeave(item._id) : handleJoin(item._id))}
          accessibilityRole="button"
          accessibilityLabel={isMember ? `Leave ${item.title}` : `Join ${item.title}`}
          style={{
            marginTop: 12,
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: isMember ? `${colors.destructive}15` : colors.primary,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {isActionLoading ? (
            <ActivityIndicator size="small" color={isMember ? colors.destructive : colors.white} />
          ) : (
            <>
              {isMember ? (
                <UserMinus size={14} color={colors.destructive} />
              ) : (
                <UserPlus size={14} color={colors.white} />
              )}
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: isMember ? colors.destructive : colors.white,
                }}
              >
                {isMember ? 'Leave Session' : 'Join Session'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <Header title="Group Sessions" onBack={() => navigation.goBack()} />

      {/* Tabs */}
      <View
        style={{
          flexDirection: 'row',
          gap: 8,
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 4,
        }}
      >
        {(['mine', 'available'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            activeOpacity={0.7}
            onPress={() => setTab(t)}
            accessibilityRole="tab"
            accessibilityLabel={t === 'mine' ? 'My Sessions' : 'Available'}
            accessibilityState={{ selected: tab === t }}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: tab === t ? colors.primary : colors.muted,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: tab === t ? colors.white : colors.mutedForeground,
              }}
            >
              {t === 'mine' ? 'My Sessions' : 'Available'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlashList
          data={sessions}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16 }}
          estimatedItemSize={180}
          renderItem={renderSession}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 }}>
              <Users size={40} color={colors.mutedForeground} />
              <Text
                style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginTop: 12 }}
              >
                {tab === 'mine' ? 'No enrolled sessions' : 'No available sessions'}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.mutedForeground,
                  textAlign: 'center',
                  marginTop: 4,
                }}
              >
                {tab === 'mine'
                  ? 'Browse available sessions to join a group.'
                  : 'No group sessions are currently available. Check back later.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
