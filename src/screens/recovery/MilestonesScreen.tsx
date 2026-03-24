import React, { useCallback, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Trophy } from 'lucide-react-native';
import { Header, Text } from '../../components/ui';
import MilestoneCard from '../../components/recovery/MilestoneCard';
import { colors } from '../../theme/colors';
import { useRecoveryStore } from '../../store/recovery';
import { recoveryService } from '../../services/recovery.service';

export default function MilestonesScreen() {
  const navigation = useNavigation<any>();
  const milestones = useRecoveryStore((s) => s.milestones);
  const fetchMilestones = useRecoveryStore((s) => s.fetchMilestones);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchMilestones().finally(() => setLoading(false));
    }, [fetchMilestones])
  );

  const handleCelebrate = async (id: string) => {
    try {
      await recoveryService.celebrateMilestone(id);
      await fetchMilestones();
    } catch {
      // ignore
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <Header title="Milestones" onBack={() => navigation.goBack()} />

      <FlashList
        data={milestones}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16 }}
        estimatedItemSize={100}
        renderItem={({ item }) => <MilestoneCard milestone={item} onCelebrate={handleCelebrate} />}
        ListEmptyComponent={
          loading ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 }}>
              <Trophy size={40} color={colors.mutedForeground} />
              <Text
                style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginTop: 12 }}
              >
                No milestones yet
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.mutedForeground,
                  textAlign: 'center',
                  marginTop: 4,
                }}
              >
                Keep going! Milestones are awarded as you progress in your recovery journey.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
