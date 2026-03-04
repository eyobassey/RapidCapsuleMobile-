import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import {
  Pill,
  User,
  CheckCircle,
  Clock,
  Truck,
  Package,
  XCircle,
  AlertTriangle,
  CreditCard,
  RotateCcw,
} from 'lucide-react-native';

import {usePrescriptionsStore} from '../../store/prescriptions';
import {Header, Avatar, StatusBadge, Button, Skeleton} from '../../components/ui';
import {colors} from '../../theme/colors';
import {formatDate, formatCurrency} from '../../utils/formatters';
import type {ProfileStackParamList} from '../../navigation/stacks/ProfileStack';
import type {SpecialistPrescriptionStatus} from '../../types/prescription.types';

const STATUS_BANNER_CONFIG: Record<string, {bg: string; icon: React.ComponentType<any>; label: string}> = {
  pending_acceptance: {bg: `${colors.secondary}20`, icon: Clock, label: 'Awaiting Your Response'},
  accepted: {bg: `${colors.primary}20`, icon: CheckCircle, label: 'Accepted'},
  pending_payment: {bg: `${colors.secondary}20`, icon: CreditCard, label: 'Payment Required'},
  paid: {bg: `${colors.success}20`, icon: CheckCircle, label: 'Payment Confirmed'},
  processing: {bg: `${colors.primary}20`, icon: Package, label: 'Being Processed'},
  dispensed: {bg: `${colors.success}20`, icon: Package, label: 'Dispensed'},
  shipped: {bg: `${colors.primary}20`, icon: Truck, label: 'On The Way'},
  delivered: {bg: `${colors.success}20`, icon: CheckCircle, label: 'Delivered'},
  cancelled: {bg: `${colors.destructive}20`, icon: XCircle, label: 'Cancelled'},
  expired: {bg: `${colors.muted}`, icon: AlertTriangle, label: 'Expired'},
  draft: {bg: `${colors.muted}`, icon: Clock, label: 'Draft'},
};

export default function PrescriptionDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ProfileStackParamList, 'PrescriptionDetail'>>();
  const prescriptionId = route.params.id;

  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const {
    currentPrescription: rx,
    isLoading,
    fetchPrescriptionById,
    acceptPrescription,
    declinePrescription,
    requestRefill,
  } = usePrescriptionsStore();

  useEffect(() => {
    if (prescriptionId) {
      fetchPrescriptionById(prescriptionId);
    }
  }, [prescriptionId, fetchPrescriptionById]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPrescriptionById(prescriptionId);
    setRefreshing(false);
  }, [prescriptionId, fetchPrescriptionById]);

  const handleAccept = () => {
    Alert.alert(
      'Accept Prescription',
      'Are you sure you want to accept this prescription?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Accept',
          onPress: async () => {
            setActionLoading('accept');
            try {
              await acceptPrescription(prescriptionId);
              await fetchPrescriptionById(prescriptionId);
              Alert.alert('Success', 'Prescription accepted successfully.');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to accept prescription.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  const handleDecline = () => {
    Alert.alert(
      'Decline Prescription',
      'Are you sure you want to decline this prescription? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setActionLoading('decline');
            try {
              await declinePrescription(prescriptionId);
              await fetchPrescriptionById(prescriptionId);
              Alert.alert('Declined', 'Prescription has been declined.');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to decline prescription.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  const handleRefill = async () => {
    setActionLoading('refill');
    try {
      await requestRefill(prescriptionId);
      Alert.alert('Refill Requested', 'Your refill request has been submitted.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to request refill.');
    } finally {
      setActionLoading(null);
    }
  };

  // Loading state
  if (isLoading && !rx) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header title="Prescription Details" onBack={() => navigation.goBack()} />
        <ScrollView className="flex-1 px-5 pt-4">
          <Skeleton height={60} borderRadius={16} className="mb-4" />
          <Skeleton height={80} borderRadius={16} className="mb-4" />
          {[1, 2, 3].map(i => (
            <View key={i} className="bg-card border border-border rounded-2xl p-4 mb-3">
              <Skeleton width={160} height={16} className="mb-2" />
              <Skeleton width={100} height={14} className="mb-2" />
              <Skeleton width={120} height={14} />
            </View>
          ))}
          <Skeleton height={100} borderRadius={16} className="mt-4" />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!rx) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header title="Prescription Details" onBack={() => navigation.goBack()} />
        <View className="flex-1 items-center justify-center p-8">
          <Pill size={40} color={colors.mutedForeground} />
          <Text className="text-lg font-bold text-foreground mt-4">
            Prescription not found
          </Text>
          <Text className="text-sm text-muted-foreground mt-1 text-center">
            This prescription may have been removed or is unavailable.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const specialist = rx.specialist_id;
  const specialistName =
    typeof specialist === 'object' && specialist?.profile
      ? `Dr. ${specialist.profile.first_name || ''} ${specialist.profile.last_name || ''}`.trim()
      : null;
  const specialistSpecialty =
    typeof specialist === 'object'
      ? specialist.profile?.specialty || specialist.specialist_category || ''
      : '';
  const specialistImage =
    typeof specialist === 'object'
      ? specialist.profile?.profile_image
      : null;

  const bannerConfig = STATUS_BANNER_CONFIG[rx.status] || STATUS_BANNER_CONFIG.draft;
  const BannerIcon = bannerConfig.icon;

  const isPending = rx.status === 'pending_acceptance';
  const isAccepted = rx.status === 'accepted' || rx.status === 'pending_payment';
  const canRefill = rx.is_refillable && rx.refills_used < rx.refill_count &&
    ['delivered', 'dispensed'].includes(rx.status);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Prescription Details" onBack={() => navigation.goBack()} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-32"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }>
        {/* Status Banner */}
        <View
          style={{backgroundColor: bannerConfig.bg}}
          className="mx-5 mt-4 rounded-2xl p-4 flex-row items-center gap-3">
          <BannerIcon size={24} color={colors.foreground} />
          <View className="flex-1">
            <Text className="text-sm font-bold text-foreground">
              {bannerConfig.label}
            </Text>
            <Text className="text-xs text-muted-foreground mt-0.5">
              #{rx.prescription_number}
            </Text>
          </View>
          <StatusBadge status={rx.status} size="md" />
        </View>

        {/* Specialist Info */}
        {specialistName && (
          <View className="mx-5 mt-4 bg-card border border-border rounded-2xl p-4">
            <Text className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
              Prescribed By
            </Text>
            <View className="flex-row items-center gap-3">
              <Avatar
                uri={specialistImage}
                firstName={typeof specialist === 'object' ? specialist.profile?.first_name : ''}
                lastName={typeof specialist === 'object' ? specialist.profile?.last_name : ''}
                size="md"
              />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">
                  {specialistName}
                </Text>
                {specialistSpecialty ? (
                  <Text className="text-xs text-muted-foreground mt-0.5">
                    {specialistSpecialty}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        )}

        {/* Clinical Notes */}
        {rx.clinical_notes ? (
          <View className="mx-5 mt-4 bg-card border border-border rounded-2xl p-4">
            <Text className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Clinical Notes
            </Text>
            <Text className="text-sm text-foreground leading-relaxed">
              {rx.clinical_notes}
            </Text>
          </View>
        ) : null}

        {/* Medications List */}
        <View className="mx-5 mt-4">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider mb-3 ml-1">
            Medications ({rx.items?.length || 0})
          </Text>

          {(rx.items || []).map((item: any, index: number) => (
            <View
              key={`${item.drug_name}-${index}`}
              className="bg-card border border-border rounded-2xl p-4 mb-3">
              <View className="flex-row items-start justify-between mb-2">
                <View className="flex-1 mr-3">
                  <Text className="text-sm font-bold text-foreground">
                    {item.drug_name}
                  </Text>
                  {item.drug_strength ? (
                    <Text className="text-xs text-muted-foreground mt-0.5">
                      {item.drug_strength}
                    </Text>
                  ) : null}
                </View>
                <Text className="text-sm font-bold text-foreground">
                  {formatCurrency(item.total_price || 0, rx.currency || 'NGN')}
                </Text>
              </View>

              <View className="flex-row flex-wrap gap-2 mt-1">
                {item.dosage ? (
                  <View className="bg-muted rounded-lg px-2.5 py-1">
                    <Text className="text-[10px] text-muted-foreground">
                      Dosage: {item.dosage}
                    </Text>
                  </View>
                ) : null}
                {item.quantity ? (
                  <View className="bg-muted rounded-lg px-2.5 py-1">
                    <Text className="text-[10px] text-muted-foreground">
                      Qty: {item.quantity}
                    </Text>
                  </View>
                ) : null}
                {item.frequency ? (
                  <View className="bg-muted rounded-lg px-2.5 py-1">
                    <Text className="text-[10px] text-muted-foreground">
                      {item.frequency}
                    </Text>
                  </View>
                ) : null}
                {item.duration ? (
                  <View className="bg-muted rounded-lg px-2.5 py-1">
                    <Text className="text-[10px] text-muted-foreground">
                      {item.duration}
                    </Text>
                  </View>
                ) : null}
              </View>

              {item.instructions ? (
                <View className="mt-2 pt-2 border-t border-border">
                  <Text className="text-xs text-muted-foreground italic">
                    {item.instructions}
                  </Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>

        {/* Price Summary */}
        <View className="mx-5 mt-2 bg-card border border-border rounded-2xl p-4">
          <Text className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
            Price Summary
          </Text>

          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-muted-foreground">Subtotal</Text>
            <Text className="text-sm text-foreground">
              {formatCurrency(rx.subtotal || 0, rx.currency || 'NGN')}
            </Text>
          </View>

          {rx.discount > 0 && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-muted-foreground">Discount</Text>
              <Text className="text-sm text-success">
                -{formatCurrency(rx.discount, rx.currency || 'NGN')}
              </Text>
            </View>
          )}

          {rx.delivery_fee > 0 && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-muted-foreground">Delivery Fee</Text>
              <Text className="text-sm text-foreground">
                {formatCurrency(rx.delivery_fee, rx.currency || 'NGN')}
              </Text>
            </View>
          )}

          <View className="flex-row justify-between pt-3 border-t border-border">
            <Text className="text-sm font-bold text-foreground">Total</Text>
            <Text className="text-lg font-bold text-foreground">
              {formatCurrency(rx.total_amount || 0, rx.currency || 'NGN')}
            </Text>
          </View>
        </View>

        {/* Tracking Info (if shipped) */}
        {rx.status === 'shipped' && (
          <View className="mx-5 mt-4 bg-card border border-border rounded-2xl p-4">
            <Text className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Tracking Information
            </Text>
            {rx.courier_name && (
              <View className="flex-row justify-between mb-1">
                <Text className="text-sm text-muted-foreground">Courier</Text>
                <Text className="text-sm text-foreground">{rx.courier_name}</Text>
              </View>
            )}
            {rx.tracking_number && (
              <View className="flex-row justify-between mb-1">
                <Text className="text-sm text-muted-foreground">Tracking #</Text>
                <Text className="text-sm text-primary font-medium">
                  {rx.tracking_number}
                </Text>
              </View>
            )}
            {rx.estimated_delivery && (
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted-foreground">Est. Delivery</Text>
                <Text className="text-sm text-foreground">
                  {formatDate(rx.estimated_delivery)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Refill Info */}
        {rx.is_refillable && (
          <View className="mx-5 mt-4 bg-card border border-border rounded-2xl p-4">
            <View className="flex-row items-center gap-2 mb-2">
              <RotateCcw size={16} color={colors.primary} />
              <Text className="text-xs text-muted-foreground uppercase tracking-wider">
                Refill Information
              </Text>
            </View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-sm text-muted-foreground">Refills Remaining</Text>
              <Text className="text-sm font-semibold text-foreground">
                {rx.refill_count - rx.refills_used} of {rx.refill_count}
              </Text>
            </View>
            {rx.next_refill_date && (
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted-foreground">Next Refill Date</Text>
                <Text className="text-sm text-foreground">
                  {formatDate(rx.next_refill_date)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Date info */}
        <View className="mx-5 mt-4 bg-card border border-border rounded-2xl p-4">
          <View className="flex-row justify-between mb-1">
            <Text className="text-sm text-muted-foreground">Prescribed</Text>
            <Text className="text-sm text-foreground">{formatDate(rx.created_at)}</Text>
          </View>
          {rx.expires_at && (
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted-foreground">Expires</Text>
              <Text className="text-sm text-foreground">{formatDate(rx.expires_at)}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {(isPending || isAccepted || canRefill) && (
        <View className="absolute bottom-0 left-0 right-0 bg-background border-t border-border px-5 pt-3 pb-8">
          {isPending && (
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button
                  variant="outline"
                  onPress={handleDecline}
                  loading={actionLoading === 'decline'}
                  disabled={!!actionLoading}>
                  <Text className="text-destructive font-bold">Decline</Text>
                </Button>
              </View>
              <View className="flex-1">
                <Button
                  variant="primary"
                  onPress={handleAccept}
                  loading={actionLoading === 'accept'}
                  disabled={!!actionLoading}>
                  Accept
                </Button>
              </View>
            </View>
          )}

          {isAccepted && (
            <Button
              variant="primary"
              icon={<CreditCard size={20} color={colors.white} />}
              disabled>
              Pay {formatCurrency(rx.total_amount || 0, rx.currency || 'NGN')}
            </Button>
          )}

          {canRefill && (
            <Button
              variant="outline"
              icon={<RotateCcw size={18} color={colors.foreground} />}
              onPress={handleRefill}
              loading={actionLoading === 'refill'}
              disabled={!!actionLoading}>
              Request Refill
            </Button>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
