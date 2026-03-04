import React, {useState, useCallback} from 'react';
import {View, Text, ScrollView, TextInput, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  Calendar,
  Clock,
  Wallet,
  CreditCard,
  CheckCircle,
} from 'lucide-react-native';
import {Header, Avatar, Button, Card} from '../../../components/ui';
import {useAppointmentsStore} from '../../../store/appointments';
import {colors} from '../../../theme/colors';
import {formatDate, formatTime, formatCurrency} from '../../../utils/formatters';
import {MEETING_CHANNEL_LABELS} from '../../../utils/constants';
import type {BookingsStackParamList} from '../../../navigation/stacks/BookingsStack';

type Nav = NativeStackNavigationProp<BookingsStackParamList>;

export default function ConfirmBookingScreen() {
  const navigation = useNavigation<Nav>();
  const {bookingData, isLoading, bookAppointment, setBookingData, clearBookingData} =
    useAppointmentsStore();

  const [notes, setNotes] = useState(bookingData.notes || '');

  const specialist = bookingData.specialist || {};
  const profile = specialist.profile || {};
  const specialistName = profile.first_name
    ? `Dr. ${profile.first_name} ${profile.last_name || ''}`
    : specialist.name || 'Specialist';
  const specialty =
    bookingData.categoryName ||
    specialist.specialist_category?.name ||
    'General Practice';
  const fee = specialist.consultation_fee || specialist.fee || 0;
  const channel = specialist.meeting_channel || 'zoom';

  const handleConfirm = useCallback(async () => {
    try {
      setBookingData({notes});
      await bookAppointment({
        specialist_id: specialist._id || specialist.id,
        date: bookingData.date,
        time: bookingData.time,
        meeting_channel: channel,
        patient_notes: notes,
      });
      Alert.alert(
        'Booking Confirmed!',
        'Your appointment has been successfully booked. You will receive a confirmation shortly.',
        [
          {
            text: 'View Appointments',
            onPress: () => {
              clearBookingData();
              navigation.reset({
                index: 0,
                routes: [{name: 'AppointmentsList'}],
              });
            },
          },
        ],
      );
    } catch (err: any) {
      Alert.alert(
        'Booking Failed',
        err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.',
      );
    }
  }, [specialist, bookingData, notes, bookAppointment, clearBookingData, navigation]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Confirm Booking" onBack={() => navigation.goBack()} />

      {/* Step indicator */}
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center gap-2">
          <View className="flex-row gap-1.5">
            {[1, 2, 3, 4].map(step => (
              <View
                key={step}
                className="h-1.5 rounded-full"
                style={{
                  width: 32,
                  backgroundColor: colors.primary,
                }}
              />
            ))}
          </View>
          <Text className="text-muted-foreground text-xs ml-2">Step 4 of 4</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{padding: 16, paddingBottom: 120}}
        showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <View className="bg-card border border-border rounded-2xl p-5 mb-4">
          <View className="flex-row items-center gap-3 mb-4 pb-4 border-b border-border">
            <Avatar
              uri={profile.profile_photo || profile.profile_image}
              firstName={profile.first_name}
              lastName={profile.last_name}
              size="lg"
            />
            <View className="flex-1">
              <Text className="text-foreground text-base font-bold">{specialistName}</Text>
              <Text className="text-muted-foreground text-xs mt-0.5">{specialty}</Text>
            </View>
          </View>

          <View className="gap-3">
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl bg-muted items-center justify-center">
                <Calendar size={18} color={colors.primary} />
              </View>
              <View>
                <Text className="text-muted-foreground text-xs">Date</Text>
                <Text className="text-foreground text-sm font-medium">
                  {bookingData.date ? formatDate(bookingData.date) : '--'}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl bg-muted items-center justify-center">
                <Clock size={18} color={colors.accent} />
              </View>
              <View>
                <Text className="text-muted-foreground text-xs">Time</Text>
                <Text className="text-foreground text-sm font-medium">
                  {bookingData.time || '--'}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl bg-muted items-center justify-center">
                <CheckCircle size={18} color={colors.success} />
              </View>
              <View>
                <Text className="text-muted-foreground text-xs">Channel</Text>
                <Text className="text-foreground text-sm font-medium">
                  {MEETING_CHANNEL_LABELS[channel] || channel}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Notes */}
        <View className="mb-4">
          <Text className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-2 ml-1">
            Notes for specialist (optional)
          </Text>
          <View className="bg-card border border-border rounded-2xl p-4">
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Describe your symptoms or reason for visit..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="text-foreground text-sm min-h-[100px]"
            />
          </View>
        </View>

        {/* Payment section */}
        <View className="bg-card border border-border rounded-2xl p-4 mb-4">
          <Text className="text-foreground font-bold text-sm mb-3">Payment</Text>

          <View className="flex-row items-center gap-3 p-3 bg-muted rounded-xl mb-3">
            <View className="w-9 h-9 rounded-xl bg-primary/20 items-center justify-center">
              <Wallet size={18} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-foreground text-sm font-medium">Wallet Balance</Text>
              <Text className="text-muted-foreground text-xs">Pay from your wallet</Text>
            </View>
            <View className="w-5 h-5 rounded-full border-2 border-primary items-center justify-center">
              <View className="w-2.5 h-2.5 rounded-full bg-primary" />
            </View>
          </View>

          <View className="flex-row items-center gap-3 p-3 bg-muted/50 rounded-xl opacity-50">
            <View className="w-9 h-9 rounded-xl bg-secondary/20 items-center justify-center">
              <CreditCard size={18} color={colors.secondary} />
            </View>
            <View className="flex-1">
              <Text className="text-foreground text-sm font-medium">Pay with Card</Text>
              <Text className="text-muted-foreground text-xs">Coming soon</Text>
            </View>
            <View className="w-5 h-5 rounded-full border-2 border-border" />
          </View>
        </View>

        {/* Price */}
        <View className="bg-card border border-border rounded-2xl p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-muted-foreground text-sm">Consultation Fee</Text>
            <Text className="text-foreground text-lg font-bold">{formatCurrency(fee)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Confirm button */}
      <View className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <Button variant="primary" onPress={handleConfirm} loading={isLoading}>
          Confirm & Pay {formatCurrency(fee)}
        </Button>
      </View>
    </SafeAreaView>
  );
}
