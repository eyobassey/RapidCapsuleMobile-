import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import {
  ArrowRight,
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
  Sparkles,
  X,
  Clock,
} from 'lucide-react-native';
import { Header, Skeleton, Text } from '../../../components/ui';
import { useAppointmentsStore } from '../../../store/appointments';
import { colors } from '../../../theme/colors';
import type { BookingsStackParamList } from '../../../navigation/stacks/BookingsStack';

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
      return iconMap[key] ?? Stethoscope;
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

// ─── AI specialty suggestion ──────────────────────────────
const SPECIALTY_KEYWORDS: Array<{ keywords: string[]; match: string }> = [
  {
    keywords: [
      'heart',
      'cardiac',
      'chest pain',
      'palpitation',
      'cardiovascular',
      'hypertension',
      'blood pressure',
    ],
    match: 'cardiology',
  },
  {
    keywords: [
      'brain',
      'neuro',
      'headache',
      'migraine',
      'seizure',
      'stroke',
      'dizziness',
      'vertigo',
      'tremor',
    ],
    match: 'neurology',
  },
  {
    keywords: [
      'skin',
      'rash',
      'acne',
      'eczema',
      'psoriasis',
      'dermatitis',
      'itching',
      'hives',
      'lesion',
    ],
    match: 'dermatology',
  },
  {
    keywords: ['eye', 'vision', 'sight', 'retina', 'glaucoma', 'cataract', 'ophthal', 'blindness'],
    match: 'ophthalmology',
  },
  { keywords: ['child', 'pediatr', 'infant', 'baby', 'toddler', 'newborn'], match: 'pediatrics' },
  {
    keywords: [
      'bone',
      'joint',
      'ortho',
      'fracture',
      'spine',
      'back pain',
      'arthritis',
      'knee',
      'shoulder',
      'hip',
      'ligament',
    ],
    match: 'orthopedics',
  },
  {
    keywords: [
      'stomach',
      'gastro',
      'digestive',
      'intestin',
      'bowel',
      'liver',
      'colon',
      'ulcer',
      'acid reflux',
      'nausea',
      'diarrhea',
    ],
    match: 'gastroenterology',
  },
  {
    keywords: [
      'lung',
      'breath',
      'respir',
      'asthma',
      'cough',
      'pneumonia',
      'bronchitis',
      'copd',
      'inhaler',
    ],
    match: 'pulmonology',
  },
  {
    keywords: [
      'mental',
      'anxiety',
      'depress',
      'psych',
      'stress',
      'mood',
      'insomnia',
      'panic',
      'trauma',
      'ptsd',
    ],
    match: 'psychiatry',
  },
  { keywords: ['kidney', 'urin', 'nephro', 'bladder', 'prostate', 'renal'], match: 'nephrology' },
  {
    keywords: ['diabetes', 'endocrin', 'thyroid', 'hormone', 'insulin', 'glucose'],
    match: 'endocrinology',
  },
  {
    keywords: ['gynecol', 'obstetric', 'pregnancy', 'menstrual', 'period', 'uterus', 'ovary'],
    match: 'gynecology',
  },
  { keywords: ['ear', 'nose', 'throat', 'hearing', 'sinusitis', 'tonsil', 'ent'], match: 'ent' },
  {
    keywords: ['blood', 'anaemia', 'anemia', 'hemato', 'platelet', 'lymphoma', 'leukemia'],
    match: 'hematology',
  },
];

function suggestCategory(
  checkup: any,
  categories: any[]
): { category: any; conditionName: string } | null {
  if (!checkup || categories.length === 0) return null;

  const conditions: any[] = checkup.response?.data?.conditions ?? [];
  const top = conditions[0];
  if (!top) return null;

  const conditionName: string = top.common_name || top.name || '';
  const lower = conditionName.toLowerCase();

  // 1. Direct specialist field on the condition
  const directSpecialist: string | undefined = top.specialist || top.recommended_specialist;
  if (directSpecialist) {
    const dl = directSpecialist.toLowerCase();
    const match = categories.find(
      (c: any) => c.name.toLowerCase().includes(dl) || dl.includes(c.name.toLowerCase())
    );
    if (match) return { category: match, conditionName };
  }

  // 2. Keyword mapping
  for (const { keywords, match } of SPECIALTY_KEYWORDS) {
    if (keywords.some((k) => lower.includes(k))) {
      const found = categories.find((c: any) => c.name.toLowerCase().includes(match));
      if (found) return { category: found, conditionName };
    }
  }

  // 3. Substring match between condition name and category name
  for (const c of categories) {
    const cn = c.name.toLowerCase();
    if (
      lower.includes(cn) ||
      cn.split(' ').some((w: string) => w.length > 4 && lower.includes(w))
    ) {
      return { category: c, conditionName };
    }
  }

  // 4. Fall back to General Practice
  const general = categories.find((c: any) => c.name.toLowerCase().includes('general'));
  if (general) return { category: general, conditionName };

  return null;
}

function LoadingSkeleton() {
  return (
    <View className="flex-row flex-wrap px-4 gap-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View
          key={i}
          style={{
            width: '47%',
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 16,
            padding: 16,
            alignItems: 'center',
            gap: 12,
          }}
        >
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
  } = useAppointmentsStore();

  const [showSuggestion, setShowSuggestion] = useState(false);
  const hasLinkedCheckup = !!healthCheckupId;

  // Derive AI specialty suggestion from the linked or most recent checkup
  const aiSuggestion = useMemo(() => {
    if (categories.length === 0) return null;
    const source = healthCheckupId
      ? recentCheckups.find((c: any) => (c._id || c.id) === healthCheckupId) ?? recentCheckups[0]
      : recentCheckups[0];
    return source ? suggestCategory(source, categories) : null;
  }, [healthCheckupId, recentCheckups, categories]);

  useEffect(() => {
    if (healthCheckupId) {
      setBookingData({ health_checkup_id: healthCheckupId, healthCheckupSummary });
    }
    void fetchCategories();
    // Fetch recent checkups to decide whether to show suggestion
    void fetchRecentCheckups();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: only run on mount
  }, []);

  // Show "take a health checkup" prompt only when there's no data to build an AI suggestion from
  useEffect(() => {
    if (!hasLinkedCheckup && recentCheckups.length === 0 && categories.length > 0) {
      setShowSuggestion(true);
    } else if (recentCheckups.length > 0) {
      // Checkups loaded — AI tile will show instead; dismiss the prompt
      setShowSuggestion(false);
    }
  }, [recentCheckups, hasLinkedCheckup, categories]);

  const handleSelect = (category: any) => {
    setBookingData({
      categoryId: category._id || category.id,
      categoryName: category.name,
      professionalCategory: category.professional_category || 'Specialist',
    });
    navigation.navigate('SelectSchedule');
  };

  const handleStartCheckup = () => {
    (navigation as any).navigate('Home', { screen: 'HealthCheckupPatientInfo' });
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Select Specialty" onBack={() => navigation.goBack()} />

      {/* Step indicator */}
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center gap-2">
          <View className="flex-row gap-1.5">
            {[1, 2, 3, 4, 5, 6].map((step) => (
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
          <Text className="text-muted-foreground text-xs ml-2">Step 3 of 6</Text>
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
          showsVerticalScrollIndicator={false}
        >
          {/* Health checkup suggestion card */}
          {showSuggestion && (
            <View
              className="rounded-2xl p-4 mb-4 border"
              style={{
                backgroundColor: `${colors.primary}08`,
                borderColor: `${colors.primary}25`,
              }}
            >
              <View className="flex-row items-start gap-3">
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center"
                  style={{ backgroundColor: `${colors.primary}20` }}
                >
                  <ClipboardCheck size={20} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground text-sm font-bold">
                    Get better care with a quick health checkup
                  </Text>
                  <Text className="text-muted-foreground text-xs mt-1 leading-relaxed">
                    A 3-5 min AI health assessment helps your specialist understand your symptoms
                    before your appointment — leading to a more focused and productive consultation.
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
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
              <View className="flex-row gap-3 mt-3">
                <TouchableOpacity
                  onPress={handleStartCheckup}
                  accessibilityRole="button"
                  accessibilityLabel="Start health checkup"
                  activeOpacity={0.7}
                  className="flex-1 py-2.5 rounded-xl items-center"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="text-white text-xs font-bold">Start Health Checkup</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowSuggestion(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss health checkup suggestion"
                  activeOpacity={0.7}
                  className="flex-1 py-2.5 rounded-xl items-center border"
                  style={{ borderColor: colors.border, backgroundColor: colors.card }}
                >
                  <Text className="text-muted-foreground text-xs font-medium">Maybe Later</Text>
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
              }}
            >
              <ClipboardCheck size={18} color={colors.success} />
              <View className="flex-1">
                <Text className="text-success text-sm font-bold">Health Checkup Linked</Text>
                <Text className="text-muted-foreground text-xs mt-0.5">
                  Results will be included in your notes for the specialist
                </Text>
              </View>
            </View>
          )}

          {/* AI Suggestion tile */}
          {aiSuggestion && (
            <View
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: `${colors.primary}30`,
                backgroundColor: `${colors.primary}08`,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={18} color="#fff" strokeWidth={1.75} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: colors.foreground,
                      marginBottom: 2,
                    }}
                  >
                    AI Suggestion
                  </Text>
                  <Text style={{ fontSize: 12, lineHeight: 18, color: colors.mutedForeground }}>
                    Based on your symptoms
                    {aiSuggestion.conditionName ? ` (${aiSuggestion.conditionName})` : ''}, we
                    recommend{' '}
                    <Text style={{ fontWeight: '700', color: colors.foreground }}>
                      {aiSuggestion.category.name}
                    </Text>
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => handleSelect(aiSuggestion.category)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Select ${aiSuggestion.category.name}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: `${colors.primary}25`,
                  borderRadius: 10,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>
                  Select
                </Text>
                <ArrowRight size={14} color={colors.primary} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          )}

          {/* Category grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {categories.map((category: any, index: number) => {
              const IconComponent = getIconForCategory(category.name);
              const color = categoryColors[index % categoryColors.length];

              return (
                <TouchableOpacity
                  key={category._id || category.id || index}
                  onPress={() => handleSelect(category)}
                  accessibilityRole="button"
                  accessibilityLabel={`${category.name} specialty`}
                  accessibilityHint="Double tap to select this specialty"
                  activeOpacity={0.7}
                  className="bg-card border border-border rounded-2xl p-4 items-center justify-center"
                  style={{ width: '47%', minHeight: 120 }}
                >
                  <View
                    className="w-12 h-12 rounded-2xl items-center justify-center mb-3"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <IconComponent size={24} color={color} />
                  </View>
                  <Text className="text-foreground text-sm font-bold text-center" numberOfLines={2}>
                    {category.name}
                  </Text>
                  {category.description && (
                    <Text
                      className="text-muted-foreground text-xs text-center mt-1"
                      numberOfLines={2}
                    >
                      {category.description}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}

            {categories.length === 0 && !isLoading && (
              <View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 80,
                  width: '100%',
                }}
              >
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
