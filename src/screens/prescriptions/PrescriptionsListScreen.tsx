import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {View, Text, RefreshControl, TextInput} from 'react-native';
import {FlashList} from '@shopify/flash-list';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {Pill, Search, X, Upload} from 'lucide-react-native';
import {TouchableOpacity} from 'react-native';

import {usePrescriptionsStore} from '../../store/prescriptions';
import {Header, TabBar, EmptyState, Skeleton} from '../../components/ui';
import PrescriptionCard from '../../components/prescriptions/PrescriptionCard';
import {colors} from '../../theme/colors';

const FILTER_TABS = [
  {label: 'All', value: ''},
  {label: 'From Doctor', value: 'internal'},
  {label: 'My Orders', value: 'orders'},
  {label: 'Uploaded', value: 'external'},
  {label: 'Pending', value: 'pending'},
  {label: 'Processing', value: 'processing'},
  {label: 'Delivered', value: 'delivered'},
];

export default function PrescriptionsListScreen() {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const {
    prescriptions,
    isLoading,
    filter,
    searchQuery,
    setFilter,
    setSearchQuery,
    fetchPrescriptions,
  } = usePrescriptionsStore();

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPrescriptions();
    setRefreshing(false);
  }, [fetchPrescriptions]);

  const filteredPrescriptions = useMemo(() => {
    let result = [...prescriptions];

    // Filter by tab
    if (filter === 'internal') {
      result = result.filter((p: any) => p.type === 'INTERNAL');
    } else if (filter === 'orders') {
      result = result.filter(
        (p: any) =>
          p.type === 'ORDER' ||
          p.linked_pharmacy_order ||
          (p.used_in_orders && p.used_in_orders.length > 0),
      );
    } else if (filter === 'external') {
      result = result.filter((p: any) => p.type === 'EXTERNAL');
    } else if (filter === 'pending') {
      result = result.filter(
        (p: any) =>
          p.status === 'pending_payment' ||
          p.status === 'pending_acceptance' ||
          p.payment_status === 'pending' ||
          p.payment_status === 'PENDING' ||
          p.status === 'PENDING' ||
          p.status === 'pending',
      );
    } else if (filter === 'processing') {
      result = result.filter((p: any) =>
        ['processing', 'paid', 'dispensed', 'shipped', 'confirmed', 'ready_for_pickup', 'out_for_delivery'].includes(
          p.status?.toLowerCase(),
        ),
      );
    } else if (filter === 'delivered') {
      result = result.filter(
        (p: any) =>
          p.status === 'delivered' ||
          p.status === 'DELIVERED' ||
          p.status === 'COMPLETED',
      );
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p: any) => {
        const rxNum = (p.prescription_number || '').toLowerCase();
        const doctorName = getDoctorName(p).toLowerCase();
        const drugs = (p.items || [])
          .map((i: any) => (i.drug_name || i.drug || '').toLowerCase())
          .join(' ');
        return rxNum.includes(q) || doctorName.includes(q) || drugs.includes(q);
      });
    }

    return result;
  }, [prescriptions, filter, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: prescriptions.length,
      pending: prescriptions.filter(
        (p: any) =>
          p.status === 'pending_payment' ||
          p.status === 'pending_acceptance' ||
          p.payment_status === 'pending' ||
          p.status === 'pending',
      ).length,
      processing: prescriptions.filter((p: any) =>
        ['processing', 'paid', 'dispensed', 'shipped'].includes(p.status?.toLowerCase()),
      ).length,
    };
  }, [prescriptions]);

  const handlePress = (item: any) => {
    if (item.type === 'ORDER') {
      navigation.navigate('Pharmacy', {screen: 'OrderDetail', params: {orderId: item._id}});
    } else if (item.prescription_source === 'patient_upload') {
      navigation.navigate('Pharmacy', {screen: 'UploadDetail', params: {uploadId: item._id}});
    } else {
      navigation.navigate('PrescriptionDetail', {id: item._id});
    }
  };

  if (isLoading && prescriptions.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header title="Prescriptions" onBack={() => navigation.goBack()} />
        <View className="px-5 pt-4">
          <View className="mb-4">
            <Skeleton height={44} borderRadius={12} />
          </View>
          {[1, 2, 3, 4].map(i => (
            <View key={i} className="bg-card border border-border rounded-2xl p-4 mb-3">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <Skeleton width={32} height={32} borderRadius={16} />
                  <Skeleton width={100} height={16} />
                </View>
                <Skeleton width={70} height={22} borderRadius={11} />
              </View>
              <Skeleton width={150} height={12} className="mb-2" />
              <Skeleton width={120} height={12} className="mb-3" />
              <View className="flex-row justify-between pt-3 border-t border-border">
                <Skeleton width={100} height={12} />
                <Skeleton width={80} height={14} />
              </View>
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header
        title="Prescriptions"
        onBack={() => navigation.goBack()}
        rightAction={
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => setShowSearch(!showSearch)}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              {showSearch ? (
                <X size={22} color={colors.foreground} />
              ) : (
                <Search size={22} color={colors.foreground} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Pharmacy', {screen: 'UploadPrescription'})}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Upload size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Search bar */}
      {showSearch && (
        <View className="px-5 pt-3">
          <View className="flex-row items-center bg-card border border-border rounded-2xl px-4 h-11">
            <Search size={16} color={colors.mutedForeground} />
            <TextInput
              className="flex-1 ml-2 text-sm text-foreground"
              placeholder="Search by drug, doctor, or Rx number..."
              placeholderTextColor={colors.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      )}

      {/* Stats row */}
      {!showSearch && stats.total > 0 && (
        <View className="flex-row px-5 pt-3 pb-1 gap-3">
          <View className="flex-1 bg-card border border-border rounded-xl px-3 py-2 items-center">
            <Text className="text-lg font-bold text-foreground">{stats.total}</Text>
            <Text className="text-[10px] text-muted-foreground">Total</Text>
          </View>
          <View className="flex-1 bg-card border border-border rounded-xl px-3 py-2 items-center">
            <Text className="text-lg font-bold text-secondary">{stats.pending}</Text>
            <Text className="text-[10px] text-muted-foreground">Pending</Text>
          </View>
          <View className="flex-1 bg-card border border-border rounded-xl px-3 py-2 items-center">
            <Text className="text-lg font-bold text-primary">{stats.processing}</Text>
            <Text className="text-[10px] text-muted-foreground">Processing</Text>
          </View>
        </View>
      )}

      <View className="px-5 pt-3 pb-2">
        <TabBar
          tabs={FILTER_TABS}
          activeTab={filter}
          onChange={setFilter}
        />
      </View>

      <FlashList
        data={filteredPrescriptions}
        keyExtractor={(item: any) => item._id}
        contentContainerClassName="px-5 pt-2 pb-8"
        showsVerticalScrollIndicator={false}
        estimatedItemSize={120}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        renderItem={({item}) => (
          <PrescriptionCard
            prescription={item}
            onPress={() => handlePress(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon={<Pill size={32} color={colors.mutedForeground} />}
            title="No prescriptions"
            subtitle={
              filter || searchQuery
                ? 'No prescriptions match your search or filter.'
                : 'You have no prescriptions yet. They will appear here when prescribed by a specialist.'
            }
          />
        }
      />
    </SafeAreaView>
  );
}

function getDoctorName(prescription: any): string {
  const specialist = prescription.specialist_id;
  if (typeof specialist === 'object' && specialist?.profile) {
    return `Dr. ${specialist.profile.first_name || ''} ${specialist.profile.last_name || ''}`.trim();
  }
  const prescribedBy = prescription.prescribed_by;
  if (typeof prescribedBy === 'object' && prescribedBy?.profile) {
    return `${prescribedBy.profile.first_name || ''} ${prescribedBy.profile.last_name || ''}`.trim();
  }
  if (prescription.ocr_data?.doctor_name) {
    return `Dr. ${prescription.ocr_data.doctor_name}`;
  }
  return '';
}
