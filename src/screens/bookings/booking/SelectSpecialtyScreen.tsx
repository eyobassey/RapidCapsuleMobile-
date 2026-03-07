import React, {useEffect, useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
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
  ClipboardCheck,
  X,
  Clock,
} from 'lucide-react-native';
import {Header, Button, Skeleton} from '../../../components/ui';
import {useAppointmentsStore} from '../../../store/appointments';
import {colors} from '../../../theme/colors';
import type {BookingsStackParamList} from '../../../navigation/stacks/BookingsStack';

type Nav = NativeStackNavigationProp<BookingsStackParamList>;
type Route = RouteProp<BookingsStackParamList, 'SelectSpecialty'>;

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
          style={{width: '47%', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, alignItems: 'center', gap: 12}}>
          <Skeleton width={48} height={48} borderRadius={16} />
          <Skeleton width="70%" height={14} />
        </View>
      ))}
    </View>
  );
}

export default function SelectSpecialtyScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const healthCheckupId = route.params?.healthCheckupId;
  const healthCheckupSummary = route.params?.healthCheckupSummary;
  const {
    categories,
    recentCheckups,
    isLoading,
    fetchCategories,
    fetchRecentCheckups,
    setBookingData,
    clearBookingData,
  } = useAppointmentsStore();

  const [showSuggestion, setShowSuggestion] = useState(false);
  const hasLinkedCheckup = !!healthCheckupId;

  useEffect(() => {
    clearBookingData();
    if (healthCheckupId) {
      setBookingData({health_checkup_id: healthCheckupId, healthCheckupSummary});
    }
    fetchCategories();
    // Fetch recent checkups to decide whether to show suggestion
    fetchRecentCheckups();
  }, []);

  // Show suggestion only if no linked checkup and no recent checkups
  useEffect(() => {
    if (!hasLinkedCheckup && recentCheckups.length === 0 && categories.length > 0) {
      setShowSuggestion(true);
    }
  }, [recentCheckups, hasLinkedCheckup, categories]);

  const handleSelect = (category: any) => {
    setBookingData({
      categoryId: category._id || category.id,
      categoryName: category.name,
    });
    navigation.navigate('SelectSpecialist', {
      professionalCategory: category.professional_category || 'Specialist',
      specialistCategory: category.name,
    });
  };

  const handleStartCheckup = () => {
    (navigation as any).navigate('Home', {screen: 'HealthCheckupPatientInfo'});
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

      <Text className="px-4 pt-2 pb-2 text-foreground text-base font-bold">
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
          }}
          showsVerticalScrollIndicator={false}>

          {/* Health checkup suggestion card */}
          {showSuggestion && (
            <View
              className="rounded-2xl p-4 mb-4 border"
              style={{
                backgroundColor: `${colors.primary}08`,
                borderColor: `${colors.primary}25`,
              }}>
              <View className="flex-row items-start gap-3">
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center"
                  style={{backgroundColor: `${colors.primary}20`}}>
                  <ClipboardCheck size={20} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground text-sm font-bold">
                    Get better care with a quick health checkup
                  </Text>
                  <Text className="text-muted-foreground text-xs mt-1 leading-relaxed">
                    A 3-5 min AI health assessment helps your specialist understand your
                    symptoms before your appointment — leading to a more focused and
                    productive consultation.
                  </Text>
                  <View className="flex-row items-center gap-1.5 mt-1.5">
                    <Clock size={11} color={colors.mutedForeground} />
                    <Text className="text-muted-foreground text-[11px]">
                      Takes only 3-5 minutes
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setShowSuggestion(false)}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <X size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
              <View className="flex-row gap-3 mt-3">
                <TouchableOpacity
                  onPress={handleStartCheckup}
                  activeOpacity={0.7}
                  className="flex-1 py-2.5 rounded-xl items-center"
                  style={{backgroundColor: colors.primary}}>
                  <Text className="text-white text-xs font-bold">
                    Start Health Checkup
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowSuggestion(false)}
                  activeOpacity={0.7}
                  className="flex-1 py-2.5 rounded-xl items-center border"
                  style={{borderColor: colors.border, backgroundColor: colors.card}}>
                  <Text className="text-muted-foreground text-xs font-medium">
                    Maybe Later
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Linked health checkup banner */}
          {hasLinkedCheckup && (
            <View
              className="flex-row items-center gap-3 p-3 rounded-xl mb-4 border"
              style={{
                backgroundColor: `${colors.success}10`,
                borderColor: `${colors.success}30`,
              }}>
              <ClipboardCheck size={18} color={colors.success} />
              <View className="flex-1">
                <Text className="text-success text-sm font-bold">
                  Health Checkup Linked
                </Text>
                <Text className="text-muted-foreground text-xs mt-0.5">
                  Results will be included in your notes for the specialist
                </Text>
              </View>
            </View>
          )}

          {/* Category grid */}
          <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 12}}>
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
              <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80, width: '100%'}}>
                <Stethoscope size={32} color={colors.mutedForeground} />
                <Text className="text-muted-foreground text-base mt-3">
                  No specialties available
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
