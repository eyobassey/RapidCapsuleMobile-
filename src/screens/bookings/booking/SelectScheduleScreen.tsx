import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {View, Text, ScrollView, TouchableOpacity, ActivityIndicator} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import {Clock} from 'lucide-react-native';
import {Header, Button, EmptyState} from '../../../components/ui';
import {useAppointmentsStore} from '../../../store/appointments';
import {colors} from '../../../theme/colors';
import type {BookingsStackParamList} from '../../../navigation/stacks/BookingsStack';

type Nav = NativeStackNavigationProp<BookingsStackParamList>;
type Route = RouteProp<BookingsStackParamList, 'SelectSchedule'>;

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface DateItem {
  date: Date;
  dateString: string; // YYYY-MM-DD
  dayName: string;
  dayNum: number;
  monthName: string;
  isToday: boolean;
}

function generateNext14Days(): DateItem[] {
  const today = new Date();
  const days: DateItem[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    days.push({
      date: d,
      dateString: `${year}-${month}-${day}`,
      dayName: DAY_NAMES[d.getDay()],
      dayNum: d.getDate(),
      monthName: MONTH_NAMES[d.getMonth()],
      isToday: i === 0,
    });
  }
  return days;
}

export default function SelectScheduleScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const {specialistId} = route.params;

  const {availableTimes, isLoading, fetchAvailableTimes, setBookingData} =
    useAppointmentsStore();

  const days = useMemo(() => generateNext14Days(), []);
  const [selectedDate, setSelectedDate] = useState(days[0]?.dateString || '');
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableTimes({specialistId, date: selectedDate});
      setSelectedTime(null);
    }
  }, [selectedDate, specialistId]);

  const handleDateSelect = useCallback((dateString: string) => {
    setSelectedDate(dateString);
  }, []);

  const handleTimeSelect = useCallback((time: string) => {
    setSelectedTime(time);
  }, []);

  const handleContinue = useCallback(() => {
    if (!selectedDate || !selectedTime) return;
    setBookingData({date: selectedDate, time: selectedTime});
    navigation.navigate('ConfirmBooking');
  }, [selectedDate, selectedTime, setBookingData, navigation]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Select Schedule" onBack={() => navigation.goBack()} />

      {/* Step indicator */}
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center gap-2">
          <View className="flex-row gap-1.5">
            {[1, 2, 3, 4].map(step => (
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
        contentContainerStyle={{paddingBottom: 100}}>
        {/* Date selector */}
        <View className="px-4 pt-2 pb-1">
          <Text className="text-foreground text-base font-bold mb-3">Select a date</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{paddingHorizontal: 16, gap: 10, paddingBottom: 4}}>
          {days.map(day => {
            const isSelected = day.dateString === selectedDate;
            return (
              <TouchableOpacity
                key={day.dateString}
                onPress={() => handleDateSelect(day.dateString)}
                activeOpacity={0.7}
                className={`items-center justify-center rounded-2xl py-3 px-4 border ${
                  isSelected
                    ? 'border-primary'
                    : 'border-border'
                }`}
                style={{
                  backgroundColor: isSelected ? colors.primary : colors.card,
                  minWidth: 64,
                }}>
                <Text
                  className={`text-xs font-medium ${
                    isSelected ? 'text-white' : 'text-muted-foreground'
                  }`}>
                  {day.dayName}
                </Text>
                <Text
                  className={`text-xl font-bold mt-1 ${
                    isSelected ? 'text-white' : 'text-foreground'
                  }`}>
                  {day.dayNum}
                </Text>
                <Text
                  className={`text-xs mt-0.5 ${
                    isSelected ? 'text-white/80' : 'text-muted-foreground'
                  }`}>
                  {day.monthName}
                </Text>
                {day.isToday && (
                  <View
                    className="w-1.5 h-1.5 rounded-full mt-1"
                    style={{
                      backgroundColor: isSelected ? colors.white : colors.primary,
                    }}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Time slots */}
        <View className="px-4 pt-6">
          <Text className="text-foreground text-base font-bold mb-3">Available times</Text>

          {isLoading ? (
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
                    activeOpacity={0.7}
                    className={`rounded-xl py-3 border items-center justify-center ${
                      isSelected ? 'border-primary' : 'border-border'
                    }`}
                    style={{
                      backgroundColor: isSelected ? colors.primary : colors.card,
                      width: '30%',
                    }}>
                    <Text
                      className={`text-sm font-bold ${
                        isSelected ? 'text-white' : 'text-foreground'
                      }`}>
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
          disabled={!selectedDate || !selectedTime}>
          Continue
        </Button>
      </View>
    </SafeAreaView>
  );
}
