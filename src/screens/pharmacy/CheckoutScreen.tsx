import { useNavigation } from '@react-navigation/native';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  MapPin,
  Phone,
  Store,
  Truck,
  Wallet,
  X,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button, FormInput, Header, Input, Text } from '../../components/ui';
import {
  useAddAddressMutation,
  useAddressesQuery,
  usePharmacyQuery,
  usePharmacyWalletBalanceQuery,
} from '../../hooks/queries';
import { useCurrency } from '../../hooks/useCurrency';
import { pharmacyService } from '../../services/pharmacy.service';
import { usePharmacyStore } from '../../store/pharmacy';
import { colors } from '../../theme/colors';
import type { DeliveryAddress, DeliveryMethod } from '../../types/pharmacy.types';
import { DEFAULT_PHARMACY_ID } from '../../utils/constants';
import { checkoutAddressSchema, type CheckoutAddressFormData } from '../../utils/validation';

export default function CheckoutScreen() {
  const { format } = useCurrency();
  const navigation = useNavigation<any>();
  const { cartItems, clearCart } = usePharmacyStore();
  const { data: addresses = [] } = useAddressesQuery();
  const addAddressMutation = useAddAddressMutation();
  const { data: pickupPharmacy } = usePharmacyQuery(DEFAULT_PHARMACY_ID);
  const { data: walletBalanceData } = usePharmacyWalletBalanceQuery();
  const walletBalance = walletBalanceData ?? null;

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('DELIVERY');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet'>('card');
  const [patientNotes, setPatientNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [showOrderSummary, setShowOrderSummary] = useState(false);

  // Address form
  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddress | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const addressForm = useForm<CheckoutAddressFormData>({
    resolver: zodResolver(checkoutAddressSchema),
    defaultValues: {
      label: 'Home',
      recipient_name: '',
      phone: '',
      street: '',
      city: '',
      state: '',
    },
  });

  // Auto-select default address
  useEffect(() => {
    if (!selectedAddress && addresses.length > 0) {
      const defaultAddr = addresses.find((a) => a.is_default) || addresses[0];
      setSelectedAddress(defaultAddr);
    }
  }, [addresses, selectedAddress]);

  // Paystack WebView
  const [paystackUrl, setPaystackUrl] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const deliveryFee = deliveryMethod === 'DELIVERY' ? 1500 : 0;
  const total = subtotal + deliveryFee;

  const handleSaveAddress = addressForm.handleSubmit(async (data) => {
    try {
      await addAddressMutation.mutateAsync({
        ...data,
        is_default: addresses.length === 0,
      });
      setShowAddressForm(false);
      addressForm.reset();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save address');
    }
  });

  const handlePlaceOrder = async () => {
    if (deliveryMethod === 'DELIVERY' && !selectedAddress) {
      Alert.alert('No Address', 'Please add a delivery address.');
      return;
    }

    setPlacing(true);
    try {
      const payload: any = {
        pharmacy: DEFAULT_PHARMACY_ID,
        items: cartItems.map((i) => ({ drug: i.drugId, quantity: i.quantity })),
        delivery_method: deliveryMethod,
        patient_notes: patientNotes || undefined,
      };

      if (deliveryMethod === 'DELIVERY' && selectedAddress) {
        payload.delivery_address = {
          recipient_name: selectedAddress.recipient_name,
          phone: selectedAddress.phone,
          address_line1: selectedAddress.street || '',
          city: selectedAddress.city || '',
          state: selectedAddress.state || '',
          postal_code: selectedAddress.postal_code || '',
          landmark: selectedAddress.additional_info || '',
        };
      }

      const order = await pharmacyService.createOtcOrder(payload);
      const orderId = order?._id || order?.id;

      if (!orderId) {
        Alert.alert('Error', 'Order created but no ID returned.');
        setPlacing(false);
        return;
      }

      if (paymentMethod === 'wallet') {
        try {
          await pharmacyService.payWithWallet(orderId, total);
          clearCart();
          navigation.replace('OrderDetail', { orderId });
        } catch (err: any) {
          Alert.alert(
            'Payment Failed',
            err?.response?.data?.message || 'Insufficient wallet balance. Try card payment.'
          );
          // Order exists but unpaid — navigate to detail
          navigation.replace('OrderDetail', { orderId });
        }
      } else {
        // Card payment via Paystack
        try {
          const paymentData = await pharmacyService.initializePayment(orderId);
          if (paymentData?.authorization_url) {
            setPendingOrderId(orderId);
            setPaystackUrl(paymentData.authorization_url);
          } else {
            Alert.alert('Error', 'Could not initialize payment.');
            navigation.replace('OrderDetail', { orderId });
          }
        } catch (err: any) {
          Alert.alert('Payment Error', err?.response?.data?.message || 'Failed to start payment.');
          navigation.replace('OrderDetail', { orderId });
        }
      }
    } catch (err: any) {
      const apiMsg = err?.response?.data?.message;
      const apiErrors = err?.response?.data?.errors;
      let detail = apiMsg || err?.message || 'Failed to place order.';
      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        detail = apiErrors.join('\n');
      } else if (typeof apiErrors === 'object' && apiErrors) {
        detail = Object.values(apiErrors).flat().join('\n');
      }
      Alert.alert('Order Failed', detail);
    } finally {
      setPlacing(false);
    }
  };

  // ── Paystack WebView handlers ──
  const handlePaystackNavigation = useCallback(
    (navState: { url: string }) => {
      const url = navState.url || '';
      if (
        paystackUrl &&
        url !== paystackUrl &&
        !url.includes('paystack.co') &&
        !url.includes('paystack.com')
      ) {
        setPaystackUrl(null);
        clearCart();
        if (pendingOrderId) {
          navigation.replace('OrderDetail', { orderId: pendingOrderId });
          setPendingOrderId(null);
        }
      }
    },
    [paystackUrl, pendingOrderId, clearCart, navigation]
  );

  const handleClosePaystack = useCallback(() => {
    setPaystackUrl(null);
    clearCart();
    if (pendingOrderId) {
      navigation.replace('OrderDetail', { orderId: pendingOrderId });
      setPendingOrderId(null);
    }
  }, [pendingOrderId, clearCart, navigation]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Checkout" onBack={() => navigation.goBack()} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-4 pb-36"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Order Summary (Collapsible) */}
        <TouchableOpacity
          onPress={() => setShowOrderSummary(!showOrderSummary)}
          className="bg-card border border-border rounded-2xl p-4 flex-row items-center justify-between mb-4"
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Order summary, ${showOrderSummary ? 'expanded' : 'collapsed'}`}
          accessibilityState={{ expanded: showOrderSummary }}
        >
          <Text className="text-sm font-semibold text-foreground">
            Order Summary ({cartItems.length} item{cartItems.length > 1 ? 's' : ''})
          </Text>
          {showOrderSummary ? (
            <ChevronUp size={18} color={colors.mutedForeground} />
          ) : (
            <ChevronDown size={18} color={colors.mutedForeground} />
          )}
        </TouchableOpacity>

        {showOrderSummary && (
          <View className="bg-card border border-border rounded-2xl p-4 mb-4 -mt-2">
            {cartItems.map((item) => (
              <View key={item.drugId} className="flex-row justify-between mb-2">
                <Text className="text-sm text-foreground flex-1" numberOfLines={1}>
                  {item.name} x{item.quantity}
                </Text>
                <Text className="text-sm text-foreground font-medium ml-2">
                  {format(item.price * item.quantity)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Delivery Method */}
        <Text className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-2 ml-1">
          Delivery Method
        </Text>
        <View className="flex-row gap-3 mb-4">
          <TouchableOpacity
            onPress={() => setDeliveryMethod('DELIVERY')}
            className={`flex-1 rounded-2xl p-4 border items-center ${
              deliveryMethod === 'DELIVERY'
                ? 'bg-primary/10 border-primary'
                : 'bg-card border-border'
            }`}
            activeOpacity={0.7}
            accessibilityRole="radio"
            accessibilityLabel="Delivery"
            accessibilityState={{ selected: deliveryMethod === 'DELIVERY' }}
          >
            <Truck
              size={22}
              color={deliveryMethod === 'DELIVERY' ? colors.primary : colors.mutedForeground}
            />
            <Text
              className={`text-sm font-medium mt-1 ${
                deliveryMethod === 'DELIVERY' ? 'text-primary' : 'text-foreground'
              }`}
            >
              Delivery
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setDeliveryMethod('PICKUP')}
            className={`flex-1 rounded-2xl p-4 border items-center ${
              deliveryMethod === 'PICKUP' ? 'bg-primary/10 border-primary' : 'bg-card border-border'
            }`}
            activeOpacity={0.7}
            accessibilityRole="radio"
            accessibilityLabel="Pickup"
            accessibilityState={{ selected: deliveryMethod === 'PICKUP' }}
          >
            <Store
              size={22}
              color={deliveryMethod === 'PICKUP' ? colors.primary : colors.mutedForeground}
            />
            <Text
              className={`text-sm font-medium mt-1 ${
                deliveryMethod === 'PICKUP' ? 'text-primary' : 'text-foreground'
              }`}
            >
              Pickup
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pickup Pharmacy Info */}
        {deliveryMethod === 'PICKUP' && pickupPharmacy && (
          <View className="mb-4">
            <Text className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-2 ml-1">
              Pickup Location
            </Text>
            <View className="bg-card border border-primary rounded-2xl p-4">
              <View className="flex-row items-start">
                <Store size={16} color={colors.primary} />
                <View className="flex-1 ml-2">
                  <Text className="text-sm font-semibold text-foreground">
                    {pickupPharmacy.name}
                  </Text>
                  {pickupPharmacy.address && (
                    <Text className="text-xs text-muted-foreground mt-0.5">
                      {pickupPharmacy.address.street}, {pickupPharmacy.address.city},{' '}
                      {pickupPharmacy.address.state}
                    </Text>
                  )}
                </View>
              </View>

              {pickupPharmacy.phone && (
                <View className="flex-row items-center gap-2 mt-2">
                  <Phone size={13} color={colors.mutedForeground} />
                  <Text className="text-xs text-muted-foreground">{pickupPharmacy.phone}</Text>
                </View>
              )}

              {pickupPharmacy.operating_hours &&
                (() => {
                  const days = [
                    'SUNDAY',
                    'MONDAY',
                    'TUESDAY',
                    'WEDNESDAY',
                    'THURSDAY',
                    'FRIDAY',
                    'SATURDAY',
                  ];
                  const today = days[new Date().getDay()];
                  const todayHours = pickupPharmacy.operating_hours.find(
                    (h: any) => h.day === today
                  );
                  return todayHours ? (
                    <View className="flex-row items-center gap-2 mt-1">
                      <Clock
                        size={13}
                        color={todayHours.is_open ? colors.success : colors.destructive}
                      />
                      <Text
                        className={`text-xs ${
                          todayHours.is_open ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {todayHours.is_open
                          ? `Open today: ${todayHours.open_time} - ${todayHours.close_time}`
                          : 'Closed today'}
                      </Text>
                    </View>
                  ) : null;
                })()}

              {pickupPharmacy.pickup_instructions && (
                <View className="mt-2 pt-2 border-t border-border">
                  <Text className="text-xs text-muted-foreground italic">
                    {pickupPharmacy.pickup_instructions}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Delivery Address */}
        {deliveryMethod === 'DELIVERY' && (
          <View className="mb-4">
            <Text className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-2 ml-1">
              Delivery Address
            </Text>

            {selectedAddress ? (
              <View className="bg-card border border-primary rounded-2xl p-4">
                <View className="flex-row items-start">
                  <MapPin size={16} color={colors.primary} />
                  <View className="flex-1 ml-2">
                    <Text className="text-sm font-semibold text-foreground">
                      {selectedAddress.label}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      {selectedAddress.recipient_name}
                    </Text>
                    <Text className="text-xs text-muted-foreground mt-0.5">
                      {selectedAddress.street}, {selectedAddress.city}, {selectedAddress.state}
                    </Text>
                    <Text className="text-xs text-muted-foreground">{selectedAddress.phone}</Text>
                  </View>
                </View>
                {addresses.length > 1 && (
                  <TouchableOpacity
                    onPress={() => {
                      const idx = addresses.findIndex((a) => a._id === selectedAddress._id);
                      const next = addresses[(idx + 1) % addresses.length];
                      setSelectedAddress(next);
                    }}
                    className="mt-2"
                  >
                    <Text className="text-xs text-primary font-medium">Change address</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : !showAddressForm ? (
              <TouchableOpacity
                onPress={() => setShowAddressForm(true)}
                className="bg-card border border-border rounded-2xl p-4 items-center"
                activeOpacity={0.7}
              >
                <MapPin size={20} color={colors.mutedForeground} />
                <Text className="text-sm text-primary font-medium mt-1">Add Delivery Address</Text>
              </TouchableOpacity>
            ) : null}

            {/* Inline Address Form */}
            {showAddressForm && (
              <View className="bg-card border border-border rounded-2xl p-4 mt-2">
                <FormInput
                  control={addressForm.control}
                  name="recipient_name"
                  label="Recipient Name"
                  placeholder="Full name"
                  error={addressForm.formState.errors.recipient_name?.message}
                  containerClassName="mb-3"
                />
                <FormInput
                  control={addressForm.control}
                  name="phone"
                  label="Phone"
                  placeholder="Phone number"
                  error={addressForm.formState.errors.phone?.message}
                  keyboardType="phone-pad"
                  containerClassName="mb-3"
                />
                <FormInput
                  control={addressForm.control}
                  name="street"
                  label="Street"
                  placeholder="Street address"
                  error={addressForm.formState.errors.street?.message}
                  containerClassName="mb-3"
                />
                <View className="flex-row gap-3 mb-3">
                  <FormInput
                    control={addressForm.control}
                    name="city"
                    label="City"
                    placeholder="City"
                    error={addressForm.formState.errors.city?.message}
                    containerClassName="flex-1"
                  />
                  <FormInput
                    control={addressForm.control}
                    name="state"
                    label="State"
                    placeholder="State"
                    error={addressForm.formState.errors.state?.message}
                    containerClassName="flex-1"
                  />
                </View>
                <View className="flex-row gap-3">
                  <Button
                    variant="outline"
                    onPress={() => setShowAddressForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button variant="primary" onPress={handleSaveAddress} className="flex-1">
                    Save
                  </Button>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Payment Method */}
        <Text className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-2 ml-1">
          Payment Method
        </Text>
        <View className="flex-row gap-3 mb-4">
          <TouchableOpacity
            onPress={() => setPaymentMethod('card')}
            className={`flex-1 rounded-2xl p-4 border items-center ${
              paymentMethod === 'card' ? 'bg-primary/10 border-primary' : 'bg-card border-border'
            }`}
            activeOpacity={0.7}
            accessibilityRole="radio"
            accessibilityLabel="Pay with card"
            accessibilityState={{ selected: paymentMethod === 'card' }}
          >
            <CreditCard
              size={22}
              color={paymentMethod === 'card' ? colors.primary : colors.mutedForeground}
            />
            <Text
              className={`text-sm font-medium mt-1 ${
                paymentMethod === 'card' ? 'text-primary' : 'text-foreground'
              }`}
            >
              Card
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setPaymentMethod('wallet')}
            className={`flex-1 rounded-2xl p-4 border items-center ${
              paymentMethod === 'wallet' ? 'bg-primary/10 border-primary' : 'bg-card border-border'
            }`}
            activeOpacity={0.7}
            accessibilityRole="radio"
            accessibilityLabel="Pay with wallet"
            accessibilityState={{ selected: paymentMethod === 'wallet' }}
          >
            <Wallet
              size={22}
              color={paymentMethod === 'wallet' ? colors.primary : colors.mutedForeground}
            />
            <Text
              className={`text-sm font-medium mt-1 ${
                paymentMethod === 'wallet' ? 'text-primary' : 'text-foreground'
              }`}
            >
              Wallet
            </Text>
          </TouchableOpacity>
        </View>

        {/* Wallet Balance */}
        {paymentMethod === 'wallet' && walletBalance !== null && (
          <View
            className={`rounded-2xl p-3 mb-4 ${
              walletBalance >= total ? 'bg-success/10' : 'bg-destructive/10'
            }`}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-foreground">Wallet Balance</Text>
              <Text
                className={`text-sm font-bold ${
                  walletBalance >= total ? 'text-success' : 'text-destructive'
                }`}
              >
                {format(walletBalance)}
              </Text>
            </View>
            {walletBalance < total && (
              <Text className="text-xs text-destructive mt-1">
                Insufficient balance. You need {format(total - walletBalance)} more. Consider using
                card payment.
              </Text>
            )}
          </View>
        )}

        {/* Notes */}
        <Input
          label="Notes (Optional)"
          placeholder="Any special instructions..."
          value={patientNotes}
          onChangeText={setPatientNotes}
          multiline
          numberOfLines={2}
          containerClassName="mb-4"
        />

        {/* Price Breakdown */}
        <View className="bg-card border border-border rounded-2xl p-4">
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-muted-foreground">Subtotal</Text>
            <Text className="text-sm text-foreground">{format(subtotal)}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-muted-foreground">Delivery Fee</Text>
            <Text className="text-sm text-foreground">
              {deliveryFee > 0 ? format(deliveryFee) : 'Free'}
            </Text>
          </View>
          <View className="border-t border-border pt-2 mt-1 flex-row justify-between">
            <Text className="text-base font-bold text-foreground">Total</Text>
            <Text className="text-base font-bold text-primary">{format(total)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom */}
      <View className="absolute bottom-0 left-0 right-0 bg-background border-t border-border px-5 pt-3 pb-8">
        <Button
          variant="primary"
          onPress={handlePlaceOrder}
          loading={placing}
          disabled={cartItems.length === 0}
        >
          Place Order - {format(total)}
        </Button>
      </View>

      {/* ═══════ PAYSTACK WEBVIEW MODAL ═══════ */}
      <Modal visible={!!paystackUrl} animationType="slide" onRequestClose={handleClosePaystack}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <TouchableOpacity
              onPress={handleClosePaystack}
              style={{ padding: 4 }}
              accessibilityRole="button"
              accessibilityLabel="Close payment"
            >
              <X size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 16,
                fontWeight: '700',
                color: colors.foreground,
              }}
            >
              Complete Payment
            </Text>
            <View style={{ width: 32 }} />
          </View>

          {paystackUrl && (
            <WebView
              source={{ uri: paystackUrl }}
              onNavigationStateChange={handlePaystackNavigation}
              style={{ flex: 1 }}
              startInLoadingState
              renderLoading={() => (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.background,
                  }}
                >
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={{ marginTop: 12, fontSize: 14, color: colors.mutedForeground }}>
                    Loading payment page...
                  </Text>
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
