import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { Pill } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import DrugCard from '../../components/pharmacy/DrugCard';
import { EmptyState, Header } from '../../components/ui';
import { useDrugsByCategoryQuery } from '../../hooks/queries';
import type { PharmacyStackParamList } from '../../navigation/stacks/PharmacyStack';
import { colors } from '../../theme/colors';
import type { Drug } from '../../types/pharmacy.types';

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
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        estimatedItemSize={100}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={onRefresh} />}
        ListEmptyComponent={
          catalogLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loading} />
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

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 100,
  },
  loading: {
    marginTop: 40,
  },
});
