import React, {useCallback} from 'react';
import {View, Text, FlatList, TouchableOpacity, ActivityIndicator} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {ClipboardCheck} from 'lucide-react-native';
import {Header} from '../../components/ui';
import RiskBadge from '../../components/recovery/RiskBadge';
import {colors} from '../../theme/colors';
import {useRecoveryStore} from '../../store/recovery';
import {formatDate} from '../../utils/formatters';

export default function ScreeningHistoryScreen() {
  const navigation = useNavigation<any>();
  const history = useRecoveryStore(s => s.screeningHistory);
  const isLoading = useRecoveryStore(s => s.isLoading);
  const fetchScreeningHistory = useRecoveryStore(s => s.fetchScreeningHistory);

  useFocusEffect(
    useCallback(() => {
      fetchScreeningHistory();
    }, []),
  );

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
      <Header title="Screening History" onBack={() => navigation.goBack()} />

      <FlatList
        data={history}
        keyExtractor={item => item._id}
        contentContainerStyle={{padding: 16, gap: 10}}
        renderItem={({item}) => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate('ScreeningResult', {
                screeningId: item._id,
                result: item,
              })
            }
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 14,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: `${colors.primary}15`,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <ClipboardCheck size={18} color={colors.primary} />
            </View>
            <View style={{flex: 1}}>
              <Text style={{fontSize: 14, fontWeight: '600', color: colors.foreground}}>
                {item.instrument?.toUpperCase()}
              </Text>
              <Text style={{fontSize: 11, color: colors.mutedForeground, marginTop: 2}}>
                Score: {item.total_score} {'\u2022'} {formatDate(item.created_at)}
              </Text>
            </View>
            <RiskBadge level={item.risk_level} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          isLoading ? (
            <View style={{alignItems: 'center', paddingTop: 60}}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <View style={{alignItems: 'center', paddingTop: 60, paddingHorizontal: 40}}>
              <ClipboardCheck size={40} color={colors.mutedForeground} />
              <Text style={{fontSize: 14, fontWeight: '600', color: colors.foreground, marginTop: 12}}>
                No screenings yet
              </Text>
              <Text style={{fontSize: 12, color: colors.mutedForeground, textAlign: 'center', marginTop: 4}}>
                Complete a screening to track your progress over time.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
