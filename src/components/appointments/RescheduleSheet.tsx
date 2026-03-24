import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useAvailableTimesQuery,
  useRescheduleAppointmentMutation,
} from '../../hooks/queries/useAppointmentsQuery';
import { colors } from '../../theme/colors';
import { formatDate, formatTime } from '../../utils/formatters';
import { Avatar, Text } from '../ui';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function buildCalendarGrid(year: number, month: number): (number | null)[][] {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(firstDow).fill(null);

  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    weeks.push([...week, ...Array(7 - week.length).fill(null)]);
  }
  return weeks;
}

function isPastDay(year: number, month: number, day: number): boolean {
  const today = new Date();
  const d = new Date(year, month, day);
  return d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function isToday(year: number, month: number, day: number): boolean {
  const t = new Date();
  return t.getFullYear() === year && t.getMonth() === month && t.getDate() === day;
}

function formatSlot(time: string): string {
  const [h = 0, m = 0] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${period}`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface RescheduleSheetProps {
  visible: boolean;
  onClose: () => void;
  appointment: any;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RescheduleSheet({ visible, onClose, appointment }: RescheduleSheetProps) {
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const specialistId: string =
    appointment?.specialist_id?._id ||
    appointment?.specialist_id ||
    appointment?.specialist?._id ||
    appointment?.specialist?.id ||
    '';

  const { data: availabilityRaw, isFetching: timesLoading } = useAvailableTimesQuery(
    specialistId || '',
    selectedDate ?? ''
  );

  const availableSlots = useMemo<string[]>(() => {
    if (!availabilityRaw || !selectedDate) return [];
    const slots =
      typeof availabilityRaw === 'object' && !Array.isArray(availabilityRaw)
        ? (availabilityRaw as Record<string, any>)[selectedDate]?.available
        : null;
    return Array.isArray(slots) ? slots : [];
  }, [availabilityRaw, selectedDate]);

  const reschedule = useRescheduleAppointmentMutation();

  const weeks = useMemo(() => buildCalendarGrid(calYear, calMonth), [calYear, calMonth]);

  const prevMonth = useCallback(() => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
    setSelectedDate(null);
    setSelectedTime(null);
  }, [calMonth]);

  const nextMonth = useCallback(() => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
    setSelectedDate(null);
    setSelectedTime(null);
  }, [calMonth]);

  const handleDayPress = useCallback(
    (day: number) => {
      const key = toDateKey(calYear, calMonth, day);
      setSelectedDate(key);
      setSelectedTime(null);
    },
    [calYear, calMonth]
  );

  const handleConfirm = useCallback(() => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Select date & time', 'Please choose a date and time slot.');
      return;
    }
    reschedule.mutate(
      {
        appointmentId: appointment?._id || appointment?.id,
        date: selectedDate,
        time: selectedTime,
      },
      {
        onSuccess: () => {
          Alert.alert('Rescheduled', 'Your appointment has been rescheduled successfully.');
          onClose();
        },
        onError: (err: any) => {
          Alert.alert('Reschedule failed', err?.message ?? 'Please try again.');
        },
      }
    );
  }, [selectedDate, selectedTime, appointment, reschedule, onClose]);

  // ── Derived appointment display values ──────────────────────────────────────
  const specialist = appointment?.specialist_id || appointment?.specialist || {};
  const profile = specialist.profile || {};
  const specialistName = profile.first_name
    ? `${profile.first_name} ${profile.last_name || ''}`.trim()
    : specialist.name || 'Specialist';
  const specialty =
    appointment?.specialist_category?.name ||
    specialist.specialist_category?.name ||
    'General Practice';
  const currentDate = formatDate(
    appointment?.start_time || appointment?.date || appointment?.appointment_date
  );
  const currentTime = formatTime(
    appointment?.start_time || appointment?.time || appointment?.appointment_time
  );

  const isPrevDisabled = calYear === today.getFullYear() && calMonth === today.getMonth();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        {/* ── Header ── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            gap: 10,
          }}
        >
          <CalendarDays size={20} color={colors.primary} />
          <Text
            variant="heading"
            weight="bold"
            style={{ flex: 1, fontSize: 17, color: colors.foreground }}
          >
            Reschedule Appointment
          </Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        >
          {/* ── Current appointment banner ── */}
          <View
            style={{
              backgroundColor: `${colors.primary}12`,
              borderRadius: 14,
              padding: 14,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: `${colors.primary}25`,
            }}
          >
            <Text
              variant="label"
              weight="bold"
              style={{ fontSize: 10, color: colors.primary, letterSpacing: 1, marginBottom: 10 }}
            >
              CURRENT APPOINTMENT
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar
                uri={profile.profile_photo || profile.profile_image}
                firstName={profile.first_name}
                lastName={profile.last_name}
                size="md"
              />
              <View>
                <Text
                  variant="body"
                  weight="bold"
                  style={{ color: colors.foreground, fontSize: 15 }}
                >
                  {specialistName}
                </Text>
                <Text variant="caption" style={{ color: colors.mutedForeground, marginTop: 2 }}>
                  {specialty}
                </Text>
              </View>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                marginTop: 10,
                paddingTop: 10,
                borderTopWidth: 1,
                borderTopColor: `${colors.primary}20`,
                borderStyle: 'dashed',
              }}
            >
              <CalendarDays size={14} color={colors.mutedForeground} />
              <Text variant="caption" style={{ color: colors.mutedForeground }}>
                {currentDate} • {currentTime}
              </Text>
            </View>
          </View>

          {/* ── Calendar ── */}
          <Text
            variant="body"
            weight="bold"
            style={{ color: colors.foreground, marginBottom: 12, fontSize: 15 }}
          >
            Select New Date
          </Text>

          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
              marginBottom: 24,
            }}
          >
            {/* Month navigation */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <TouchableOpacity
                onPress={prevMonth}
                disabled={isPrevDisabled}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Previous month"
                style={{ opacity: isPrevDisabled ? 0.3 : 1 }}
              >
                <ChevronLeft size={20} color={colors.foreground} />
              </TouchableOpacity>
              <Text
                variant="body"
                weight="bold"
                style={{ flex: 1, textAlign: 'center', color: colors.foreground }}
              >
                {MONTH_NAMES[calMonth]} {calYear}
              </Text>
              <TouchableOpacity
                onPress={nextMonth}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Next month"
              >
                <ChevronRight size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {/* Day labels */}
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              {DAY_LABELS.map((label, i) => (
                <Text
                  key={i}
                  variant="caption"
                  weight="bold"
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    color: colors.mutedForeground,
                    fontSize: 12,
                  }}
                >
                  {label}
                </Text>
              ))}
            </View>

            {/* Calendar grid */}
            {weeks.map((week, wi) => (
              <View key={wi} style={{ flexDirection: 'row', marginBottom: 4 }}>
                {week.map((day, di) => {
                  if (!day) {
                    return <View key={di} style={{ flex: 1 }} />;
                  }
                  const key = toDateKey(calYear, calMonth, day);
                  const past = isPastDay(calYear, calMonth, day);
                  const todayFlag = isToday(calYear, calMonth, day);
                  const selected = selectedDate === key;

                  let bg = 'transparent';
                  let textColor = past ? colors.mutedForeground : colors.foreground;
                  if (selected) {
                    bg = colors.primary;
                    textColor = '#fff';
                  } else if (todayFlag) {
                    bg = `${colors.primary}30`;
                    textColor = colors.primary;
                  }

                  return (
                    <TouchableOpacity
                      key={di}
                      disabled={past}
                      onPress={() => handleDayPress(day)}
                      accessibilityRole="button"
                      accessibilityLabel={`${day} ${MONTH_NAMES[calMonth]}`}
                      style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: bg,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text
                          variant="body"
                          weight={selected || todayFlag ? 'bold' : 'regular'}
                          style={{ fontSize: 14, color: textColor }}
                        >
                          {day}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          {/* ── Time slots ── */}
          <Text
            variant="body"
            weight="bold"
            style={{ color: colors.foreground, marginBottom: 12, fontSize: 15 }}
          >
            Select New Time
          </Text>

          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
              minHeight: 100,
            }}
          >
            {!selectedDate ? (
              <View style={{ alignItems: 'center', paddingVertical: 20, gap: 6 }}>
                <Clock size={22} color={colors.mutedForeground} />
                <Text variant="caption" style={{ color: colors.mutedForeground }}>
                  Select a date to see available times
                </Text>
              </View>
            ) : timesLoading ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : availableSlots.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 20, gap: 6 }}>
                <Text
                  variant="body"
                  style={{ color: colors.mutedForeground, fontSize: 14, textAlign: 'center' }}
                >
                  No available time slots for this date
                </Text>
                <TouchableOpacity onPress={() => setSelectedDate(null)}>
                  <Text
                    variant="label"
                    weight="semibold"
                    style={{ color: colors.primary, fontSize: 13 }}
                  >
                    Please select another date
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {availableSlots.map((slot) => {
                  const active = selectedTime === slot;
                  return (
                    <TouchableOpacity
                      key={slot}
                      onPress={() => setSelectedTime(slot)}
                      accessibilityRole="button"
                      accessibilityLabel={formatSlot(slot)}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? `${colors.primary}18` : 'transparent',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {active && <Check size={12} color={colors.primary} />}
                      <Text
                        variant="body"
                        weight={active ? 'semibold' : 'regular'}
                        style={{
                          fontSize: 13,
                          color: active ? colors.primary : colors.foreground,
                        }}
                      >
                        {formatSlot(slot)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>

        {/* ── Footer actions ── */}
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            accessibilityRole="button"
            style={{
              flex: 1,
              height: 50,
              borderRadius: 14,
              backgroundColor: colors.muted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              variant="body"
              weight="semibold"
              style={{ color: colors.foreground, fontSize: 15 }}
            >
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleConfirm}
            disabled={!selectedDate || !selectedTime || reschedule.isPending}
            accessibilityRole="button"
            style={{
              flex: 2,
              height: 50,
              borderRadius: 14,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              opacity: !selectedDate || !selectedTime || reschedule.isPending ? 0.5 : 1,
            }}
          >
            {reschedule.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Check size={16} color="#fff" />
            )}
            <Text variant="body" weight="bold" style={{ color: '#fff', fontSize: 15 }}>
              {reschedule.isPending ? 'Rescheduling…' : 'Confirm Reschedule'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
