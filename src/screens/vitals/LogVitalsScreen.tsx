import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import {
  Heart,
  HeartPulse,
  Thermometer,
  Droplets,
  Wind,
  Activity,
  Scale,
  Footprints,
  Moon,
  Flame,
  Brain,
  Percent,
  GlassWater,
  Zap,
  Check,
  StickyNote,
} from 'lucide-react-native';

import {useVitalsStore} from '../../store/vitals';
import {Header, Input, Button} from '../../components/ui';
import {colors} from '../../theme/colors';
import {VITAL_TYPES} from '../../utils/constants';
import type {VitalTypeConfig} from '../../types/vital.types';
import type {HomeStackParamList} from '../../navigation/stacks/HomeStack';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Heart, HeartPulse, Thermometer, Droplets, Wind, Activity,
  Scale, Footprints, Moon, Flame, Brain, Percent, GlassWater, Zap,
};

export default function LogVitalsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<HomeStackParamList, 'LogVitals'>>();
  const focusedVitalType = route.params?.vitalType;
  const {logVital, isLoading} = useVitalsStore();

  // Form state: keyed by vital type key
  const [values, setValues] = useState<Record<string, string>>({});
  // Blood pressure needs systolic and diastolic
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const updateValue = (key: string, val: string) => {
    setValues(prev => ({...prev, [key]: val}));
  };

  const handleSave = async () => {
    // Build a single payload object: { blood_pressure: {value, unit}, pulse_rate: {value, unit}, ... }
    const payload: Record<string, {value: string; unit: string}> = {};
    let count = 0;

    for (const config of VITAL_TYPES) {
      if (config.key === 'blood_pressure') {
        if (bpSystolic && bpDiastolic) {
          payload.blood_pressure = {
            value: `${bpSystolic}/${bpDiastolic}`,
            unit: config.unit,
          };
          count++;
        }
      } else {
        const val = values[config.key];
        if (val && val.trim()) {
          payload[config.key] = {
            value: val.trim(),
            unit: config.unit,
          };
          count++;
        }
      }
    }

    if (count === 0) {
      Alert.alert('No Data', 'Please enter at least one vital reading before saving.');
      return;
    }

    setSaving(true);
    try {
      await logVital(payload);
      Alert.alert(
        'Vitals Logged',
        `Successfully recorded ${count} vital${count > 1 ? 's' : ''}.`,
        [{text: 'OK', onPress: () => navigation.goBack()}],
      );
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.response?.data?.message || err?.message || 'Failed to save vitals. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  // If navigated from VitalDetail, only show that vital's input
  const displayedVitals = focusedVitalType
    ? VITAL_TYPES.filter(v => v.key === focusedVitalType)
    : VITAL_TYPES;

  const filledCount = Object.values(values).filter(v => v?.trim()).length +
    (bpSystolic && bpDiastolic ? 1 : 0);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header
        title={focusedVitalType && displayedVitals[0] ? `Log ${displayedVitals[0].name}` : 'Log Vitals'}
        onBack={() => navigation.goBack()}
        rightAction={
          saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <TouchableOpacity
              onPress={handleSave}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Check size={24} color={colors.primary} />
            </TouchableOpacity>
          )
        }
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pt-4 pb-32"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Instruction */}
          <View className="bg-card border border-border rounded-2xl p-4 mb-6">
            <Text className="text-sm text-foreground font-medium">
              {focusedVitalType ? `Enter your ${displayedVitals[0]?.name || 'vital'} reading` : 'Enter your current readings'}
            </Text>
            {!focusedVitalType && (
              <Text className="text-xs text-muted-foreground mt-1">
                Only fill in the vitals you want to log. Empty fields will be skipped.
              </Text>
            )}
          </View>

          {/* Vital Input Groups */}
          {displayedVitals.map(config => {
            const IconComponent = ICON_MAP[config.icon] || Activity;

            if (config.key === 'blood_pressure') {
              return (
                <View key={config.key} className="mb-4">
                  <View className="flex-row items-center gap-2 mb-2 ml-1">
                    <IconComponent size={16} color={config.color} />
                    <Text className="text-xs font-bold text-foreground/70 uppercase tracking-wider">
                      {config.name}
                    </Text>
                    <Text className="text-[10px] text-muted-foreground">({config.unit})</Text>
                  </View>
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Input
                        placeholder="Systolic"
                        value={bpSystolic}
                        onChangeText={setBpSystolic}
                        keyboardType="numeric"
                        returnKeyType="next"
                      />
                    </View>
                    <View className="items-center justify-center">
                      <Text className="text-lg text-muted-foreground font-bold">/</Text>
                    </View>
                    <View className="flex-1">
                      <Input
                        placeholder="Diastolic"
                        value={bpDiastolic}
                        onChangeText={setBpDiastolic}
                        keyboardType="numeric"
                        returnKeyType="done"
                      />
                    </View>
                  </View>
                </View>
              );
            }

            return (
              <View key={config.key} className="mb-4">
                <Input
                  label={config.name}
                  placeholder={`Enter ${config.name.toLowerCase()}`}
                  value={values[config.key] || ''}
                  onChangeText={val => updateValue(config.key, val)}
                  keyboardType="numeric"
                  returnKeyType="done"
                  icon={<IconComponent size={18} color={config.color} />}
                  rightIcon={
                    <Text className="text-xs text-muted-foreground">{config.unit}</Text>
                  }
                />
              </View>
            );
          })}

          {/* Notes */}
          <View className="mb-6">
            <Input
              label="Notes (Optional)"
              placeholder="Any additional notes..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              icon={<StickyNote size={18} color={colors.mutedForeground} />}
              className="h-24 items-start pt-3"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Save Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-background border-t border-border px-5 pt-3 pb-8">
        <Button
          variant="primary"
          onPress={handleSave}
          loading={saving}
          disabled={filledCount === 0}>
          {`Save ${filledCount > 0 ? `(${filledCount} vital${filledCount > 1 ? 's' : ''})` : 'Vitals'}`}
        </Button>
      </View>
    </SafeAreaView>
  );
}
