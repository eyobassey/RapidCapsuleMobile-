import React, {useEffect} from 'react';
import {View, Text, ScrollView, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  User,
  MapPin,
  Users,
  Activity,
  AlertTriangle,
  Stethoscope,
  Smartphone,
  Wallet,
  Check,
  ChevronRight,
  Heart,
} from 'lucide-react-native';
import {ProgressRing, Button} from '../../components/ui';
import {colors} from '../../theme/colors';
import {useOnboardingStore} from '../../store/onboarding';
import {useAuthStore} from '../../store/auth';
import {ONBOARDING_STEPS, type OnboardingStepConfig} from '../../types/onboarding.types';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {OnboardingStackParamList} from '../../navigation/OnboardingStack';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingDashboard'>;

const ICON_MAP: Record<string, any> = {
  User,
  MapPin,
  Users,
  Activity,
  AlertTriangle,
  Stethoscope,
  Smartphone,
  Wallet,
};

export default function OnboardingDashboardScreen({navigation}: Props) {
  const user = useAuthStore(s => s.user);
  const {completedSections, progress, summaryData, refreshFromUser} =
    useOnboardingStore();

  // Refresh when screen loads
  useEffect(() => {
    if (user) refreshFromUser(user);
  }, [user, refreshFromUser]);

  const requiredSteps = ONBOARDING_STEPS.filter(s => s.required);
  const optionalSteps = ONBOARDING_STEPS.filter(s => !s.required);
  const allRequiredDone = requiredSteps.every(
    s => completedSections[s.key],
  );
  const completedCount = ONBOARDING_STEPS.filter(
    s => completedSections[s.key],
  ).length;

  const handleSkip = () => {
    // Navigate to main app — the RootNavigator will handle routing
    (navigation as any).reset({index: 0, routes: [{name: 'Main'}]});
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}}>
      {/* Header with progress ring */}
      <View
        style={{
          paddingTop: 16,
          paddingBottom: 16,
          paddingHorizontal: 24,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.card,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <View style={{flex: 1}}>
          <Text style={{fontWeight: '700', fontSize: 20, color: colors.foreground}}>
            Profile Setup
          </Text>
          <Text style={{fontSize: 12, color: colors.mutedForeground, marginTop: 2}}>
            {completedCount} of {ONBOARDING_STEPS.length} sections complete
          </Text>
        </View>
        <ProgressRing progress={progress} size={52} strokeWidth={4}>
          <Text accessibilityLabel={`Profile setup ${progress}% complete`} style={{fontSize: 12, fontWeight: '700', color: colors.foreground}}>
            {progress}%
          </Text>
        </ProgressRing>
      </View>

      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{padding: 16, paddingBottom: 120, gap: 12}}
        showsVerticalScrollIndicator={false}>
        {/* Required section */}
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 1,
            color: colors.mutedForeground,
            marginLeft: 4,
            marginTop: 4,
            marginBottom: 2,
          }}>
          Required
        </Text>
        {requiredSteps.map(step => (
          <StepCard
            key={step.key}
            step={step}
            isComplete={completedSections[step.key]}
            summary={summaryData[step.key]}
            onPress={() =>
              navigation.navigate(step.route as keyof OnboardingStackParamList)
            }
          />
        ))}

        {/* Optional section */}
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 1,
            color: colors.mutedForeground,
            marginLeft: 4,
            marginTop: 16,
            marginBottom: 2,
          }}>
          Optional
        </Text>
        {optionalSteps.map(step => (
          <StepCard
            key={step.key}
            step={step}
            isComplete={completedSections[step.key]}
            summary={summaryData[step.key]}
            onPress={() =>
              navigation.navigate(step.route as keyof OnboardingStackParamList)
            }
          />
        ))}

        {/* Health tip */}
        <View
          style={{
            backgroundColor: `${colors.success}15`,
            borderWidth: 1,
            borderColor: `${colors.success}30`,
            borderRadius: 16,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginTop: 8,
          }}>
          <Heart size={20} color={colors.success} />
          <Text style={{flex: 1, fontSize: 12, color: colors.foreground, lineHeight: 18}}>
            A complete health profile helps doctors provide better care and enables personalized AI health insights.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 16,
          paddingBottom: 28,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}>
        {allRequiredDone ? (
          <Button onPress={handleSkip}>Continue to Dashboard</Button>
        ) : (
          <Button disabled>Complete Required Steps</Button>
        )}
        {allRequiredDone ? null : (
          <Text
            style={{
              fontSize: 10,
              textAlign: 'center',
              color: colors.mutedForeground,
              marginTop: 8,
            }}>
            Complete required steps to access the app
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── StepCard ────────────────────────────────────────────────────

function StepCard({
  step,
  isComplete,
  summary,
  onPress,
}: {
  step: OnboardingStepConfig;
  isComplete: boolean;
  summary?: any;
  onPress: () => void;
}) {
  const IconComponent = ICON_MAP[step.icon] || User;
  const iconColor = isComplete ? colors.success : colors.mutedForeground;
  const iconBg = isComplete ? `${colors.success}15` : colors.muted;

  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${step.title}, ${isComplete ? 'Completed' : step.subtitle}`}
      accessibilityHint={isComplete ? 'Double tap to edit' : 'Double tap to start'}
      activeOpacity={0.7}
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderLeftWidth: isComplete ? 3 : 1,
        borderLeftColor: isComplete ? colors.success : colors.border,
        opacity: isComplete ? 0.85 : 1,
      }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {isComplete ? (
          <Check size={18} color={colors.success} />
        ) : (
          <IconComponent size={18} color={iconColor} />
        )}
      </View>

      <View style={{flex: 1}}>
        <Text style={{fontWeight: '700', fontSize: 14, color: colors.foreground}}>
          {step.title}
        </Text>
        {isComplete && summary ? (
          <SummaryText sectionKey={step.key} summary={summary} />
        ) : (
          <Text style={{fontSize: 11, color: colors.mutedForeground, marginTop: 2}}>
            {isComplete ? 'Completed' : step.subtitle}
          </Text>
        )}
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: '600',
            color: isComplete ? colors.mutedForeground : colors.primary,
          }}>
          {isComplete ? 'Edit' : 'Start'}
        </Text>
        <ChevronRight
          size={14}
          color={isComplete ? colors.mutedForeground : colors.primary}
        />
      </View>
    </TouchableOpacity>
  );
}

// ─── Summary text for completed cards ────────────────────────────

function SummaryText({sectionKey, summary}: {sectionKey: string; summary: any}) {
  let text = 'Completed';

  switch (sectionKey) {
    case 'personalDetails':
      text = summary.name || 'Completed';
      break;
    case 'addressEmergency':
      text = summary.contactCount
        ? `${summary.contactCount} emergency contact${summary.contactCount > 1 ? 's' : ''}`
        : 'Completed';
      break;
    case 'dependants':
      text = summary.count
        ? `${summary.count} dependant${summary.count > 1 ? 's' : ''}`
        : 'Completed';
      break;
    case 'vitalsMetrics':
      const parts = [];
      if (summary.bmi) parts.push(`BMI: ${summary.bmi}`);
      if (summary.bloodType) parts.push(summary.bloodType);
      text = parts.length > 0 ? parts.join(' · ') : 'Completed';
      break;
    case 'allergies':
      text = summary.count
        ? `${summary.count} allerg${summary.count > 1 ? 'ies' : 'y'} recorded`
        : summary.hasAllergies === false
          ? 'No known allergies'
          : 'Completed';
      break;
    case 'medicalHistory': {
      const mParts = [];
      if (summary.conditions) mParts.push(`${summary.conditions} condition${summary.conditions > 1 ? 's' : ''}`);
      if (summary.medications) mParts.push(`${summary.medications} medication${summary.medications > 1 ? 's' : ''}`);
      text = mParts.length > 0 ? mParts.join(', ') : 'Completed';
      break;
    }
    case 'deviceIntegration':
      text =
        (summary.apps || 0) + (summary.devices || 0) > 0
          ? `${(summary.apps || 0) + (summary.devices || 0)} connected`
          : 'Completed';
      break;
    case 'walletCredits':
      text = summary.balance
        ? `Balance: ${summary.currency} ${summary.balance}`
        : 'Completed';
      break;
  }

  return (
    <Text style={{fontSize: 11, color: colors.success, marginTop: 2}} numberOfLines={1}>
      {text}
    </Text>
  );
}
