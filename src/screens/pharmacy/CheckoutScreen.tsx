import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {WebView} from 'react-native-webview';
import {
  MapPin,
  Store,
  Truck,
  CreditCard,
  Wallet,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react-native';

import {usePharmacyStore} from '../../store/pharmacy';
import {Header, Input, Button} from '../../components/ui';
import {colors} from '../../theme/colors';
import {formatCurrency} from '../../utils/formatters';
import {DEFAULT_PHARMACY_ID} from '../../utils/constants';
import {pharmacyService} from '../../services/pharmacy.service';
import type {DeliveryAddress, DeliveryMethod} from '../../types/pharmacy.types';

export default function CheckoutScreen() {
  const navigation = useNavigation<any>();
  const {
    cartItems,
    addresses,
    addressesLoading,
    clearCart,
    fetchAddresses,
    addAddress,
  } = usePharmacyStore();

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('DELIVERY');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet'>('card');
  const [patientNotes, setPatientNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [showOrderSummary, setShowOrderSummary] = useState(false);

  // Address form
  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddress | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    recipient_name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
  });

  // Paystack WebView
  const [paystackUrl, setPaystackUrl] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const deliveryFee = deliveryMethod === 'DELIVERY' ? 1500 : 0;
  const total = subtotal + deliveryFee;

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Auto-select default address
  useEffect(() => {
    if (!selectedAddress && addresses.length > 0) {
      const defaultAddr = addresses.find(a => a.is_default) || addresses[0];
      setSelectedAddress(defaultAddr);
    }
  }, [addresses, selectedAddress]);

  const handleSaveAddress = async () => {
    const {recipient_name, phone, street, city, state} = newAddress;
    if (!recipient_name || !phone || !street || !city || !state) {
      Alert.alert('Missing Fields', 'Please fill in all address fields.');
      return;
    }
    try {
      await addAddress({...newAddress, is_default: addresses.length === 0});
      setShowAddressForm(false);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save address');
    }
  };

  const handlePlaceOrder = async () => {
    if (deliveryMethod === 'DELIVERY' && !selectedAddress) {
      Alert.alert('No Address', 'Please add a delivery address.');
      return;
    }

    setPlacing(true);
    try {
      const payload: any = {
        pharmacy: DEFAULT_PHARMACY_ID,
        items: cartItems.map(i => ({drug: i.drugId, quantity: i.quantity})),
        delivery_method: deliveryMethod,
        patient_notes: patientNotes || undefined,
      };

      if (deliveryMethod === 'DELIVERY' && selectedAddress) {
        payload.delivery_address = {
          label: selectedAddress.label,
          recipient_name: selectedAddress.recipient_name,
          phone: selectedAddress.phone,
          street: selectedAddress.street,
          city: selectedAddress.city,
          state: selectedAddress.state,
          country: selectedAddress.country,
          postal_code: selectedAddress.postal_code,
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
          navigation.replace('OrderDetail', {orderId});
        } catch (err: any) {
          Alert.alert(
            'Payment Failed',
            err?.response?.data?.message || 'Insufficient wallet balance. Try card payment.',
          );
          // Order exists but unpaid — navigate to detail
          navigation.replace('OrderDetail', {orderId});
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
            navigation.replace('OrderDetail', {orderId});
          }
        } catch (err: any) {
          Alert.alert('Payment Error', err?.response?.data?.message || 'Failed to start payment.');
          navigation.replace('OrderDetail', {orderId});
        }
      }
    } catch (err: any) {
      Alert.alert(
        'Order Failed',
        err?.response?.data?.message || err?.message || 'Failed to place order.',
      );
    } finally {
      setPlacing(false);
    }
  };

  // ── Paystack WebView handlers ──
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
        clearCart();
        if (pendingOrderId) {
          navigation.replace('OrderDetail', {orderId: pendingOrderId});
          setPendingOrderId(null);
        }
      }
    },
    [paystackUrl, pendingOrderId, clearCart, navigation],
  );

  const handleClosePaystack = useCallback(() => {
    setPaystackUrl(null);
    clearCart();
    if (pendingOrderId) {
      navigation.replace('OrderDetail', {orderId: pendingOrderId});
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
        keyboardShouldPersistTaps="handled">
        {/* Order Summary (Collapsible) */}
        <TouchableOpacity
          onPress={() => setShowOrderSummary(!showOrderSummary)}
          className="bg-card border border-border rounded-2xl p-4 flex-row items-center justify-between mb-4"
          activeOpacity={0.7}>
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
            {cartItems.map(item => (
              <View key={item.drugId} className="flex-row justify-between mb-2">
                <Text className="text-sm text-foreground flex-1" numberOfLines={1}>
                  {item.name} x{item.quantity}
                </Text>
                <Text className="text-sm text-foreground font-medium ml-2">
                  {formatCurrency(item.price * item.quantity)}
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
              deliveryMethod === 'DELIVERY' ? 'bg-primary/10 border-primary' : 'bg-card border-border'
            }`}
            activeOpacity={0.7}>
            <Truck size={22} color={deliveryMethod === 'DELIVERY' ? colors.primary : colors.mutedForeground} />
            <Text className={`text-sm font-medium mt-1 ${deliveryMethod === 'DELIVERY' ? 'text-primary' : 'text-foreground'}`}>
              Delivery
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setDeliveryMethod('PICKUP')}
            className={`flex-1 rounded-2xl p-4 border items-center ${
              deliveryMethod === 'PICKUP' ? 'bg-primary/10 border-primary' : 'bg-card border-border'
            }`}
            activeOpacity={0.7}>
            <Store size={22} color={deliveryMethod === 'PICKUP' ? colors.primary : colors.mutedForeground} />
            <Text className={`text-sm font-medium mt-1 ${deliveryMethod === 'PICKUP' ? 'text-primary' : 'text-foreground'}`}>
              Pickup
            </Text>
          </TouchableOpacity>
        </View>

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
                      const idx = addresses.findIndex(a => a._id === selectedAddress._id);
                      const next = addresses[(idx + 1) % addresses.length];
                      setSelectedAddress(next);
                    }}
                    className="mt-2">
                    <Text className="text-xs text-primary font-medium">Change address</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : !showAddressForm ? (
              <TouchableOpacity
                onPress={() => setShowAddressForm(true)}
                className="bg-card border border-border rounded-2xl p-4 items-center"
                activeOpacity={0.7}>
                <MapPin size={20} color={colors.mutedForeground} />
                <Text className="text-sm text-primary font-medium mt-1">Add Delivery Address</Text>
              </TouchableOpacity>
            ) : null}

            {/* Inline Address Form */}
            {showAddressForm && (
              <View className="bg-card border border-border rounded-2xl p-4 mt-2">
                <Input
                  label="Recipient Name"
                  placeholder="Full name"
                  value={newAddress.recipient_name}
                  onChangeText={v => setNewAddress(p => ({...p, recipient_name: v}))}
                  containerClassName="mb-3"
                />
                <Input
                  label="Phone"
                  placeholder="Phone number"
                  value={newAddress.phone}
                  onChangeText={v => setNewAddress(p => ({...p, phone: v}))}
                  keyboardType="phone-pad"
                  containerClassName="mb-3"
                />
                <Input
                  label="Street"
                  placeholder="Street address"
                  value={newAddress.street}
                  onChangeText={v => setNewAddress(p => ({...p, street: v}))}
                  containerClassName="mb-3"
                />
                <View className="flex-row gap-3 mb-3">
                  <Input
                    label="City"
                    placeholder="City"
                    value={newAddress.city}
                    onChangeText={v => setNewAddress(p => ({...p, city: v}))}
                    containerClassName="flex-1"
                  />
                  <Input
                    label="State"
                    placeholder="State"
                    value={newAddress.state}
                    onChangeText={v => setNewAddress(p => ({...p, state: v}))}
                    containerClassName="flex-1"
                  />
                </View>
                <View className="flex-row gap-3">
                  <Button
                    variant="outline"
                    onPress={() => setShowAddressForm(false)}
                    className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onPress={handleSaveAddress}
                    className="flex-1">
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
            activeOpacity={0.7}>
            <CreditCard size={22} color={paymentMethod === 'card' ? colors.primary : colors.mutedForeground} />
            <Text className={`text-sm font-medium mt-1 ${paymentMethod === 'card' ? 'text-primary' : 'text-foreground'}`}>
              Card
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setPaymentMethod('wallet')}
            className={`flex-1 rounded-2xl p-4 border items-center ${
              paymentMethod === 'wallet' ? 'bg-primary/10 border-primary' : 'bg-card border-border'
            }`}
            activeOpacity={0.7}>
            <Wallet size={22} color={paymentMethod === 'wallet' ? colors.primary : colors.mutedForeground} />
            <Text className={`text-sm font-medium mt-1 ${paymentMethod === 'wallet' ? 'text-primary' : 'text-foreground'}`}>
              Wallet
            </Text>
          </TouchableOpacity>
        </View>

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
            <Text className="text-sm text-foreground">{formatCurrency(subtotal)}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-muted-foreground">Delivery Fee</Text>
            <Text className="text-sm text-foreground">
              {deliveryFee > 0 ? formatCurrency(deliveryFee) : 'Free'}
            </Text>
          </View>
          <View className="border-t border-border pt-2 mt-1 flex-row justify-between">
            <Text className="text-base font-bold text-foreground">Total</Text>
            <Text className="text-base font-bold text-primary">{formatCurrency(total)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom */}
      <View className="absolute bottom-0 left-0 right-0 bg-background border-t border-border px-5 pt-3 pb-8">
        <Button
          variant="primary"
          onPress={handlePlaceOrder}
          loading={placing}
          disabled={cartItems.length === 0}>
          Place Order - {formatCurrency(total)}
        </Button>
      </View>

      {/* ═══════ PAYSTACK WEBVIEW MODAL ═══════ */}
      <Modal
        visible={!!paystackUrl}
        animationType="slide"
        onRequestClose={handleClosePaystack}>
        <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}>
            <TouchableOpacity onPress={handleClosePaystack} style={{padding: 4}}>
              <X size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 16,
                fontWeight: '700',
                color: colors.foreground,
              }}>
              Complete Payment
            </Text>
            <View style={{width: 32}} />
          </View>

          {paystackUrl && (
            <WebView
              source={{uri: paystackUrl}}
              onNavigationStateChange={handlePaystackNavigation}
              style={{flex: 1}}
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
                  }}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={{marginTop: 12, fontSize: 14, color: colors.mutedForeground}}>
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
