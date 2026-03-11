import React, { useCallback } from 'react';
import { RefreshControl, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Pill } from 'lucide-react-native';

import { useDrugsByCategoryQuery } from '../../hooks/queries';
import DrugCard from '../../components/pharmacy/DrugCard';
import { Header, EmptyState } from '../../components/ui';
import { colors } from '../../theme/colors';
import type { Drug } from '../../types/pharmacy.types';
import type { PharmacyStackParamList } from '../../navigation/stacks/PharmacyStack';

export default function DrugCategoryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<PharmacyStackParamList, 'DrugCategory'>>();
  const { categoryId, categoryName } = route.params;

  const {
    data,
    isLoading: catalogLoading,
    isFetching,
    refetch,
  } = useDrugsByCategoryQuery(categoryId);
  const categoryDrugs = data?.drugs ?? [];

  const onRefresh = useCallback(() => refetch(), [refetch]);

  const handleDrugPress = (drug: Drug) => {
    navigation.navigate('DrugDetail', { drugId: drug._id });
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title={categoryName} onBack={() => navigation.goBack()} />

      <FlashList<Drug>
        data={categoryDrugs}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <DrugCard drug={item} variant="full" onPress={handleDrugPress} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        estimatedItemSize={100}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={onRefresh} />}
        ListEmptyComponent={
          catalogLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <EmptyState
              icon={<Pill size={32} color={colors.mutedForeground} />}
              title="No drugs"
              subtitle={`No drugs found in ${categoryName}`}
            />
          )
        }
      />
    </SafeAreaView>
  );
}
