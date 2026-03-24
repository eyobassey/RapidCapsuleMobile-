import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Star } from 'lucide-react-native';
import { Header, Avatar, Button, Skeleton, Text, TextInput } from '../../components/ui';
import { useAppointmentsStore } from '../../store/appointments';
import { colors } from '../../theme/colors';
import { formatDate, formatTime } from '../../utils/formatters';
import { ratingSchema, type RatingFormData } from '../../utils/validation';
import type { BookingsStackParamList } from '../../navigation/stacks/BookingsStack';

type Nav = NativeStackNavigationProp<BookingsStackParamList>;
type Route = RouteProp<BookingsStackParamList, 'RateAppointment'>;

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export default function RateAppointmentScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { id } = route.params;

  const {
    currentAppointment: appointment,
    isLoading,
    fetchAppointmentById,
    rateAppointment,
  } = useAppointmentsStore();

  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RatingFormData>({
    resolver: zodResolver(ratingSchema),
    defaultValues: { rating: 0, feedback: '' },
  });

  const rating = watch('rating');

  useEffect(() => {
    if (!appointment || (appointment._id !== id && appointment.id !== id)) {
      void fetchAppointmentById(id);
    }
  }, [id, appointment, fetchAppointmentById]);

  const specialist = appointment?.specialist_id || appointment?.specialist || {};
  const profile = specialist.profile || {};
  const specialistName = profile.first_name
    ? `Dr. ${profile.first_name} ${profile.last_name || ''}`
    : specialist.name || 'Specialist';

  const onSubmit = useCallback(
    async (data: RatingFormData) => {
      setSubmitting(true);
      try {
        await rateAppointment(id, {
          rating: data.rating,
          review: data.feedback?.trim() || undefined,
        });
        Alert.alert('Thank You!', 'Your review has been submitted successfully.', [
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
          },
        ]);
      } catch (err: any) {
        Alert.alert(
          'Error',
          err?.response?.data?.message || err?.message || 'Failed to submit rating.'
        );
      } finally {
        setSubmitting(false);
      }
    },
    [id, rateAppointment, navigation]
  );

  if (isLoading && !appointment) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header title="Rate Appointment" onBack={() => navigation.goBack()} />
        <View className="p-4 gap-4">
          <View className="bg-card border border-border rounded-2xl p-6 items-center gap-3">
            <Skeleton width={56} height={56} borderRadius={28} />
            <Skeleton width="50%" height={16} />
            <Skeleton width="35%" height={14} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Rate Appointment" onBack={() => navigation.goBack()} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Specialist info */}
        <View className="bg-card border border-border rounded-2xl p-5 items-center mb-6">
          <Avatar
            uri={profile.profile_photo || profile.profile_image}
            firstName={profile.first_name}
            lastName={profile.last_name}
            size="lg"
          />
          <Text className="text-foreground text-lg font-bold mt-3">{specialistName}</Text>
          {appointment && (
            <Text className="text-muted-foreground text-xs mt-1">
              {formatDate(
                appointment.date || appointment.appointment_date || appointment.createdAt
              )}
              {' at '}
              {formatTime(appointment.time || appointment.appointment_time || '00:00')}
            </Text>
          )}
        </View>

        {/* Star rating */}
        <View className="items-center mb-6">
          <Text className="text-foreground text-base font-bold mb-4">How was your experience?</Text>

          <View className="flex-row items-center gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setValue('rating', i, { shouldValidate: true })}
                accessibilityRole="button"
                accessibilityLabel={`Rate ${i} star${i > 1 ? 's' : ''}, ${RATING_LABELS[i]}`}
                accessibilityState={{ selected: i <= rating }}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Star
                  size={40}
                  color={i <= rating ? colors.secondary : colors.border}
                  fill={i <= rating ? colors.secondary : 'transparent'}
                />
              </TouchableOpacity>
            ))}
          </View>

          {rating > 0 && (
            <Text className="text-sm font-bold mt-3" style={{ color: colors.secondary }}>
              {RATING_LABELS[rating]}
            </Text>
          )}

          {errors.rating?.message && (
            <Text className="text-xs text-destructive mt-2">{errors.rating.message}</Text>
          )}
        </View>

        {/* Review input */}
        <View>
          <Text className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-2 ml-1">
            Write a review (optional)
          </Text>
          <View className="bg-card border border-border rounded-2xl p-4">
            <Controller
              control={control}
              name="feedback"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  accessibilityLabel="Write a review"
                  placeholder="Share your experience with this specialist..."
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  className="text-foreground text-sm min-h-[120px]"
                />
              )}
            />
          </View>
          <Text className="text-muted-foreground text-xs mt-2 ml-1">
            {(watch('feedback') || '').length}/500 characters
          </Text>
        </View>
      </ScrollView>

      {/* Submit button */}
      <View className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <Button
          variant="primary"
          onPress={handleSubmit(onSubmit)}
          loading={submitting}
          disabled={rating === 0}
          icon={<Star size={18} color={colors.white} fill={colors.white} />}
        >
          Submit Rating
        </Button>
      </View>
    </SafeAreaView>
  );
}
