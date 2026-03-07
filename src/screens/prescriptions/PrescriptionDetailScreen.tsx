import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  RefreshControl,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import {WebView} from 'react-native-webview';
import {
  Pill,
  CheckCircle,
  Clock,
  Truck,
  Package,
  XCircle,
  AlertTriangle,
  CreditCard,
  Wallet,
  RotateCcw,
  X,
  Star,
  Calendar,
  FileText,
} from 'lucide-react-native';

import {usePrescriptionsStore} from '../../store/prescriptions';
import {Header, Avatar, StatusBadge, Button, Skeleton} from '../../components/ui';
import {colors} from '../../theme/colors';
import {formatDate} from '../../utils/formatters';
import {useCurrency} from '../../hooks/useCurrency';
import type {ProfileStackParamList} from '../../navigation/stacks/ProfileStack';

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

const TIMELINE_ICONS: Record<string, React.ComponentType<any>> = {
  pending_acceptance: Clock,
  accepted: CheckCircle,
  pending_payment: CreditCard,
  paid: CheckCircle,
  processing: Package,
  dispensed: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
  expired: AlertTriangle,
  draft: Clock,
};

export default function PrescriptionDetailScreen() {
  const {format} = useCurrency();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ProfileStackParamList, 'PrescriptionDetail'>>();
  const prescriptionId = route.params.id;

  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);
  const [paystackUrl, setPaystackUrl] = useState<string | null>(null);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const {
    currentPrescription: rx,
    isLoading,
    fetchPrescriptionById,
    acceptPrescription,
    declinePrescription,
    requestRefill,
    initializePayment,
    payWithWallet,
    verifyPayment,
    ratePrescription,
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

  const handlePayWithCard = async () => {
    setShowPaymentPicker(false);
    setActionLoading('pay');
    try {
      const data = await initializePayment(prescriptionId);
      if (data?.authorization_url) {
        setPaymentReference(data.reference);
        setPaystackUrl(data.authorization_url);
      } else {
        Alert.alert('Error', 'Could not initialize payment.');
      }
    } catch (err: any) {
      Alert.alert('Payment Error', err?.response?.data?.message || 'Failed to start payment.');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePayWithWallet = async () => {
    setShowPaymentPicker(false);
    setActionLoading('pay');
    try {
      await payWithWallet(prescriptionId);
      Alert.alert('Payment Successful', 'Your prescription has been paid for.');
      await fetchPrescriptionById(prescriptionId);
    } catch (err: any) {
      Alert.alert(
        'Payment Failed',
        err?.response?.data?.message || 'Insufficient wallet balance. Try card payment.',
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handlePaystackNavigation = useCallback(
    (navState: {url: string}) => {
      const url = navState.url || '';
      if (
        paystackUrl &&
        url !== paystackUrl &&
        !url.includes('paystack.co') &&
        !url.includes('paystack.com')
      ) {
        setPaystackUrl(null);
        if (paymentReference) {
          verifyPayment(prescriptionId, paymentReference)
            .then(() => fetchPrescriptionById(prescriptionId))
            .catch(() => {});
          setPaymentReference(null);
        }
      }
    },
    [paystackUrl, paymentReference, prescriptionId, verifyPayment, fetchPrescriptionById],
  );

  const handleClosePaystack = useCallback(() => {
    setPaystackUrl(null);
    if (paymentReference) {
      verifyPayment(prescriptionId, paymentReference)
        .then(() => fetchPrescriptionById(prescriptionId))
        .catch(() => {});
      setPaymentReference(null);
    }
  }, [paymentReference, prescriptionId, verifyPayment, fetchPrescriptionById]);

  const handleSubmitRating = async () => {
    if (ratingValue === 0) {
      Alert.alert('Rating Required', 'Please select a star rating.');
      return;
    }
    setActionLoading('rate');
    try {
      await ratePrescription(prescriptionId, ratingValue, reviewText.trim() || undefined);
      setShowRating(false);
      Alert.alert('Thank you!', 'Your rating has been submitted.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to submit rating.');
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
      ? specialist.profile?.profile_photo || specialist.profile?.profile_image
      : null;

  const bannerConfig = STATUS_BANNER_CONFIG[rx.status] || STATUS_BANNER_CONFIG.draft;
  const BannerIcon = bannerConfig.icon;

  const isPending = rx.status === 'pending_acceptance';
  const isAccepted = rx.status === 'accepted' || rx.status === 'pending_payment';
  const canRefill = rx.is_refillable && rx.refills_used < rx.refill_count &&
    ['delivered', 'dispensed'].includes(rx.status);
  const canRate = rx.status === 'delivered' && !rx.rating;

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
          style={{backgroundColor: bannerConfig.bg, marginHorizontal: 20, marginTop: 16, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12}}>
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

        {/* Linked Appointment */}
        {rx.appointment_id && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('AppointmentDetail', {id: typeof rx.appointment_id === 'object' ? rx.appointment_id._id : rx.appointment_id})}
            className="mx-5 mt-4 bg-card border border-border rounded-2xl p-4 flex-row items-center gap-3">
            <Calendar size={18} color={colors.primary} />
            <Text className="text-sm text-primary font-medium flex-1">
              View Linked Appointment
            </Text>
          </TouchableOpacity>
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
                {item.total_price ? (
                  <Text className="text-sm font-bold text-foreground">
                    {format(item.total_price)}
                  </Text>
                ) : null}
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
        {(rx.subtotal > 0 || rx.total_amount > 0) && (
          <View className="mx-5 mt-2 bg-card border border-border rounded-2xl p-4">
            <Text className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
              Price Summary
            </Text>

            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-muted-foreground">Subtotal</Text>
              <Text className="text-sm text-foreground">
                {format(rx.subtotal || 0)}
              </Text>
            </View>

            {rx.discount > 0 && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-muted-foreground">Discount</Text>
                <Text className="text-sm text-success">
                  -{format(rx.discount)}
                </Text>
              </View>
            )}

            {rx.delivery_fee > 0 && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-muted-foreground">Delivery Fee</Text>
                <Text className="text-sm text-foreground">
                  {format(rx.delivery_fee)}
                </Text>
              </View>
            )}

            <View className="flex-row justify-between pt-3 border-t border-border">
              <Text className="text-sm font-bold text-foreground">Total</Text>
              <Text className="text-lg font-bold text-foreground">
                {format(rx.total_amount || 0)}
              </Text>
            </View>
          </View>
        )}

        {/* Status Timeline */}
        {rx.status_history && rx.status_history.length > 0 && (
          <View className="mx-5 mt-4 bg-card border border-border rounded-2xl p-4">
            <Text className="text-xs text-muted-foreground uppercase tracking-wider mb-4">
              Status Timeline
            </Text>
            {rx.status_history.map((entry: any, idx: number) => {
              const TimelineIcon = TIMELINE_ICONS[entry.status] || Clock;
              const isLast = idx === rx.status_history.length - 1;
              const statusLabel = STATUS_BANNER_CONFIG[entry.status]?.label || entry.status;
              return (
                <View key={idx}>
                  <View className="flex-row gap-3">
                    <View className="items-center">
                      <View
                        className="w-7 h-7 rounded-full items-center justify-center"
                        style={{backgroundColor: isLast ? `${colors.primary}20` : `${colors.muted}`}}>
                        <TimelineIcon
                          size={14}
                          color={isLast ? colors.primary : colors.mutedForeground}
                        />
                      </View>
                      {!isLast && (
                        <View
                          style={{
                            width: 2,
                            height: 20,
                            backgroundColor: colors.border,
                          }}
                        />
                      )}
                    </View>
                    <View className="flex-1 pb-3">
                      <Text
                        className={`text-sm font-medium ${isLast ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {statusLabel}
                      </Text>
                      <Text className="text-[11px] text-muted-foreground mt-0.5">
                        {formatDate(entry.changed_at)}
                      </Text>
                      {entry.notes ? (
                        <Text className="text-xs text-muted-foreground mt-0.5 italic">
                          {entry.notes}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

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

        {/* Pickup Info */}
        {rx.is_pickup_order && rx.pickup_code && (
          <View className="mx-5 mt-4 bg-primary/10 border border-primary/20 rounded-2xl p-4">
            <Text className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Pickup Code
            </Text>
            <Text className="text-2xl font-bold text-primary text-center tracking-widest">
              {rx.pickup_code}
            </Text>
            <Text className="text-xs text-muted-foreground text-center mt-1">
              Show this code when picking up your prescription
            </Text>
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

        {/* Existing Rating */}
        {rx.rating && (
          <View className="mx-5 mt-4 bg-card border border-border rounded-2xl p-4">
            <Text className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Your Rating
            </Text>
            <View className="flex-row gap-1 mb-1">
              {[1, 2, 3, 4, 5].map(s => (
                <Star
                  key={s}
                  size={18}
                  color={s <= rx.rating ? '#f59e0b' : colors.border}
                  fill={s <= rx.rating ? '#f59e0b' : 'transparent'}
                />
              ))}
            </View>
            {rx.review ? (
              <Text className="text-xs text-muted-foreground mt-1">
                "{rx.review}"
              </Text>
            ) : null}
          </View>
        )}

        {/* Linked Pharmacy Order */}
        {rx.linked_pharmacy_order && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('OrderDetail', {orderId: rx.linked_pharmacy_order})}
            className="mx-5 mt-4 bg-card border border-border rounded-2xl p-4 flex-row items-center gap-3">
            <Package size={18} color={colors.primary} />
            <View className="flex-1">
              <Text className="text-sm text-primary font-medium">
                View Pharmacy Order
              </Text>
              {rx.linked_pharmacy_order_number && (
                <Text className="text-xs text-muted-foreground">
                  #{rx.linked_pharmacy_order_number}
                </Text>
              )}
            </View>
          </TouchableOpacity>
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
          {rx.pdf_url && (
            <TouchableOpacity
              className="mt-3 pt-3 border-t border-border flex-row items-center gap-2"
              activeOpacity={0.7}
              onPress={() => {/* Could open PDF in browser */}}>
              <FileText size={16} color={colors.primary} />
              <Text className="text-sm text-primary font-medium">Download PDF</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {(isPending || isAccepted || canRefill || canRate) && (
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
              icon={<CreditCard size={20} color="#fff" />}
              onPress={() => setShowPaymentPicker(true)}
              loading={actionLoading === 'pay'}
              disabled={!!actionLoading}>
              Pay {format(rx.total_amount || 0)}
            </Button>
          )}

          {canRefill && !canRate && (
            <Button
              variant="outline"
              icon={<RotateCcw size={18} color={colors.foreground} />}
              onPress={handleRefill}
              loading={actionLoading === 'refill'}
              disabled={!!actionLoading}>
              Request Refill
            </Button>
          )}

          {canRate && (
            <View className="flex-row gap-3">
              {canRefill && (
                <View className="flex-1">
                  <Button
                    variant="outline"
                    icon={<RotateCcw size={16} color={colors.foreground} />}
                    onPress={handleRefill}
                    loading={actionLoading === 'refill'}
                    disabled={!!actionLoading}>
                    Refill
                  </Button>
                </View>
              )}
              <View className="flex-1">
                <Button
                  variant="primary"
                  icon={<Star size={16} color="#fff" />}
                  onPress={() => setShowRating(true)}>
                  Rate
                </Button>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Payment Method Picker Modal */}
      <Modal
        visible={showPaymentPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentPicker(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowPaymentPicker(false)}
          style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'}}>
          <View style={{backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40}}>
            <Text style={{fontSize: 16, fontWeight: '700', color: colors.foreground, marginBottom: 16}}>
              Choose Payment Method
            </Text>

            <TouchableOpacity
              onPress={handlePayWithCard}
              activeOpacity={0.7}
              style={{flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.background, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 12}}>
              <CreditCard size={22} color={colors.primary} />
              <View style={{marginLeft: 12, flex: 1}}>
                <Text style={{fontSize: 14, fontWeight: '600', color: colors.foreground}}>
                  Pay with Card
                </Text>
                <Text style={{fontSize: 12, color: colors.mutedForeground, marginTop: 2}}>
                  Visa, Mastercard via Paystack
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePayWithWallet}
              activeOpacity={0.7}
              style={{flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.background, borderRadius: 16, borderWidth: 1, borderColor: colors.border}}>
              <Wallet size={22} color={colors.primary} />
              <View style={{marginLeft: 12, flex: 1}}>
                <Text style={{fontSize: 14, fontWeight: '600', color: colors.foreground}}>
                  Pay with Wallet
                </Text>
                <Text style={{fontSize: 12, color: colors.mutedForeground, marginTop: 2}}>
                  Use your RapidCapsule wallet balance
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Rating Modal */}
      <Modal
        visible={showRating}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRating(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowRating(false)}
          style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'}}>
          <TouchableOpacity activeOpacity={1}>
            <View style={{backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40}}>
              <Text style={{fontSize: 16, fontWeight: '700', color: colors.foreground, marginBottom: 4}}>
                Rate this prescription
              </Text>
              <Text style={{fontSize: 13, color: colors.mutedForeground, marginBottom: 20}}>
                How was your experience with this prescription?
              </Text>

              <View style={{flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20}}>
                {[1, 2, 3, 4, 5].map(s => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setRatingValue(s)}
                    hitSlop={{top: 8, bottom: 8, left: 4, right: 4}}>
                    <Star
                      size={36}
                      color={s <= ratingValue ? '#f59e0b' : colors.border}
                      fill={s <= ratingValue ? '#f59e0b' : 'transparent'}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={{
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 16,
                  padding: 14,
                  fontSize: 14,
                  color: colors.foreground,
                  minHeight: 80,
                  textAlignVertical: 'top',
                  marginBottom: 16,
                }}
                placeholder="Write a review (optional)"
                placeholderTextColor={colors.mutedForeground}
                value={reviewText}
                onChangeText={setReviewText}
                multiline
              />

              <Button
                variant="primary"
                onPress={handleSubmitRating}
                loading={actionLoading === 'rate'}>
                Submit Rating
              </Button>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Paystack WebView Modal */}
      <Modal
        visible={!!paystackUrl}
        animationType="slide"
        onRequestClose={handleClosePaystack}>
        <View style={{flex: 1, backgroundColor: colors.background}}>
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border}}>
            <Text style={{fontSize: 16, fontWeight: '700', color: colors.foreground}}>
              Complete Payment
            </Text>
            <TouchableOpacity onPress={handleClosePaystack} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <X size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          {paystackUrl && (
            <WebView
              source={{uri: paystackUrl}}
              onNavigationStateChange={handlePaystackNavigation}
              startInLoadingState
              renderLoading={() => (
                <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center'}}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              )}
              style={{flex: 1}}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
