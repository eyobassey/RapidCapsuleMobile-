import React, {useCallback, useEffect, useState} from 'react';
import {View, FlatList, RefreshControl} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {FileImage, Upload} from 'lucide-react-native';

import {usePrescriptionUploadStore} from '../../store/prescriptionUpload';
import UploadCard from '../../components/prescriptions/UploadCard';
import {Header, TabBar, EmptyState, Skeleton} from '../../components/ui';
import {colors} from '../../theme/colors';
import type {PrescriptionUpload} from '../../types/prescriptionUpload.types';

const TABS = [
  {label: 'All', value: ''},
  {label: 'Pending', value: 'pending'},
  {label: 'In Progress', value: 'in_progress'},
  {label: 'Approved', value: 'approved'},
  {label: 'Rejected', value: 'rejected'},
];

// Map tab value to matching verification statuses for client-side filtering
const TAB_STATUS_MAP: Record<string, Set<string>> = {
  pending: new Set(['PENDING']),
  in_progress: new Set([
    'TIER1_PROCESSING',
    'TIER1_PASSED',
    'TIER2_PROCESSING',
    'TIER2_PASSED',
    'PHARMACIST_REVIEW',
    'CLARIFICATION_NEEDED',
    'CLARIFICATION_RECEIVED',
  ]),
  approved: new Set(['APPROVED']),
  rejected: new Set(['REJECTED', 'TIER1_FAILED', 'TIER2_FAILED', 'EXPIRED']),
};

export default function MyUploadsScreen() {
  const navigation = useNavigation<any>();
  const {uploads, isLoading, fetchUploads, filter, setFilter} =
    usePrescriptionUploadStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUploads();
    setRefreshing(false);
  }, [fetchUploads]);

  const handleTabChange = (value: string) => {
    setFilter(value);
  };

  // Client-side filtering based on tab
  const filteredUploads = filter
    ? uploads.filter(u => TAB_STATUS_MAP[filter]?.has(u.verification_status))
    : uploads;

  const handlePress = (upload: PrescriptionUpload) => {
    navigation.navigate('UploadDetail', {uploadId: upload._id});
  };

  const isFirstLoad = isLoading && uploads.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header
        title="My Prescriptions"
        onBack={() => navigation.goBack()}
        rightAction={
          <Upload
            size={22}
            color={colors.primary}
            onPress={() => navigation.navigate('UploadPrescription')}
          />
        }
      />

      <TabBar tabs={TABS} activeTab={filter} onChange={handleTabChange} />

      {isFirstLoad ? (
        <View className="px-5 pt-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} height={120} borderRadius={16} className="mb-3" />
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredUploads}
          keyExtractor={item => item._id}
          renderItem={({item}) => (
            <UploadCard upload={item} onPress={() => handlePress(item)} />
          )}
          contentContainerStyle={{paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100}}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<FileImage size={40} color={colors.mutedForeground} />}
              title="No prescriptions"
              subtitle={
                filter
                  ? 'No prescriptions match this filter.'
                  : 'Upload a prescription to get started.'
              }
              actionLabel="Upload Prescription"
              onAction={() => navigation.navigate('UploadPrescription')}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
