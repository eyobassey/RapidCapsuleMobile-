import React, { useEffect, useCallback, useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import {
  Calendar,
  Clock,
  Timer,
  Video,
  Phone,
  MapPin,
  MessageSquare,
  Star,
  FileText,
  StickyNote,
  XCircle,
} from 'lucide-react-native';
import { Header, Avatar, StatusBadge, Button, Card, Skeleton, Text } from '../../components/ui';
import RescheduleSheet from '../../components/appointments/RescheduleSheet';
import { useAppointmentsStore } from '../../store/appointments';
import { meetingService } from '../../services/meeting.service';
import { colors } from '../../theme/colors';
import { formatDate, formatTime } from '../../utils/formatters';
import { useCurrency } from '../../hooks/useCurrency';
import { MEETING_CHANNEL_LABELS } from '../../utils/constants';
import type { BookingsStackParamList } from '../../navigation/stacks/BookingsStack';

type Nav = NativeStackNavigationProp<BookingsStackParamList>;
type Route = RouteProp<BookingsStackParamList, 'AppointmentDetail'>;

const channelIcons: Record<string, React.ReactNode> = {
  zoom: <Video size={18} color={colors.primary} />,
  google_meet: <Video size={18} color={colors.primary} />,
  microsoft_teams: <Video size={18} color={colors.primary} />,
  whatsapp: <MessageSquare size={18} color={colors.success} />,
  phone: <Phone size={18} color={colors.secondary} />,
  in_person: <MapPin size={18} color={colors.accent} />,
};

function DetailSkeleton() {
  return (
    <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
      <View className="bg-card border border-border rounded-2xl p-6 items-center gap-3 mb-4">
        <Skeleton width={56} height={56} borderRadius={28} />
        <Skeleton width="50%" height={20} />
        <Skeleton width="35%" height={14} />
        <Skeleton width="25%" height={14} />
      </View>
      <View className="bg-card border border-border rounded-2xl p-4 gap-3 mb-4">
        <Skeleton height={14} />
        <Skeleton height={14} />
        <Skeleton height={14} />
        <Skeleton height={14} />
      </View>
    </ScrollView>
  );
}

export default function AppointmentDetailScreen() {
  const { format } = useCurrency();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { id } = route.params;
  const [showReschedule, setShowReschedule] = useState(false);

  const {
    currentAppointment: appointment,
    isLoading,
    fetchAppointmentById,
    cancelAppointment,
  } = useAppointmentsStore();

  useEffect(() => {
    fetchAppointmentById(id);
  }, [id]);

  const specialist = appointment?.specialist_id || appointment?.specialist || {};
  const profile = specialist.profile || {};
  const specialistName = profile.first_name
    ? `Dr. ${profile.first_name} ${profile.last_name || ''}`
    : specialist.name || 'Specialist';
  const specialty =
    appointment?.specialist_category?.name ||
    specialist.specialist_category?.name ||
    appointment?.specialty ||
    'General Practice';
  const channel = appointment?.meeting_channel || 'zoom';
  const fee =
    appointment?.appointment_fee || appointment?.consultation_fee || appointment?.fee || 0;
  const status = appointment?.status || 'OPEN';
  const duration = appointment?.duration || 30;
  const rating = specialist.average_rating || specialist.rating || 0;

  const isUpcoming = status === 'OPEN' || status === 'ONGOING' || status === 'RESCHEDULED';
  const isCompleted = status === 'COMPLETED';
  const isCancelled = status === 'CANCELLED';

  const meetingUrl =
    appointment?.join_url ||
    appointment?.zoom_meeting_url ||
    appointment?.meeting_link ||
    appointment?.zoom_link;
  const meetingId = appointment?.meeting_id || appointment?.zoom_meeting_id;
  const meetingPassword = appointment?.meeting_password || appointment?.zoom_meeting_password;

  const handleJoinMeeting = useCallback(() => {
    if (!appointment) return;
    meetingService.join({
      channel: appointment.meeting_channel || 'zoom',
      joinUrl: meetingService.resolveJoinUrl(appointment),
      meetingId: appointment.meeting_id || appointment.zoom_meeting_id,
      password: appointment.meeting_password || appointment.zoom_meeting_password,
      displayName: specialistName,
      address: appointment.address || appointment.location,
    });
  }, [appointment, specialistName]);

  const handleCancel = useCallback(() => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment? This action cannot be undone.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Appointment',
          style: 'destructive',
          onPress: async () => {
            await cancelAppointment(id);
            navigation.goBack();
          },
        },
      ]
    );
  }, [id, cancelAppointment, navigation]);

  const handleRate = useCallback(() => {
    navigation.navigate('RateAppointment', { id });
  }, [id, navigation]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Appointment Details" onBack={() => navigation.goBack()} />

      {isLoading && !appointment ? (
        <DetailSkeleton />
      ) : !appointment ? (
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-muted-foreground text-base">Appointment not found</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Section 1: Specialist Card */}
          <View className="bg-card border border-border rounded-2xl p-6 items-center mb-4">
            <Avatar
              uri={profile.profile_photo || profile.profile_image}
              firstName={profile.first_name}
              lastName={profile.last_name}
              size="lg"
            />
            <Text className="text-foreground text-xl font-bold mt-3">{specialistName}</Text>
            <Text className="text-muted-foreground text-sm mt-1">{specialty}</Text>

            {rating > 0 && (
              <View className="flex-row items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={14}
                    color={i <= Math.round(rating) ? colors.secondary : colors.border}
                    fill={i <= Math.round(rating) ? colors.secondary : 'transparent'}
                  />
                ))}
                <Text className="text-muted-foreground text-xs ml-1">{rating.toFixed(1)}</Text>
              </View>
            )}

            <Text className="text-primary font-bold text-lg mt-2">{format(fee)}</Text>
          </View>

          {/* Section 2: Status & Schedule */}
          <View className="bg-card border border-border rounded-2xl p-4 mb-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-foreground font-bold text-sm">Status</Text>
              <StatusBadge status={status} size="md" />
            </View>

            <View className="gap-3">
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-xl bg-muted items-center justify-center">
                  <Calendar size={18} color={colors.primary} />
                </View>
                <View>
                  <Text className="text-muted-foreground text-xs">Date</Text>
                  <Text className="text-foreground text-sm font-medium">
                    {formatDate(
                      appointment.start_time ||
                        appointment.date ||
                        appointment.appointment_date ||
                        appointment.createdAt
                    )}
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
                    {formatTime(
                      appointment.start_time ||
                        appointment.time ||
                        appointment.appointment_time ||
                        '00:00'
                    )}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-xl bg-muted items-center justify-center">
                  <Timer size={18} color={colors.success} />
                </View>
                <View>
                  <Text className="text-muted-foreground text-xs">Duration</Text>
                  <Text className="text-foreground text-sm font-medium">{duration} min</Text>
                </View>
              </View>

              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-xl bg-muted items-center justify-center">
                  {channelIcons[channel] || <Video size={18} color={colors.mutedForeground} />}
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

          {/* Section 3: Meeting Details */}
          {isUpcoming && (meetingUrl || meetingId) && (
            <View className="bg-card border border-border rounded-2xl p-4 mb-4">
              <View className="flex-row items-center gap-2 mb-3">
                <Video size={16} color={colors.primary} />
                <Text className="text-foreground font-bold text-sm">Meeting Details</Text>
              </View>

              {meetingId && (
                <View className="mb-2">
                  <Text className="text-muted-foreground text-xs">Meeting ID</Text>
                  <Text className="text-foreground text-sm font-medium" selectable>
                    {meetingId}
                  </Text>
                </View>
              )}

              {meetingPassword && (
                <View className="mb-2">
                  <Text className="text-muted-foreground text-xs">Password</Text>
                  <Text className="text-foreground text-sm font-medium" selectable>
                    {meetingPassword}
                  </Text>
                </View>
              )}

              {meetingUrl && (
                <View>
                  <Text className="text-muted-foreground text-xs">Meeting Link</Text>
                  <Text className="text-primary text-sm font-medium" selectable numberOfLines={2}>
                    {meetingUrl}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Health Checkup Link */}
          {appointment.health_checkup_id && (
            <View
              className="flex-row items-center gap-3 p-3 rounded-xl mb-4 border"
              style={{ backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}30` }}
            >
              <FileText size={18} color={colors.primary} />
              <View className="flex-1">
                <Text className="text-primary text-sm font-bold">Health Checkup Linked</Text>
                <Text className="text-muted-foreground text-xs mt-0.5">
                  Health checkup results shared with specialist
                </Text>
              </View>
            </View>
          )}

          {/* Section 4: Notes */}
          {(appointment.patient_notes || appointment.specialist_notes || appointment.notes) && (
            <View className="bg-card border border-border rounded-2xl p-4 mb-4">
              <View className="flex-row items-center gap-2 mb-3">
                <StickyNote size={16} color={colors.mutedForeground} />
                <Text className="text-foreground font-bold text-sm">Notes</Text>
              </View>

              {appointment.patient_notes && (
                <View className="mb-3">
                  <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
                    Your Notes
                  </Text>
                  <Text className="text-foreground text-sm leading-relaxed">
                    {appointment.patient_notes}
                  </Text>
                </View>
              )}

              {appointment.specialist_notes && (
                <View>
                  <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
                    Specialist Notes
                  </Text>
                  <Text className="text-foreground text-sm leading-relaxed">
                    {appointment.specialist_notes}
                  </Text>
                </View>
              )}

              {appointment.notes && !appointment.patient_notes && !appointment.specialist_notes && (
                <Text className="text-foreground text-sm leading-relaxed">{appointment.notes}</Text>
              )}
            </View>
          )}

          {/* Cancellation reason */}
          {isCancelled && appointment.cancellation_reason && (
            <View className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 mb-4">
              <View className="flex-row items-center gap-2 mb-2">
                <XCircle size={16} color={colors.destructive} />
                <Text className="text-destructive font-bold text-sm">Cancellation Reason</Text>
              </View>
              <Text className="text-foreground text-sm leading-relaxed">
                {appointment.cancellation_reason}
              </Text>
            </View>
          )}

          {/* Section 4: Actions */}
          <View className="gap-3 mt-2">
            {isUpcoming && (
              <>
                <Button
                  variant="primary"
                  onPress={handleJoinMeeting}
                  icon={<Video size={18} color={colors.white} />}
                >
                  Join Meeting
                </Button>
                <Button variant="outline" onPress={() => setShowReschedule(true)}>
                  Reschedule
                </Button>
                <Button variant="ghost" onPress={handleCancel}>
                  <Text className="text-destructive font-bold text-base">Cancel Appointment</Text>
                </Button>
              </>
            )}

            {isCompleted && (
              <>
                <Button
                  variant="primary"
                  onPress={handleRate}
                  icon={<Star size={18} color={colors.white} />}
                >
                  Rate Appointment
                </Button>
                {appointment.prescription_id && (
                  <Button
                    variant="outline"
                    onPress={() => Alert.alert('Prescription', 'Navigate to prescription detail.')}
                    icon={<FileText size={18} color={colors.foreground} />}
                  >
                    View Prescription
                  </Button>
                )}
              </>
            )}
          </View>
        </ScrollView>
      )}
      {appointment && (
        <RescheduleSheet
          visible={showReschedule}
          onClose={() => setShowReschedule(false)}
          appointment={appointment}
        />
      )}
    </SafeAreaView>
  );
}
