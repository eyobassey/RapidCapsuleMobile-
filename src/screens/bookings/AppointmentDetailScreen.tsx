import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Calendar,
  ChevronRight,
  Clock,
  FileText,
  MapPin,
  MessageSquare,
  Phone,
  Receipt,
  Star,
  StickyNote,
  Timer,
  Video,
  XCircle,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReceiptSheet from '../../components/appointments/ReceiptSheet';
import RescheduleSheet from '../../components/appointments/RescheduleSheet';
import { Avatar, Button, Header, Skeleton, StatusBadge, Text } from '../../components/ui';
import { useCurrency } from '../../hooks/useCurrency';
import type { BookingsStackParamList } from '../../navigation/stacks/BookingsStack';
import { meetingService } from '../../services/meeting.service';
import { useAppointmentsStore } from '../../store/appointments';
import { colors } from '../../theme/colors';
import { MEETING_CHANNEL_LABELS } from '../../utils/constants';
import { formatDate, formatTime } from '../../utils/formatters';

type Nav = NativeStackNavigationProp<BookingsStackParamList>;
type Route = RouteProp<BookingsStackParamList, 'AppointmentDetail'>;

const channelIcons: Record<string, React.ReactNode> = {
  zoom: <Video size={18} color={colors.primary} />,
  google_meet: <Video size={18} color={colors.primary} />,
  microsoft_teams: <Video size={18} color={colors.primary} />,
  whatsapp: <MessageSquare size={18} color={colors.success} />,
  phone: <Phone size={18} color={colors.secondary} />,
  in_person: <MapPin size={18} color={colors.accent} />,
  chat: <MessageSquare size={18} color={colors.primary} />,
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
  const [showReceipt, setShowReceipt] = useState(false);
  // Ticks every minute so the join button enables itself when the window opens
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timerId = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timerId);
  }, []);

  const {
    currentAppointment: appointment,
    isLoading,
    fetchAppointmentById,
    cancelAppointment,
  } = useAppointmentsStore();

  useEffect(() => {
    void fetchAppointmentById(id);
  }, [id, fetchAppointmentById]);

  const specialist = appointment?.specialist_id || appointment?.specialist || {};
  const profile = specialist?.profile || {};
  const specialistName = profile?.first_name
    ? `Dr. ${profile?.first_name} ${profile?.last_name || ''}`
    : specialist?.name || 'Specialist';
  const specialty =
    appointment?.specialist_category?.name ||
    specialist?.specialist_category?.name ||
    appointment?.specialty ||
    'General Practice';
  const channel = appointment?.meeting_channel || 'zoom';
  const fee =
    appointment?.appointment_fee || appointment?.consultation_fee || appointment?.fee || 0;
  const status = appointment?.status || 'OPEN';
  const duration = appointment?.duration || 30;
  const rating = specialist?.average_rating || specialist?.rating || 0;

  const isUpcoming = status === 'OPEN' || status === 'ONGOING' || status === 'RESCHEDULED';
  const isCompleted = status === 'COMPLETED';
  const isCancelled = status === 'CANCELLED';
  const isChat = channel === 'chat';

  // ── Join-window logic (timezone-safe: all comparisons in UTC ms) ──────────
  const startMs = useMemo(() => {
    const raw = appointment?.start_time || appointment?.appointment_date || appointment?.date;
    if (!raw) return null;
    const ms = new Date(raw).getTime();
    return Number.isNaN(ms) ? null : ms;
  }, [appointment]);

  /** True when within the joinable window: 15 min before start → end of meeting */
  const canJoinMeeting = useMemo(() => {
    if (!isUpcoming) return false;
    if (startMs === null) return true; // no time info → always allow
    const windowStart = startMs - 15 * 60 * 1000;
    const windowEnd = startMs + duration * 60 * 1000;
    return now >= windowStart && now <= windowEnd;
  }, [isUpcoming, startMs, duration, now]);

  /** Human-readable countdown until the join window opens, or null if already open/no info */
  const joinCountdown = useMemo<string | null>(() => {
    if (startMs === null || canJoinMeeting) return null;
    const msUntilWindow = startMs - 15 * 60 * 1000 - now;
    if (msUntilWindow <= 0) return null;
    const totalMin = Math.ceil(msUntilWindow / 60_000);
    if (totalMin >= 60) {
      const hrs = Math.floor(totalMin / 60);
      const mins = totalMin % 60;
      return mins > 0 ? `Available in ${hrs}h ${mins}m` : `Available in ${hrs}h`;
    }
    return `Available in ${totalMin}m`;
  }, [startMs, canJoinMeeting, now]);

  /** True when the appointment start time has been reached (chat channel) */
  const canStartChat = useMemo(() => {
    if (!isUpcoming) return false;
    if (startMs === null) return true;
    return now >= startMs;
  }, [isUpcoming, startMs, now]);

  /** Countdown until the chat appointment starts */
  const chatCountdown = useMemo<string | null>(() => {
    if (startMs === null || canStartChat) return null;
    const msUntilStart = startMs - now;
    if (msUntilStart <= 0) return null;
    const totalMin = Math.ceil(msUntilStart / 60_000);
    if (totalMin >= 60) {
      const hrs = Math.floor(totalMin / 60);
      const mins = totalMin % 60;
      return mins > 0 ? `Available in ${hrs}h ${mins}m` : `Available in ${hrs}h`;
    }
    return `Available in ${totalMin}m`;
  }, [startMs, canStartChat, now]);

  const isNonEmptyString = (v: unknown): v is string =>
    typeof v === 'string' && v.trim().length > 0;
  const hasAnyNotes =
    isNonEmptyString(appointment?.patient_notes) ||
    isNonEmptyString(appointment?.specialist_notes) ||
    isNonEmptyString(appointment?.notes);

  const meetingUrl =
    appointment?.join_url ||
    appointment?.zoom_meeting_url ||
    appointment?.meeting_link ||
    appointment?.zoom_link;
  const meetingId = appointment?.meeting_id || appointment?.zoom_meeting_id;
  const meetingPassword = appointment?.meeting_password || appointment?.zoom_meeting_password;

  const appointmentType = appointment?.appointment_type || appointment?.type || 'Consultation';

  const handleJoinMeeting = useCallback(() => {
    if (!appointment) return;
    void meetingService.join({
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
            try {
              await cancelAppointment(id);
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'Failed to cancel appointment. Please try again.');
            }
          },
        },
      ]
    );
  }, [id, cancelAppointment, navigation]);

  const handleStartChat = useCallback(() => {
    const convId = appointment?.conversation_id || appointment?.chat_conversation_id;
    if (convId) {
      (navigation as any).navigate('Home', { screen: 'Chat', params: { conversationId: convId } });
    } else {
      (navigation as any).navigate('Home', { screen: 'ConversationsList' });
    }
  }, [appointment, navigation]);

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
              uri={profile?.profile_photo || profile?.profile_image}
              firstName={profile?.first_name}
              lastName={profile?.last_name}
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
                      appointment?.start_time ||
                        appointment?.date ||
                        appointment?.appointment_date ||
                        appointment?.createdAt
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
                      appointment?.start_time ||
                        appointment?.time ||
                        appointment?.appointment_time ||
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

          {/* Payment card */}
          {!isCancelled && (
            <View className="bg-card border border-border rounded-2xl px-4 mb-4">
              <View className="flex-row items-center justify-between py-3">
                <Text className="text-muted-foreground text-xs">Consultation Fee</Text>
                <Text className="text-foreground text-sm font-semibold">{format(fee)}</Text>
              </View>
              <View className="border-t border-border" />
              <TouchableOpacity
                onPress={() => setShowReceipt(true)}
                activeOpacity={0.7}
                className="flex-row items-center justify-between py-3"
              >
                <View className="flex-row items-center gap-2">
                  <Receipt size={15} color={colors.primary} />
                  <Text className="text-primary text-sm font-semibold">View Receipt</Text>
                </View>
                <ChevronRight size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Section 3: Meeting Details */}
          {isUpcoming && !isChat && (meetingUrl || meetingId) && (
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
          {appointment?.health_checkup_id && (
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

          {/* Section 4: Notes — always visible for non-cancelled appointments */}
          {!isCancelled && (
            <View className="bg-card border border-border rounded-2xl p-4 mb-4">
              <View className="flex-row items-center gap-2 mb-3">
                <StickyNote size={16} color={colors.mutedForeground} />
                <Text className="text-foreground font-bold text-sm">Notes</Text>
              </View>

              {hasAnyNotes ? (
                <>
                  {isNonEmptyString(appointment?.patient_notes) && (
                    <View className="mb-3">
                      <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
                        Your Notes
                      </Text>
                      <Text className="text-foreground text-sm leading-relaxed">
                        {appointment?.patient_notes}
                      </Text>
                    </View>
                  )}
                  {isNonEmptyString(appointment?.specialist_notes) && (
                    <View>
                      <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
                        Specialist Notes
                      </Text>
                      <Text className="text-foreground text-sm leading-relaxed">
                        {appointment?.specialist_notes}
                      </Text>
                    </View>
                  )}
                  {isNonEmptyString(appointment?.notes) &&
                    !isNonEmptyString(appointment?.patient_notes) &&
                    !isNonEmptyString(appointment?.specialist_notes) && (
                      <Text className="text-foreground text-sm leading-relaxed">
                        {appointment?.notes}
                      </Text>
                    )}
                </>
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 20, gap: 8 }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 16,
                      backgroundColor: `${colors.mutedForeground}18`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <StickyNote size={18} color={colors.mutedForeground} strokeWidth={1.5} />
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                    No notes yet
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.mutedForeground,
                      textAlign: 'center',
                      lineHeight: 18,
                      paddingHorizontal: 16,
                    }}
                  >
                    {isCompleted
                      ? 'No notes were added for this appointment.'
                      : 'Notes from you or your specialist will appear here.'}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Cancellation reason */}
          {isCancelled && appointment?.cancellation_reason && (
            <View className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 mb-4">
              <View className="flex-row items-center gap-2 mb-2">
                <XCircle size={16} color={colors.destructive} />
                <Text className="text-destructive font-bold text-sm">Cancellation Reason</Text>
              </View>
              <Text className="text-foreground text-sm leading-relaxed">
                {appointment?.cancellation_reason}
              </Text>
            </View>
          )}

          {/* Section 5: Actions */}
          <View className="gap-3 mt-2">
            {isUpcoming && isChat && (
              <>
                <Button
                  variant="primary"
                  onPress={handleStartChat}
                  disabled={!canStartChat}
                  icon={<MessageSquare size={18} color={colors.white} />}
                >
                  Message Doctor
                </Button>
                {chatCountdown && (
                  <View className="flex-row items-center justify-center gap-1.5 -mt-1">
                    <Clock size={12} color={colors.mutedForeground} />
                    <Text className="text-muted-foreground text-xs text-center">
                      {chatCountdown} · Chat opens at appointment time
                    </Text>
                  </View>
                )}
                <Button variant="outline" onPress={() => setShowReschedule(true)}>
                  Reschedule
                </Button>
                <Button variant="ghost" onPress={handleCancel}>
                  <Text className="text-destructive font-bold text-base">Cancel Appointment</Text>
                </Button>
              </>
            )}

            {isUpcoming && !isChat && (
              <>
                <Button
                  variant="primary"
                  onPress={handleJoinMeeting}
                  disabled={!canJoinMeeting}
                  icon={<Video size={18} color={colors.white} />}
                >
                  Join Meeting
                </Button>
                {joinCountdown && (
                  <View className="flex-row items-center justify-center gap-1.5 -mt-1">
                    <Clock size={12} color={colors.mutedForeground} />
                    <Text className="text-muted-foreground text-xs text-center">
                      {joinCountdown} · Button activates 15 min before start
                    </Text>
                  </View>
                )}
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
                {appointment?.prescription?.prescription_id && (
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

      {appointment && (
        <ReceiptSheet
          visible={showReceipt}
          onClose={() => setShowReceipt(false)}
          data={{
            appointmentId: appointment?.id || appointment?._id || id,
            specialistName,
            specialty,
            date: formatDate(
              appointment?.start_time ||
                appointment?.date ||
                appointment?.appointment_date ||
                appointment?.createdAt
            ),
            time: formatTime(
              appointment?.start_time ||
                appointment?.time ||
                appointment?.appointment_time ||
                '00:00'
            ),
            appointmentType,
            consultationFee: format(fee),
          }}
        />
      )}
    </SafeAreaView>
  );
}
