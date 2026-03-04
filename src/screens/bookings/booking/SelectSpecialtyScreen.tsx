import React, {useEffect} from 'react';
import {View, Text, ScrollView, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  Stethoscope,
  Heart,
  Brain,
  Bone,
  Eye,
  Baby,
  Smile,
  Activity,
  Pill,
  Shield,
  Syringe,
  Microscope,
} from 'lucide-react-native';
import {Header, Skeleton} from '../../../components/ui';
import {useAppointmentsStore} from '../../../store/appointments';
import {colors} from '../../../theme/colors';
import type {BookingsStackParamList} from '../../../navigation/stacks/BookingsStack';

type Nav = NativeStackNavigationProp<BookingsStackParamList>;

// Attempt to map category names to icons; fallback to Stethoscope
const iconMap: Record<string, React.ComponentType<any>> = {
  cardiology: Heart,
  neurology: Brain,
  orthopedics: Bone,
  ophthalmology: Eye,
  pediatrics: Baby,
  dermatology: Smile,
  general: Stethoscope,
  internal: Activity,
  pharmacy: Pill,
  immunology: Shield,
  surgery: Syringe,
  pathology: Microscope,
};

function getIconForCategory(name: string): React.ComponentType<any> {
  const lower = name?.toLowerCase() || '';
  for (const key in iconMap) {
    if (lower.includes(key)) {
      return iconMap[key];
    }
  }
  return Stethoscope;
}

const categoryColors = [
  colors.primary,
  colors.secondary,
  colors.accent,
  colors.success,
  colors.destructive,
  '#a855f7',
  '#06b6d4',
  '#f59e0b',
];

function LoadingSkeleton() {
  return (
    <View className="flex-row flex-wrap px-4 gap-3">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <View
          key={i}
          className="bg-card border border-border rounded-2xl p-4 items-center gap-3"
          style={{width: '47%'}}>
          <Skeleton width={48} height={48} borderRadius={16} />
          <Skeleton width="70%" height={14} />
        </View>
      ))}
    </View>
  );
}

export default function SelectSpecialtyScreen() {
  const navigation = useNavigation<Nav>();
  const {categories, isLoading, fetchCategories, setBookingData, clearBookingData} =
    useAppointmentsStore();

  useEffect(() => {
    clearBookingData();
    fetchCategories();
  }, []);

  const handleSelect = (category: any) => {
    setBookingData({
      categoryId: category._id || category.id,
      categoryName: category.name,
    });
    navigation.navigate('SelectSpecialist', {
      categoryId: category._id || category.id,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Select Specialty" onBack={() => navigation.goBack()} />

      {/* Step indicator */}
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center gap-2">
          <View className="flex-row gap-1.5">
            {[1, 2, 3, 4].map(step => (
              <View
                key={step}
                className="h-1.5 rounded-full"
                style={{
                  width: step === 1 ? 32 : 16,
                  backgroundColor: step === 1 ? colors.primary : colors.border,
                }}
              />
            ))}
          </View>
          <Text className="text-muted-foreground text-xs ml-2">Step 1 of 4</Text>
        </View>
      </View>

      <Text className="px-4 pt-2 pb-4 text-foreground text-base font-bold">
        What type of specialist do you need?
      </Text>

      {isLoading && categories.length === 0 ? (
        <LoadingSkeleton />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 40,
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
          }}
          showsVerticalScrollIndicator={false}>
          {categories.map((category: any, index: number) => {
            const IconComponent = getIconForCategory(category.name);
            const color = categoryColors[index % categoryColors.length];

            return (
              <TouchableOpacity
                key={category._id || category.id || index}
                onPress={() => handleSelect(category)}
                activeOpacity={0.7}
                className="bg-card border border-border rounded-2xl p-4 items-center justify-center"
                style={{width: '47%', minHeight: 120}}>
                <View
                  className="w-12 h-12 rounded-2xl items-center justify-center mb-3"
                  style={{backgroundColor: `${color}20`}}>
                  <IconComponent size={24} color={color} />
                </View>
                <Text
                  className="text-foreground text-sm font-bold text-center"
                  numberOfLines={2}>
                  {category.name}
                </Text>
                {category.description && (
                  <Text
                    className="text-muted-foreground text-xs text-center mt-1"
                    numberOfLines={2}>
                    {category.description}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}

          {categories.length === 0 && !isLoading && (
            <View className="flex-1 items-center justify-center py-20" style={{width: '100%'}}>
              <Stethoscope size={32} color={colors.mutedForeground} />
              <Text className="text-muted-foreground text-base mt-3">
                No specialties available
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
