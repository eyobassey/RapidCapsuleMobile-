import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import {
  Clock,
  Video,
  Phone,
  Globe,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { Header, Button, EmptyState, Text } from '../../../components/ui';
import { useAvailableTimesQuery } from '../../../hooks/queries';
import { useAppointmentsStore } from '../../../store/appointments';
import { useAuthStore } from '../../../store/auth';
import { colors } from '../../../theme/colors';
import type { BookingsStackParamList } from '../../../navigation/stacks/BookingsStack';

type Nav = NativeStackNavigationProp<BookingsStackParamList>;
type Route = RouteProp<BookingsStackParamList, 'SelectSchedule'>;

const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES_FULL = [
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

// Maps JS getDay() (0=Sun) to backend day names
const DAY_INDEX_TO_NAME: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

const MEETING_CHANNELS = [
  { key: 'zoom', label: 'Zoom', icon: Video, color: colors.primary },
  { key: 'google_meet', label: 'Google Meet', icon: Video, color: '#34A853' },
  { key: 'phone', label: 'Phone Call', icon: Phone, color: colors.secondary },
];

const COMMON_TIMEZONES = [
  { label: 'West Africa (WAT)', value: 'Africa/Lagos' },
  { label: 'East Africa (EAT)', value: 'Africa/Nairobi' },
  { label: 'South Africa (SAST)', value: 'Africa/Johannesburg' },
  { label: 'GMT / UTC', value: 'UTC' },
  { label: 'Eastern US (ET)', value: 'America/New_York' },
  { label: 'Central US (CT)', value: 'America/Chicago' },
  { label: 'Pacific US (PT)', value: 'America/Los_Angeles' },
  { label: 'London (GMT/BST)', value: 'Europe/London' },
  { label: 'Central Europe (CET)', value: 'Europe/Berlin' },
  { label: 'Dubai (GST)', value: 'Asia/Dubai' },
  { label: 'India (IST)', value: 'Asia/Kolkata' },
];

interface CalendarDay {
  date: Date;
  dateString: string;
  dayNum: number;
  isCurrentMonth: boolean;
  isPast: boolean;
  isToday: boolean;
  isAvailable: boolean; // specialist works this day of the week
}

function buildCalendarGrid(
  year: number,
  month: number,
  availableDayNames: string[]
): CalendarDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstOfMonth = new Date(year, month, 1);
  const startDay = firstOfMonth.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Previous month filler days
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const days: CalendarDay[] = [];

  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, daysInPrevMonth - i);
    days.push({
      date: d,
      dateString: formatDateString(d),
      dayNum: d.getDate(),
      isCurrentMonth: false,
      isPast: d < today,
      isToday: false,
      isAvailable: false,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const dayName = DAY_INDEX_TO_NAME[d.getDay()];
    const isPast = d < today;
    const isToday = d.getTime() === today.getTime();
    days.push({
      date: d,
      dateString: formatDateString(d),
      dayNum: day,
      isCurrentMonth: true,
      isPast,
      isToday,
      isAvailable: !isPast && availableDayNames.includes(dayName),
    });
  }

  // Next month filler to complete the grid (always show full weeks)
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        dateString: formatDateString(d),
        dayNum: i,
        isCurrentMonth: false,
        isPast: false,
        isToday: false,
        isAvailable: false,
      });
    }
  }

  return days;
}

function formatDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function SelectScheduleScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { specialistId } = route.params;
  const user = useAuthStore((s) => s.user);

  // Keep store for setBookingData and bookingData (client state)
  const { setBookingData, bookingData } = useAppointmentsStore();

  // Calendar month state
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState(
    bookingData.specialist?.meeting_channels?.[0] || 'zoom'
  );
  const [timezone, setTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [showTimezones, setShowTimezones] = useState(false);

  // React Query for available times
  const { data: availableTimesRaw, isLoading } = useAvailableTimesQuery(
    specialistId,
    selectedDate || ''
  );

  const availableTimes = useMemo(() => {
    if (!availableTimesRaw) return [];
    return Array.isArray(availableTimesRaw)
      ? availableTimesRaw
      : availableTimesRaw?.data || availableTimesRaw?.slots || [];
  }, [availableTimesRaw]);

  // Specialist's available days of the week (e.g. ['Monday', 'Wednesday', 'Friday'])
  const availableDayNames: string[] = useMemo(
    () => bookingData.specialist?.available_days || [],
    [bookingData.specialist?.available_days]
  );

  // Get available channels from specialist
  const specialistChannels = bookingData.specialist?.meeting_channels;
  const availableChannels = useMemo(() => {
    if (specialistChannels?.length) {
      return MEETING_CHANNELS.filter((ch) => specialistChannels.includes(ch.key));
    }
    return MEETING_CHANNELS;
  }, [specialistChannels]);

  // Month navigation bounds (today to 6 months ahead)
  const maxDate = useMemo(() => {
    const d = new Date(today);
    d.setMonth(d.getMonth() + 6);
    return d;
  }, [today]);

  const canGoPrev = viewYear > today.getFullYear() || viewMonth > today.getMonth();
  const canGoNext =
    viewYear < maxDate.getFullYear() ||
    (viewYear === maxDate.getFullYear() && viewMonth < maxDate.getMonth());

  const goToPrevMonth = () => {
    if (!canGoPrev) return;
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (!canGoNext) return;
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Build calendar grid for current view month
  const calendarDays = useMemo(
    () => buildCalendarGrid(viewYear, viewMonth, availableDayNames),
    [viewYear, viewMonth, availableDayNames]
  );

  // Reset selected time when date changes (React Query auto-fetches via useAvailableTimesQuery)
  useEffect(() => {
    if (selectedDate) {
      setSelectedTime(null);
    }
  }, [selectedDate]);

  const handleDateSelect = useCallback((day: CalendarDay) => {
    if (!day.isCurrentMonth || !day.isAvailable) return;
    setSelectedDate(day.dateString);
  }, []);

  const handleTimeSelect = useCallback((time: string) => {
    setSelectedTime(time);
  }, []);

  const handleContinue = useCallback(() => {
    if (!selectedDate || !selectedTime) return;
    setBookingData({
      date: selectedDate,
      time: selectedTime,
      meeting_channel: selectedChannel,
      timezone,
    });
    navigation.navigate('ConfirmBooking');
  }, [selectedDate, selectedTime, selectedChannel, timezone, setBookingData, navigation]);

  const currentTzLabel = COMMON_TIMEZONES.find((tz) => tz.value === timezone)?.label || timezone;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Select Schedule" onBack={() => navigation.goBack()} />

      {/* Step indicator */}
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center gap-2">
          <View className="flex-row gap-1.5">
            {[1, 2, 3, 4].map((step) => (
              <View
                key={step}
                className="h-1.5 rounded-full"
                style={{
                  width: step <= 3 ? 32 : 16,
                  backgroundColor: step <= 3 ? colors.primary : colors.border,
                }}
              />
            ))}
          </View>
          <Text className="text-muted-foreground text-xs ml-2">Step 3 of 4</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Meeting channel picker */}
        <View className="px-4 pt-2 pb-1">
          <Text className="text-foreground text-base font-bold mb-3">Meeting Channel</Text>
          <View className="flex-row gap-3">
            {availableChannels.map((ch) => {
              const Icon = ch.icon;
              const isSelected = selectedChannel === ch.key;
              return (
                <TouchableOpacity
                  key={ch.key}
                  onPress={() => setSelectedChannel(ch.key)}
                  accessibilityRole="tab"
                  accessibilityLabel={`${ch.label} meeting channel`}
                  accessibilityState={{ selected: isSelected }}
                  activeOpacity={0.7}
                  className={`flex-1 items-center py-3 rounded-xl border ${
                    isSelected ? 'border-primary' : 'border-border'
                  }`}
                  style={{
                    backgroundColor: isSelected ? `${colors.primary}15` : colors.card,
                  }}
                >
                  <Icon size={20} color={isSelected ? colors.primary : colors.mutedForeground} />
                  <Text
                    className={`text-xs font-medium mt-1.5 ${
                      isSelected ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {ch.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Timezone picker */}
        <View className="px-4 pt-4 pb-1">
          <Text className="text-foreground text-base font-bold mb-2">Timezone</Text>
          <TouchableOpacity
            onPress={() => setShowTimezones(!showTimezones)}
            activeOpacity={0.7}
            className="flex-row items-center justify-between p-3 bg-card border border-border rounded-xl"
          >
            <View className="flex-row items-center gap-2">
              <Globe size={16} color={colors.mutedForeground} />
              <Text className="text-foreground text-sm">{currentTzLabel}</Text>
            </View>
            <ChevronDown
              size={16}
              color={colors.mutedForeground}
              style={{ transform: [{ rotate: showTimezones ? '180deg' : '0deg' }] }}
            />
          </TouchableOpacity>

          {showTimezones && (
            <View className="bg-card border border-border rounded-xl mt-1 overflow-hidden">
              {COMMON_TIMEZONES.map((tz) => (
                <TouchableOpacity
                  key={tz.value}
                  onPress={() => {
                    setTimezone(tz.value);
                    setShowTimezones(false);
                  }}
                  className={`px-4 py-3 border-b border-border/50 ${
                    timezone === tz.value ? 'bg-primary/10' : ''
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      timezone === tz.value ? 'text-primary font-bold' : 'text-foreground'
                    }`}
                  >
                    {tz.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Calendar */}
        <View className="px-4 pt-4 pb-1">
          <Text className="text-foreground text-base font-bold mb-3">Select a date</Text>

          {/* Month navigation */}
          <View className="flex-row items-center justify-between mb-3">
            <TouchableOpacity
              onPress={goToPrevMonth}
              disabled={!canGoPrev}
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              activeOpacity={0.7}
              className="p-2 rounded-xl"
              style={{
                backgroundColor: canGoPrev ? colors.card : 'transparent',
                opacity: canGoPrev ? 1 : 0.3,
              }}
            >
              <ChevronLeft size={20} color={colors.foreground} />
            </TouchableOpacity>

            <Text className="text-foreground text-base font-bold">
              {MONTH_NAMES_FULL[viewMonth]} {viewYear}
            </Text>

            <TouchableOpacity
              onPress={goToNextMonth}
              disabled={!canGoNext}
              accessibilityRole="button"
              accessibilityLabel="Next month"
              activeOpacity={0.7}
              className="p-2 rounded-xl"
              style={{
                backgroundColor: canGoNext ? colors.card : 'transparent',
                opacity: canGoNext ? 1 : 0.3,
              }}
            >
              <ChevronRight size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Weekday headers */}
          <View className="flex-row mb-1">
            {WEEKDAY_HEADERS.map((day) => (
              <View key={day} className="flex-1 items-center py-1">
                <Text className="text-muted-foreground text-xs font-medium">{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          <View className="flex-row flex-wrap">
            {calendarDays.map((day, index) => {
              const isSelected = day.dateString === selectedDate;
              const isDisabled = !day.isCurrentMonth || !day.isAvailable;

              return (
                <TouchableOpacity
                  key={`${day.dateString}-${index}`}
                  onPress={() => handleDateSelect(day)}
                  disabled={isDisabled}
                  accessibilityRole="button"
                  accessibilityLabel={`${day.dateString}${
                    day.isAvailable ? ', available' : ', unavailable'
                  }${isSelected ? ', selected' : ''}`}
                  accessibilityState={{ selected: isSelected, disabled: isDisabled }}
                  activeOpacity={0.7}
                  style={{ width: '14.28%', aspectRatio: 1 }}
                  className="items-center justify-center"
                >
                  <View
                    className="items-center justify-center rounded-full"
                    style={{
                      width: 38,
                      height: 38,
                      backgroundColor: isSelected
                        ? colors.primary
                        : day.isToday && day.isAvailable
                        ? `${colors.primary}15`
                        : 'transparent',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: isSelected || day.isToday ? '700' : '400',
                        color: isSelected
                          ? '#FFFFFF'
                          : !day.isCurrentMonth
                          ? colors.border
                          : day.isAvailable
                          ? colors.foreground
                          : colors.mutedForeground,
                        opacity: !day.isCurrentMonth ? 0.3 : day.isAvailable ? 1 : 0.35,
                      }}
                    >
                      {day.dayNum}
                    </Text>
                  </View>
                  {/* Availability dot */}
                  {day.isCurrentMonth && day.isAvailable && !isSelected && (
                    <View
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: colors.primary,
                        marginTop: 1,
                      }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View className="flex-row items-center gap-4 mt-2 px-1">
            <View className="flex-row items-center gap-1.5">
              <View
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.primary,
                }}
              />
              <Text className="text-muted-foreground text-xs">Available</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Text
                style={{
                  fontSize: 10,
                  color: colors.mutedForeground,
                  opacity: 0.35,
                }}
              >
                15
              </Text>
              <Text className="text-muted-foreground text-xs">Unavailable</Text>
            </View>
          </View>
        </View>

        {/* Time slots */}
        <View className="px-4 pt-6">
          <Text className="text-foreground text-base font-bold mb-3">Available times</Text>

          {!selectedDate ? (
            <View className="items-center justify-center py-12">
              <Clock size={32} color={colors.mutedForeground} />
              <Text className="text-muted-foreground text-sm mt-3 text-center">
                Select a date to see available time slots.
              </Text>
            </View>
          ) : isLoading ? (
            <View className="items-center justify-center py-12">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-muted-foreground text-sm mt-3">Loading available times...</Text>
            </View>
          ) : availableTimes.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Clock size={32} color={colors.mutedForeground} />
              <Text className="text-muted-foreground text-sm mt-3 text-center">
                No available time slots for this date.{'\n'}Please select another date.
              </Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-3">
              {availableTimes.map((slot: any, index: number) => {
                const time = typeof slot === 'string' ? slot : slot.time || slot.slot;
                const isSelected = time === selectedTime;

                return (
                  <TouchableOpacity
                    key={time || index}
                    onPress={() => handleTimeSelect(time)}
                    accessibilityRole="button"
                    accessibilityLabel={`Time slot ${time}`}
                    accessibilityState={{ selected: isSelected }}
                    activeOpacity={0.7}
                    className={`rounded-xl py-3 border items-center justify-center ${
                      isSelected ? 'border-primary' : 'border-border'
                    }`}
                    style={{
                      backgroundColor: isSelected ? colors.primary : colors.card,
                      width: '30%',
                    }}
                  >
                    <Text
                      className={`text-sm font-bold ${
                        isSelected ? 'text-white' : 'text-foreground'
                      }`}
                    >
                      {time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Continue button */}
      <View className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <Button
          variant="primary"
          onPress={handleContinue}
          disabled={!selectedDate || !selectedTime}
        >
          Continue
        </Button>
      </View>
    </SafeAreaView>
  );
}
