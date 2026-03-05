import React, {useCallback, useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {
  UserCheck,
  Star,
  MessageSquare,
  Send,
  Clock,
  SmilePlus,
} from 'lucide-react-native';
import {Header} from '../../components/ui';
import {colors} from '../../theme/colors';
import {useRecoveryStore} from '../../store/recovery';
import {recoveryService} from '../../services/recovery.service';

export default function PeerSupportScreen() {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [checkInNote, setCheckInNote] = useState('');
  const [checkInMood, setCheckInMood] = useState(7);
  const [submitting, setSubmitting] = useState(false);

  const peerAssignment = useRecoveryStore(s => s.peerAssignment);
  const fetchPeerAssignment = useRecoveryStore(s => s.fetchPeerAssignment);

  useFocusEffect(
    useCallback(() => {
      fetchPeerAssignment();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPeerAssignment();
    setRefreshing(false);
  };

  const handleCheckIn = async () => {
    if (!peerAssignment) return;
    setSubmitting(true);
    try {
      await recoveryService.logPeerCheckIn(peerAssignment._id, {
        mood: checkInMood,
        notes: checkInNote || undefined,
      });
      setCheckInNote('');
      Alert.alert('Logged', 'Peer check-in recorded successfully.');
      fetchPeerAssignment();
    } catch {
      Alert.alert('Error', 'Failed to log check-in.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!peerAssignment) {
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
        <Header title="Peer Support" onBack={() => navigation.goBack()} />
        <ScrollView
          contentContainerStyle={{flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40}}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }>
          <UserCheck size={48} color={colors.mutedForeground} />
          <Text style={{fontSize: 16, fontWeight: '600', color: colors.foreground, marginTop: 16}}>
            No Peer Assignment
          </Text>
          <Text style={{fontSize: 13, color: colors.mutedForeground, textAlign: 'center', marginTop: 6}}>
            Peer support pairs you with someone on a similar recovery journey. Your care team will set this up when appropriate.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const peerProfile = peerAssignment.peer?.profile;
  const peerName = peerProfile
    ? `${peerProfile.first_name} ${peerProfile.last_name}`
    : 'Your Peer';

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
      <Header title="Peer Support" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={{padding: 16, paddingBottom: 40, gap: 16}}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }>
        {/* Peer Profile Card */}
        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: `${colors.success}30`,
            borderRadius: 20,
            padding: 20,
            alignItems: 'center',
          }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: `${colors.success}15`,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <UserCheck size={28} color={colors.success} />
          </View>
          <Text style={{fontSize: 18, fontWeight: '700', color: colors.foreground, marginTop: 10}}>
            {peerName}
          </Text>

          <View style={{flexDirection: 'row', gap: 16, marginTop: 12}}>
            {peerAssignment.match_score != null && (
              <View style={{alignItems: 'center'}}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                  <Star size={14} color="#f59e0b" />
                  <Text style={{fontSize: 16, fontWeight: '700', color: colors.foreground}}>
                    {peerAssignment.match_score}%
                  </Text>
                </View>
                <Text style={{fontSize: 10, color: colors.mutedForeground}}>Match</Text>
              </View>
            )}
            {peerAssignment.shared_substance && (
              <View style={{alignItems: 'center'}}>
                <Text style={{fontSize: 14, fontWeight: '600', color: colors.foreground, textTransform: 'capitalize'}}>
                  {peerAssignment.shared_substance}
                </Text>
                <Text style={{fontSize: 10, color: colors.mutedForeground}}>Shared Substance</Text>
              </View>
            )}
            {peerAssignment.gender_match && (
              <View style={{alignItems: 'center'}}>
                <Text style={{fontSize: 14, fontWeight: '600', color: colors.success}}>Yes</Text>
                <Text style={{fontSize: 10, color: colors.mutedForeground}}>Gender Match</Text>
              </View>
            )}
          </View>
        </View>

        {/* Log Check-in */}
        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 16,
            padding: 16,
          }}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12}}>
            <MessageSquare size={16} color={colors.primary} />
            <Text style={{fontSize: 13, fontWeight: '700', color: colors.foreground}}>
              Log Peer Check-in
            </Text>
          </View>

          {/* Mood selector */}
          <View style={{marginBottom: 12}}>
            <Text style={{fontSize: 12, color: colors.mutedForeground, marginBottom: 6}}>
              How are you feeling? ({checkInMood}/10)
            </Text>
            <View style={{flexDirection: 'row', gap: 6}}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                <TouchableOpacity
                  key={val}
                  onPress={() => setCheckInMood(val)}
                  style={{
                    flex: 1,
                    height: 28,
                    borderRadius: 6,
                    backgroundColor: val <= checkInMood ? colors.primary : colors.muted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: '700',
                      color: val <= checkInMood ? colors.white : colors.mutedForeground,
                    }}>
                    {val}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TextInput
            value={checkInNote}
            onChangeText={setCheckInNote}
            placeholder="Add notes about your check-in..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={{
              backgroundColor: colors.muted,
              borderRadius: 10,
              padding: 12,
              fontSize: 13,
              color: colors.foreground,
              minHeight: 60,
              textAlignVertical: 'top',
              marginBottom: 12,
            }}
          />

          <TouchableOpacity
            activeOpacity={0.7}
            disabled={submitting}
            onPress={handleCheckIn}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 10,
              paddingVertical: 12,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 6,
            }}>
            <Send size={14} color={colors.white} />
            <Text style={{fontSize: 14, fontWeight: '600', color: colors.white}}>
              {submitting ? 'Submitting...' : 'Log Check-in'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Check-in History */}
        {peerAssignment.check_ins && peerAssignment.check_ins.length > 0 && (
          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              padding: 16,
            }}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12}}>
              <Clock size={16} color={colors.mutedForeground} />
              <Text style={{fontSize: 13, fontWeight: '700', color: colors.foreground}}>
                Check-in History
              </Text>
            </View>
            {peerAssignment.check_ins.slice(0, 10).map((ci, i) => (
              <View
                key={ci._id || i}
                style={{
                  paddingVertical: 10,
                  borderTopWidth: i > 0 ? 1 : 0,
                  borderTopColor: colors.border,
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 10,
                }}>
                <SmilePlus size={14} color={colors.primary} style={{marginTop: 2}} />
                <View style={{flex: 1}}>
                  {ci.mood != null && (
                    <Text style={{fontSize: 12, fontWeight: '600', color: colors.foreground}}>
                      Mood: {ci.mood}/10
                    </Text>
                  )}
                  {ci.notes && (
                    <Text style={{fontSize: 12, color: colors.mutedForeground, marginTop: 2}}>
                      {ci.notes}
                    </Text>
                  )}
                  <Text style={{fontSize: 10, color: colors.mutedForeground, marginTop: 4}}>
                    {formatDate(ci.created_at)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'});
}
