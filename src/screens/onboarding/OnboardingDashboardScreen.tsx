import React from 'react';
import {View, Text, ScrollView, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Check,
  MapPin,
  Activity,
  Stethoscope,
  Pill,
  Users,
  Smartphone,
  Wallet,
  AlertTriangle,
} from 'lucide-react-native';
import Svg, {Circle} from 'react-native-svg';
import {Button} from '../../components/ui';
import {colors} from '../../theme/colors';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {OnboardingStackParamList} from '../../navigation/OnboardingStack';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingDashboard'>;

interface StepItem {
  icon: React.ReactNode;
  title: string;
  status: 'completed' | 'pending' | 'not_started';
  required: boolean;
  screen?: keyof OnboardingStackParamList;
}

const STEPS: StepItem[] = [
  {
    icon: <Check size={16} color={colors.success} />,
    title: 'Personal Details',
    status: 'completed',
    required: true,
  },
  {
    icon: <MapPin size={16} color={colors.primary} />,
    title: 'Address & Emergency',
    status: 'pending',
    required: true,
    screen: 'EmergencyContact',
  },
  {
    icon: <Activity size={16} color={colors.mutedForeground} />,
    title: 'Vitals & Metrics',
    status: 'not_started',
    required: false,
  },
  {
    icon: <Stethoscope size={16} color={colors.mutedForeground} />,
    title: 'Medical History',
    status: 'not_started',
    required: false,
  },
  {
    icon: <Users size={16} color={colors.mutedForeground} />,
    title: 'Dependants',
    status: 'not_started',
    required: false,
  },
  {
    icon: <AlertTriangle size={16} color={colors.mutedForeground} />,
    title: 'Allergies',
    status: 'not_started',
    required: false,
  },
  {
    icon: <Smartphone size={16} color={colors.mutedForeground} />,
    title: 'Devices',
    status: 'not_started',
    required: false,
  },
  {
    icon: <Wallet size={16} color={colors.mutedForeground} />,
    title: 'Wallet & Credits',
    status: 'not_started',
    required: false,
  },
];

export default function OnboardingDashboardScreen({navigation}: Props) {
  const completedCount = STEPS.filter(s => s.status === 'completed').length;
  const progress = Math.round((completedCount / STEPS.length) * 100);
  const remaining = STEPS.filter(s => s.status !== 'completed' && s.required).length;
  const circumference = 2 * Math.PI * 16;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const requiredSteps = STEPS.filter(s => s.required);
  const optionalSteps = STEPS.filter(s => !s.required);
  const allRequiredDone = requiredSteps.every(s => s.status === 'completed');

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="pt-4 pb-4 px-6 border-b border-border bg-card flex-row items-center justify-between">
        <View>
          <Text className="font-bold text-xl text-foreground">Profile Setup</Text>
          <Text className="text-xs text-muted-foreground">
            {remaining} of {requiredSteps.length} required steps remaining
          </Text>
        </View>
        <View className="w-12 h-12 items-center justify-center">
          <Svg width={48} height={48} viewBox="0 0 36 36" style={{transform: [{rotate: '-90deg'}]}}>
            <Circle cx={18} cy={18} r={16} fill="none" stroke={colors.border} strokeWidth={3} />
            <Circle
              cx={18}
              cy={18}
              r={16}
              fill="none"
              stroke={colors.primary}
              strokeWidth={3}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </Svg>
          <Text className="absolute text-xs font-bold text-foreground">{progress}%</Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-4" contentContainerClassName="pb-28 gap-3">
        {/* Required section */}
        <Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-2 mt-2 mb-1">
          Required
        </Text>
        {requiredSteps.map((step, i) => (
          <StepCard key={i} step={step} onPress={() => step.screen && navigation.navigate(step.screen)} />
        ))}

        {/* Optional section */}
        <Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-2 mt-6 mb-1">
          Optional
        </Text>
        {optionalSteps.map((step, i) => (
          <StepCard key={i} step={step} onPress={() => {}} />
        ))}
      </ScrollView>

      {/* Bottom CTA */}
      <View className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <Button disabled={!allRequiredDone}>
          Complete Setup
        </Button>
        <Text className="text-[10px] text-center text-muted-foreground mt-2">
          Complete required steps to access dashboard
        </Text>
      </View>
    </SafeAreaView>
  );
}

function StepCard({step, onPress}: {step: StepItem; onPress: () => void}) {
  const borderColor =
    step.status === 'completed'
      ? 'border-l-green-500'
      : step.status === 'pending'
        ? 'border-l-primary'
        : '';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`bg-card border border-border rounded-xl p-4 flex-row items-center justify-between ${
        step.status !== 'not_started' ? `border-l-4 ${borderColor}` : ''
      } ${step.status === 'completed' ? 'opacity-70' : ''}`}>
      <View className="flex-row items-center gap-3">
        <View
          className={`w-8 h-8 rounded-full items-center justify-center ${
            step.status === 'completed'
              ? 'bg-success/10'
              : step.status === 'pending'
                ? 'bg-primary/10'
                : 'bg-muted'
          }`}>
          {step.icon}
        </View>
        <View>
          <Text className="font-bold text-sm text-foreground">{step.title}</Text>
          <Text className="text-[10px] text-muted-foreground">
            {step.status === 'completed'
              ? 'Completed'
              : step.status === 'pending'
                ? 'Pending action'
                : 'Not started'}
          </Text>
        </View>
      </View>
      {step.status === 'completed' ? (
        <TouchableOpacity>
          <Text className="text-xs text-muted-foreground">Edit</Text>
        </TouchableOpacity>
      ) : step.status === 'pending' ? (
        <View className="bg-primary rounded-lg px-4 py-1.5">
          <Text className="text-xs font-bold text-white">Start</Text>
        </View>
      ) : (
        <View className="bg-background border border-border rounded-lg px-4 py-1.5">
          <Text className="text-xs font-bold text-foreground">Add</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
