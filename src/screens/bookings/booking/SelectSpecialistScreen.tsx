import React, {useEffect, useState, useCallback} from 'react';
import {View, Text, FlatList, TouchableOpacity, ScrollView} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import {Users, ChevronDown, X} from 'lucide-react-native';
import {Header, EmptyState, Skeleton} from '../../../components/ui';
import SpecialistCard from '../../../components/appointments/SpecialistCard';
import {useAppointmentsStore} from '../../../store/appointments';
import {colors} from '../../../theme/colors';
import type {BookingsStackParamList} from '../../../navigation/stacks/BookingsStack';

type Nav = NativeStackNavigationProp<BookingsStackParamList>;
type Route = RouteProp<BookingsStackParamList, 'SelectSpecialist'>;

const GENDER_OPTIONS = [
  {label: 'Any Gender', value: ''},
  {label: 'Male', value: 'Male'},
  {label: 'Female', value: 'Female'},
];

const RATING_OPTIONS = [
  {label: 'Any Rating', value: ''},
  {label: '4+ Stars', value: '4'},
  {label: '3+ Stars', value: '3'},
];

const CHANNEL_OPTIONS = [
  {label: 'Any Channel', value: ''},
  {label: 'Zoom', value: 'zoom'},
  {label: 'Google Meet', value: 'google_meet'},
  {label: 'Phone', value: 'phone'},
];

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`flex-row items-center gap-1 px-3 py-2 rounded-xl border ${
        active ? 'border-primary' : 'border-border'
      }`}
      style={{backgroundColor: active ? `${colors.primary}15` : colors.card}}>
      <Text
        className={`text-xs font-medium ${
          active ? 'text-primary' : 'text-muted-foreground'
        }`}>
        {label}
      </Text>
      <ChevronDown size={12} color={active ? colors.primary : colors.mutedForeground} />
    </TouchableOpacity>
  );
}

function FilterDropdown({
  visible,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  options: {label: string; value: string}[];
  selected: string;
  onSelect: (val: string) => void;
  onClose: () => void;
}) {
  if (!visible) return null;
  return (
    <View
      className="absolute top-full left-0 right-0 z-50 bg-card border border-border rounded-xl mt-1 shadow-lg"
      style={{elevation: 5}}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt.value}
          onPress={() => {
            onSelect(opt.value);
            onClose();
          }}
          className={`px-4 py-3 border-b border-border/50 ${
            selected === opt.value ? 'bg-primary/10' : ''
          }`}>
          <Text
            className={`text-sm ${
              selected === opt.value ? 'text-primary font-bold' : 'text-foreground'
            }`}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ListSkeleton() {
  return (
    <View className="p-4 gap-3">
      {[1, 2, 3].map(i => (
        <View key={i} className="bg-card border border-border rounded-2xl p-4 gap-3">
          <View className="flex-row items-start gap-3">
            <Skeleton width={56} height={56} borderRadius={28} />
            <View className="flex-1 gap-2">
              <Skeleton width="60%" height={16} />
              <Skeleton width="40%" height={12} />
              <Skeleton width="50%" height={12} />
            </View>
          </View>
          <Skeleton height={48} borderRadius={16} />
        </View>
      ))}
    </View>
  );
}

export default function SelectSpecialistScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const {professionalCategory, specialistCategory} = route.params;

  const {specialists, isLoading, fetchSpecialists, setBookingData} =
    useAppointmentsStore();

  const [gender, setGender] = useState('');
  const [rating, setRating] = useState('');
  const [channel, setChannel] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const hasFilters = !!gender || !!rating || !!channel;

  const loadSpecialists = useCallback(() => {
    const payload: any = {
      professional_category: professionalCategory,
      specialist_category: specialistCategory,
    };
    if (gender) payload.gender = gender;
    if (rating) payload.min_rating = Number(rating);
    if (channel) payload.meeting_channel = channel;
    fetchSpecialists(payload);
  }, [professionalCategory, specialistCategory, gender, rating, channel]);

  useEffect(() => {
    loadSpecialists();
  }, [loadSpecialists]);

  const clearFilters = () => {
    setGender('');
    setRating('');
    setChannel('');
  };

  const getFilterLabel = (
    options: {label: string; value: string}[],
    value: string,
    defaultLabel: string,
  ) => {
    if (!value) return defaultLabel;
    return options.find(o => o.value === value)?.label || defaultLabel;
  };

  const handleSelect = (specialist: any) => {
    setBookingData({specialist, categoryName: specialistCategory});
    navigation.navigate('SelectSchedule', {
      specialistId: specialist._id || specialist.id,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Select Specialist" onBack={() => navigation.goBack()} />

      {/* Step indicator */}
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center gap-2">
          <View className="flex-row gap-1.5">
            {[1, 2, 3, 4].map(step => (
              <View
                key={step}
                className="h-1.5 rounded-full"
                style={{
                  width: step <= 2 ? 32 : 16,
                  backgroundColor: step <= 2 ? colors.primary : colors.border,
                }}
              />
            ))}
          </View>
          <Text className="text-muted-foreground text-xs ml-2">Step 2 of 4</Text>
        </View>
      </View>

      <Text className="px-4 pt-2 pb-2 text-foreground text-base font-bold">
        Choose your specialist
      </Text>

      {/* Filter bar */}
      <View className="px-4 pb-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{gap: 8, paddingRight: 16}}>
          <View style={{position: 'relative'}}>
            <FilterChip
              label={getFilterLabel(GENDER_OPTIONS, gender, 'Gender')}
              active={!!gender}
              onPress={() =>
                setActiveDropdown(activeDropdown === 'gender' ? null : 'gender')
              }
            />
            <FilterDropdown
              visible={activeDropdown === 'gender'}
              options={GENDER_OPTIONS}
              selected={gender}
              onSelect={setGender}
              onClose={() => setActiveDropdown(null)}
            />
          </View>

          <View style={{position: 'relative'}}>
            <FilterChip
              label={getFilterLabel(RATING_OPTIONS, rating, 'Rating')}
              active={!!rating}
              onPress={() =>
                setActiveDropdown(activeDropdown === 'rating' ? null : 'rating')
              }
            />
            <FilterDropdown
              visible={activeDropdown === 'rating'}
              options={RATING_OPTIONS}
              selected={rating}
              onSelect={setRating}
              onClose={() => setActiveDropdown(null)}
            />
          </View>

          <View style={{position: 'relative'}}>
            <FilterChip
              label={getFilterLabel(CHANNEL_OPTIONS, channel, 'Channel')}
              active={!!channel}
              onPress={() =>
                setActiveDropdown(activeDropdown === 'channel' ? null : 'channel')
              }
            />
            <FilterDropdown
              visible={activeDropdown === 'channel'}
              options={CHANNEL_OPTIONS}
              selected={channel}
              onSelect={setChannel}
              onClose={() => setActiveDropdown(null)}
            />
          </View>

          {hasFilters && (
            <TouchableOpacity
              onPress={clearFilters}
              className="flex-row items-center gap-1 px-3 py-2 rounded-xl"
              style={{backgroundColor: `${colors.destructive}15`}}>
              <X size={12} color={colors.destructive} />
              <Text className="text-destructive text-xs font-medium">Clear</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {isLoading && specialists.length === 0 ? (
        <ListSkeleton />
      ) : (
        <FlatList
          data={specialists}
          keyExtractor={item => item._id || item.id || String(Math.random())}
          renderItem={({item}) => (
            <SpecialistCard
              specialist={item}
              onSelect={() => handleSelect(item)}
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 40,
            flexGrow: specialists.length === 0 ? 1 : undefined,
          }}
          ListEmptyComponent={
            <EmptyState
              icon={<Users size={32} color={colors.mutedForeground} />}
              title="No specialists available"
              subtitle={
                hasFilters
                  ? 'No specialists match your filters. Try adjusting your criteria.'
                  : 'There are no specialists available in this category right now. Please try again later.'
              }
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
