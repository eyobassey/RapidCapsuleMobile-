import React, {useState, useCallback, useEffect, useMemo} from 'react';
import {View, Text, ScrollView, TextInput, Alert, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  Calendar,
  Clock,
  Wallet,
  CreditCard,
  CheckCircle,
  Globe,
  Video,
  Phone,
  Stethoscope,
  AlertTriangle,
  ClipboardCheck,
  X,
  ChevronRight,
} from 'lucide-react-native';
import {Header, Avatar, Button} from '../../../components/ui';
import {useAppointmentsStore} from '../../../store/appointments';
import {useWalletStore} from '../../../store/wallet';
import {colors} from '../../../theme/colors';
import {formatDate} from '../../../utils/formatters';
import {useCurrency} from '../../../hooks/useCurrency';
import {MEETING_CHANNEL_LABELS} from '../../../utils/constants';
import type {BookingsStackParamList} from '../../../navigation/stacks/BookingsStack';

type Nav = NativeStackNavigationProp<BookingsStackParamList>;

const TRIAGE_LABELS: Record<string, {label: string; color: string}> = {
  emergency: {label: 'Emergency', color: '#ef4444'},
  emergency_ambulance: {label: 'Emergency', color: '#ef4444'},
  consultation_24: {label: 'Urgent — See a doctor within 24h', color: '#f97316'},
  consultation: {label: 'See a Doctor', color: '#eab308'},
  self_care: {label: 'Self-Care', color: '#22c55e'},
};

const channelIcons: Record<string, React.ReactNode> = {
  zoom: <Video size={18} color={colors.primary} />,
  google_meet: <Video size={18} color="#34A853" />,
  phone: <Phone size={18} color={colors.secondary} />,
};

/** Format a health checkup into readable patient notes */
function formatCheckupAsNotes(checkup: any): string {
  const data = checkup?.response?.data;
  if (!data) return '';

  const lines: string[] = [];
  const date = checkup.created_at
    ? new Date(checkup.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  lines.push(`--- Health Checkup Results${date ? ` (${date})` : ''} ---`);

  // Triage level
  const triage = TRIAGE_LABELS[data.triage_level];
  if (triage) {
    lines.push(`Triage: ${triage.label}`);
  }

  // Top conditions
  const conditions = (data.conditions || []).slice(0, 5);
  if (conditions.length > 0) {
    const condList = conditions
      .map((c: any) => {
        const name = c.common_name || c.name;
        const pct = typeof c.probability === 'number'
          ? c.probability <= 1
            ? Math.round(c.probability * 100)
            : Math.round(c.probability)
          : null;
        return pct !== null ? `${name} (${pct}%)` : name;
      })
      .join(', ');
    lines.push(`Top conditions: ${condList}`);
  }

  // Symptoms
  const symptoms = checkup.request?.symptoms;
  if (symptoms?.length) {
    const symptomNames = symptoms
      .map((s: any) => s.common_name || s.name)
      .filter(Boolean)
      .slice(0, 8);
    if (symptomNames.length > 0) {
      lines.push(`Symptoms reported: ${symptomNames.join(', ')}`);
    }
  }

  lines.push('---');
  return lines.join('\n');
}

export default function ConfirmBookingScreen() {
  const {format} = useCurrency();
  const navigation = useNavigation<Nav>();
  const {
    bookingData,
    recentCheckups,
    isLoading,
    bookAppointment,
    fetchRecentCheckups,
    setBookingData,
    clearBookingData,
  } = useAppointmentsStore();
  const {balance, fetchBalance} = useWalletStore();

  const [personalNotes, setPersonalNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card'>('wallet');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [selectedCheckupId, setSelectedCheckupId] = useState<string | null>(
    bookingData.health_checkup_id || null,
  );
  const [showCheckupPicker, setShowCheckupPicker] = useState(false);

  useEffect(() => {
    fetchBalance();
    fetchRecentCheckups();
  }, []);

  const specialist = bookingData.specialist || {};
  const profile = specialist.profile || {};
  const specialistName = profile.first_name
    ? `Dr. ${profile.first_name} ${profile.last_name || ''}`
    : specialist.full_name || specialist.name || 'Specialist';
  const specialty =
    bookingData.categoryName ||
    specialist.specialist_category?.name ||
    'General Practice';
  const fee = specialist.consultation_fee || specialist.fee || 0;
  const platformFee = 500;
  const totalFee = fee + platformFee;
  const channel = bookingData.meeting_channel || specialist.meeting_channel || 'zoom';
  const timezone =
    bookingData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const insufficientBalance = paymentMethod === 'wallet' && balance < totalFee;

  // Find the selected checkup object
  const selectedCheckup = useMemo(
    () => recentCheckups.find((c: any) => (c._id || c.id) === selectedCheckupId),
    [recentCheckups, selectedCheckupId],
  );

  // Build the formatted checkup notes
  const checkupNotes = useMemo(
    () => (selectedCheckup ? formatCheckupAsNotes(selectedCheckup) : ''),
    [selectedCheckup],
  );

  // Combine checkup notes + personal notes for the final patient_notes
  const combinedNotes = useMemo(() => {
    const parts: string[] = [];
    if (checkupNotes) parts.push(checkupNotes);
    if (personalNotes.trim()) parts.push(personalNotes.trim());
    return parts.join('\n\n');
  }, [checkupNotes, personalNotes]);

  const handleSelectCheckup = (checkup: any) => {
    const id = checkup._id || checkup.id;
    if (selectedCheckupId === id) {
      // Deselect
      setSelectedCheckupId(null);
      setBookingData({health_checkup_id: undefined, healthCheckupSummary: undefined});
    } else {
      setSelectedCheckupId(id);
      const topCondition =
        checkup.response?.data?.conditions?.[0]?.common_name ||
        checkup.response?.data?.conditions?.[0]?.name;
      setBookingData({
        health_checkup_id: id,
        healthCheckupSummary: topCondition
          ? `Health checkup: ${topCondition}`
          : 'Health checkup linked',
      });
    }
    setShowCheckupPicker(false);
  };

  const handleConfirm = useCallback(async () => {
    if (!agreedToTerms) {
      Alert.alert(
        'Terms Required',
        'Please agree to the terms and conditions before proceeding.',
      );
      return;
    }
    if (insufficientBalance) {
      Alert.alert(
        'Insufficient Balance',
        `Your wallet balance (${format(balance)}) is not enough. Please fund your wallet or use card payment.`,
      );
      return;
    }
    try {
      const result = await bookAppointment({
        specialist: specialist._id || specialist.id,
        category: bookingData.categoryName || specialty,
        appointment_type: 'Initial Appointment',
        date: bookingData.date,
        time: bookingData.time,
        meeting_channel: channel,
        timezone,
        paymentMethod,
        ...(combinedNotes ? {patient_notes: combinedNotes} : {}),
        ...(selectedCheckupId ? {health_checkup_id: selectedCheckupId} : {}),
      });

      let message =
        'Your appointment has been successfully booked. You will receive a confirmation shortly.';
      if (result?.join_url || result?.zoom_meeting_url) {
        message +=
          '\n\nYour meeting link has been created and will be available in your appointment details.';
      }

      Alert.alert('Booking Confirmed!', message, [
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
      ]);
    } catch (err: any) {
      Alert.alert(
        'Booking Failed',
        err?.response?.data?.message ||
          err?.message ||
          'Something went wrong. Please try again.',
      );
    }
  }, [
    specialist,
    bookingData,
    combinedNotes,
    selectedCheckupId,
    paymentMethod,
    agreedToTerms,
    insufficientBalance,
    bookAppointment,
    clearBookingData,
    navigation,
    channel,
    timezone,
    balance,
  ]);

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
                style={{width: 32, backgroundColor: colors.primary}}
              />
            ))}
          </View>
          <Text className="text-muted-foreground text-xs ml-2">Step 4 of 4</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{padding: 16, paddingBottom: 140}}
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
              <Text className="text-foreground text-base font-bold">
                {specialistName}
              </Text>
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
                {channelIcons[channel] || (
                  <CheckCircle size={18} color={colors.success} />
                )}
              </View>
              <View>
                <Text className="text-muted-foreground text-xs">Channel</Text>
                <Text className="text-foreground text-sm font-medium">
                  {MEETING_CHANNEL_LABELS[channel] || channel}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl bg-muted items-center justify-center">
                <Globe size={18} color={colors.mutedForeground} />
              </View>
              <View>
                <Text className="text-muted-foreground text-xs">Timezone</Text>
                <Text className="text-foreground text-sm font-medium">{timezone}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Health Checkup Section */}
        <View className="mb-4">
          <Text className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-2 ml-1">
            Link a Health Checkup (optional)
          </Text>

          {/* Selected checkup display */}
          {selectedCheckup ? (
            <View
              className="bg-card border rounded-2xl p-4"
              style={{borderColor: `${colors.primary}50`}}>
              <View className="flex-row items-start gap-3">
                <View
                  className="w-9 h-9 rounded-xl items-center justify-center"
                  style={{backgroundColor: `${colors.primary}15`}}>
                  <ClipboardCheck size={18} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground text-sm font-bold">
                    Health Checkup Linked
                  </Text>
                  <Text className="text-muted-foreground text-xs mt-0.5">
                    {new Date(
                      selectedCheckup.created_at,
                    ).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                  {/* Top conditions */}
                  {selectedCheckup.response?.data?.conditions?.length > 0 && (
                    <View className="flex-row flex-wrap gap-1.5 mt-2">
                      {selectedCheckup.response.data.conditions
                        .slice(0, 3)
                        .map((c: any, i: number) => (
                          <View
                            key={i}
                            className="px-2 py-0.5 rounded-md"
                            style={{backgroundColor: `${colors.primary}12`}}>
                            <Text className="text-primary text-[10px] font-medium">
                              {c.common_name || c.name}
                            </Text>
                          </View>
                        ))}
                    </View>
                  )}
                  {/* Triage badge */}
                  {selectedCheckup.response?.data?.triage_level && (
                    <View className="flex-row items-center gap-1.5 mt-2">
                      <View
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor:
                            TRIAGE_LABELS[
                              selectedCheckup.response.data.triage_level
                            ]?.color || colors.mutedForeground,
                        }}
                      />
                      <Text className="text-muted-foreground text-[10px]">
                        {TRIAGE_LABELS[
                          selectedCheckup.response.data.triage_level
                        ]?.label || selectedCheckup.response.data.triage_level}
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedCheckupId(null);
                    setBookingData({
                      health_checkup_id: undefined,
                      healthCheckupSummary: undefined,
                    });
                  }}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <X size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              {/* Preview of notes that will be sent */}
              {checkupNotes ? (
                <View
                  className="mt-3 p-3 rounded-xl"
                  style={{backgroundColor: `${colors.primary}08`}}>
                  <Text className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold mb-1">
                    Will be included in specialist notes
                  </Text>
                  <Text className="text-foreground text-xs leading-relaxed">
                    {checkupNotes}
                  </Text>
                </View>
              ) : null}

              {/* Swap button */}
              {recentCheckups.length > 1 && (
                <TouchableOpacity
                  onPress={() => setShowCheckupPicker(true)}
                  className="mt-2 self-start">
                  <Text className="text-primary text-xs font-medium">
                    Choose a different checkup
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setShowCheckupPicker(!showCheckupPicker)}
              activeOpacity={0.7}
              className="bg-card border border-border rounded-2xl p-4">
              <View className="flex-row items-center gap-3">
                <View
                  className="w-9 h-9 rounded-xl items-center justify-center"
                  style={{backgroundColor: `${colors.primary}12`}}>
                  <Stethoscope size={18} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground text-sm font-medium">
                    {recentCheckups.length > 0
                      ? 'Select a recent health checkup'
                      : 'No recent health checkups'}
                  </Text>
                  <Text className="text-muted-foreground text-xs mt-0.5">
                    {recentCheckups.length > 0
                      ? 'Share your results with the specialist for better care'
                      : 'Complete a health checkup to share results with your specialist'}
                  </Text>
                </View>
                {recentCheckups.length > 0 && (
                  <ChevronRight size={16} color={colors.mutedForeground} />
                )}
              </View>
            </TouchableOpacity>
          )}

          {/* Checkup picker dropdown */}
          {showCheckupPicker && recentCheckups.length > 0 && (
            <View className="bg-card border border-border rounded-2xl mt-2 overflow-hidden">
              {recentCheckups.map((checkup: any, idx: number) => {
                const id = checkup._id || checkup.id;
                const isSelected = id === selectedCheckupId;
                const conditions = checkup.response?.data?.conditions || [];
                const topCondition =
                  conditions[0]?.common_name || conditions[0]?.name;
                const triageLevel = checkup.response?.data?.triage_level;
                const triageInfo = TRIAGE_LABELS[triageLevel];
                const date = new Date(
                  checkup.created_at,
                ).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                });

                return (
                  <TouchableOpacity
                    key={id || idx}
                    onPress={() => handleSelectCheckup(checkup)}
                    className={`p-3 flex-row items-center gap-3 ${
                      idx < recentCheckups.length - 1
                        ? 'border-b border-border/50'
                        : ''
                    } ${isSelected ? 'bg-primary/5' : ''}`}>
                    <View
                      className="w-8 h-8 rounded-lg items-center justify-center"
                      style={{
                        backgroundColor: triageInfo
                          ? `${triageInfo.color}15`
                          : `${colors.primary}12`,
                      }}>
                      <ClipboardCheck
                        size={14}
                        color={triageInfo?.color || colors.primary}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-foreground text-sm font-medium">
                        {topCondition || 'Health Checkup'}
                        {conditions.length > 1
                          ? ` +${conditions.length - 1} more`
                          : ''}
                      </Text>
                      <View className="flex-row items-center gap-2 mt-0.5">
                        <Text className="text-muted-foreground text-xs">
                          {date}
                        </Text>
                        {triageInfo && (
                          <>
                            <View className="w-1 h-1 rounded-full bg-border" />
                            <Text
                              style={{color: triageInfo.color, fontSize: 10}}>
                              {triageInfo.label}
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                    <View
                      className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                        isSelected ? 'border-primary' : 'border-border'
                      }`}>
                      {isSelected && (
                        <View className="w-2.5 h-2.5 rounded-full bg-primary" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Personal Notes */}
        <View className="mb-4">
          <Text className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-2 ml-1">
            Additional notes for specialist (optional)
          </Text>
          <View className="bg-card border border-border rounded-2xl p-4">
            <TextInput
              value={personalNotes}
              onChangeText={setPersonalNotes}
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
          <Text className="text-foreground font-bold text-sm mb-3">
            Payment Method
          </Text>

          {/* Wallet option */}
          <TouchableOpacity
            onPress={() => setPaymentMethod('wallet')}
            activeOpacity={0.7}
            className={`flex-row items-center gap-3 p-3 rounded-xl mb-3 ${
              paymentMethod === 'wallet' ? 'bg-muted' : 'bg-muted/50'
            }`}>
            <View className="w-9 h-9 rounded-xl bg-primary/20 items-center justify-center">
              <Wallet size={18} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-foreground text-sm font-medium">Wallet</Text>
              <Text className="text-muted-foreground text-xs">
                Balance: {format(balance)}
              </Text>
            </View>
            <View
              className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                paymentMethod === 'wallet' ? 'border-primary' : 'border-border'
              }`}>
              {paymentMethod === 'wallet' && (
                <View className="w-2.5 h-2.5 rounded-full bg-primary" />
              )}
            </View>
          </TouchableOpacity>

          {/* Insufficient balance warning */}
          {paymentMethod === 'wallet' && insufficientBalance && (
            <View
              className="flex-row items-center gap-2 px-3 py-2 rounded-lg mb-3"
              style={{backgroundColor: `${colors.destructive}15`}}>
              <AlertTriangle size={14} color={colors.destructive} />
              <Text className="text-destructive text-xs flex-1">
                Insufficient balance. You need {format(totalFee - balance)} more.
              </Text>
            </View>
          )}

          {/* Card option */}
          <TouchableOpacity
            onPress={() => setPaymentMethod('card')}
            activeOpacity={0.7}
            className={`flex-row items-center gap-3 p-3 rounded-xl ${
              paymentMethod === 'card' ? 'bg-muted' : 'bg-muted/50'
            }`}>
            <View className="w-9 h-9 rounded-xl bg-secondary/20 items-center justify-center">
              <CreditCard size={18} color={colors.secondary} />
            </View>
            <View className="flex-1">
              <Text className="text-foreground text-sm font-medium">
                Pay with Card
              </Text>
              <Text className="text-muted-foreground text-xs">
                Paystack secure payment
              </Text>
            </View>
            <View
              className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                paymentMethod === 'card' ? 'border-primary' : 'border-border'
              }`}>
              {paymentMethod === 'card' && (
                <View className="w-2.5 h-2.5 rounded-full bg-primary" />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Price breakdown */}
        <View className="bg-card border border-border rounded-2xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-muted-foreground text-sm">Consultation Fee</Text>
            <Text className="text-foreground text-sm font-medium">{format(fee)}</Text>
          </View>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-muted-foreground text-sm">Platform Fee</Text>
            <Text className="text-foreground text-sm font-medium">
              {format(platformFee)}
            </Text>
          </View>
          <View className="border-t border-border pt-3 flex-row items-center justify-between">
            <Text className="text-foreground text-sm font-bold">Total</Text>
            <Text className="text-primary text-lg font-bold">{format(totalFee)}</Text>
          </View>
        </View>

        {/* Terms checkbox */}
        <TouchableOpacity
          onPress={() => setAgreedToTerms(!agreedToTerms)}
          activeOpacity={0.7}
          className="flex-row items-start gap-3 mb-4">
          <View
            className={`w-5 h-5 rounded border-2 items-center justify-center mt-0.5 ${
              agreedToTerms ? 'border-primary bg-primary' : 'border-border'
            }`}>
            {agreedToTerms && <CheckCircle size={12} color={colors.white} />}
          </View>
          <Text className="text-muted-foreground text-xs flex-1 leading-relaxed">
            I agree to the terms and conditions. I understand that my wallet will be
            debited and the amount held in escrow until the appointment is completed.
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Confirm button */}
      <View className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <Button
          variant="primary"
          onPress={handleConfirm}
          loading={isLoading}
          disabled={
            !agreedToTerms || (paymentMethod === 'wallet' && insufficientBalance)
          }>
          Confirm & Pay {format(totalFee)}
        </Button>
      </View>
    </SafeAreaView>
  );
}
