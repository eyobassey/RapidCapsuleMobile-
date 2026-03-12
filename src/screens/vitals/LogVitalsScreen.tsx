import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import {
  Activity,
  Brain,
  Droplets,
  Flame,
  Footprints,
  GlassWater,
  Heart,
  HeartPulse,
  Moon,
  Percent,
  Scale,
  StickyNote,
  Thermometer,
  Wind,
  Zap,
} from 'lucide-react-native';
import React, { useCallback, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';

import { Button, Header, Input } from '../../components/ui';
import type { HomeStackParamList } from '../../navigation/stacks/HomeStack';
import { useVitalsStore } from '../../store/vitals';
import { colors } from '../../theme/colors';
import { VITAL_TYPES } from '../../utils/constants';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
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
};

// Form values: keyed by vital type key, plus bp_systolic, bp_diastolic, notes
type VitalsFormValues = Record<string, string>;

/** Returns an error message if the value is not a valid positive number, or undefined if valid/empty */
function validateNumericField(value: string | undefined): string | undefined {
  if (!value || !value.trim()) return undefined; // empty is OK — optional
  const num = Number(value.trim());
  if (isNaN(num) || num <= 0) return 'Must be a positive number';
  return undefined;
}

export default function LogVitalsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<HomeStackParamList, 'LogVitals'>>();
  const focusedVitalType = route.params?.vitalType;
  const { logVital } = useVitalsStore();
  const bpDiastolicRef = useRef<RNTextInput>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    watch,
  } = useForm<VitalsFormValues>({
    defaultValues: {},
  });

  // If navigated from VitalDetail, only show that vital's input
  const displayedVitals = focusedVitalType
    ? VITAL_TYPES.filter((v) => v.key === focusedVitalType)
    : VITAL_TYPES;

  const watchedValues = watch();

  // Count filled vitals
  const filledCount = (() => {
    let count = 0;
    for (const config of displayedVitals) {
      if (config.key === 'blood_pressure') {
        if (watchedValues.bp_systolic?.trim() && watchedValues.bp_diastolic?.trim()) {
          count++;
        }
      } else if (watchedValues[config.key]?.trim()) {
        count++;
      }
    }
    return count;
  })();

  const [saving, setSaving] = React.useState(false);

  const onSubmit = useCallback(
    async (data: VitalsFormValues) => {
      // Validate all filled fields are positive numbers
      let hasError = false;

      for (const config of displayedVitals) {
        if (config.key === 'blood_pressure') {
          const sysErr = validateNumericField(data.bp_systolic);
          const diaErr = validateNumericField(data.bp_diastolic);
          if (sysErr) {
            setError('bp_systolic', { message: sysErr });
            hasError = true;
          }
          if (diaErr) {
            setError('bp_diastolic', { message: diaErr });
            hasError = true;
          }
          // If only one BP field is filled
          const hasSys = !!data.bp_systolic?.trim();
          const hasDia = !!data.bp_diastolic?.trim();
          if (hasSys !== hasDia) {
            if (!hasSys) setError('bp_systolic', { message: 'Required with diastolic' });
            if (!hasDia) setError('bp_diastolic', { message: 'Required with systolic' });
            hasError = true;
          }
        } else {
          const err = validateNumericField(data[config.key]);
          if (err) {
            setError(config.key, { message: err });
            hasError = true;
          }
        }
      }

      if (hasError) return;

      // Build payload
      const payload: Record<string, { value: string; unit: string }> = {};
      let count = 0;

      for (const config of VITAL_TYPES) {
        if (config.key === 'blood_pressure') {
          if (data.bp_systolic?.trim() && data.bp_diastolic?.trim()) {
            payload.blood_pressure = {
              value: `${data.bp_systolic.trim()}/${data.bp_diastolic.trim()}`,
              unit: config.unit,
            };
            count++;
          }
        } else {
          const val = data[config.key];
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
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } catch (err: any) {
        Alert.alert(
          'Error',
          err?.response?.data?.message || err?.message || 'Failed to save vitals. Please try again.'
        );
      } finally {
        setSaving(false);
      }
    },
    [displayedVitals, logVital, navigation, setError]
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header
        title={
          focusedVitalType && displayedVitals[0] ? `Log ${displayedVitals[0].name}` : 'Log Vitals'
        }
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pt-4 pb-32"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Instruction */}
          <View className="bg-card border border-border rounded-2xl p-4 mb-6">
            <Text className="text-sm text-foreground font-medium">
              {focusedVitalType
                ? `Enter your ${displayedVitals[0]?.name || 'vital'} reading`
                : 'Enter your current readings'}
            </Text>
            {!focusedVitalType && (
              <Text className="text-xs text-muted-foreground mt-1">
                Only fill in the vitals you want to log. Empty fields will be skipped.
              </Text>
            )}
          </View>

          {/* Vital Input Groups */}
          {displayedVitals.map((config) => {
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
                      <Controller
                        control={control}
                        name="bp_systolic"
                        render={({ field: { onChange, onBlur, value } }) => (
                          <Input
                            placeholder="Systolic"
                            value={value || ''}
                            onChangeText={(v) => {
                              clearErrors('bp_systolic');
                              onChange(v);
                            }}
                            onBlur={onBlur}
                            keyboardType="numeric"
                            returnKeyType="next"
                            autoFocus={!!focusedVitalType}
                            onSubmitEditing={() => bpDiastolicRef.current?.focus()}
                            error={errors.bp_systolic?.message as string}
                          />
                        )}
                      />
                    </View>
                    <View className="items-center justify-center">
                      <Text className="text-lg text-muted-foreground font-bold">/</Text>
                    </View>
                    <View className="flex-1">
                      <Controller
                        control={control}
                        name="bp_diastolic"
                        render={({ field: { onChange, onBlur, value } }) => (
                          <Input
                            ref={bpDiastolicRef}
                            placeholder="Diastolic"
                            value={value || ''}
                            onChangeText={(v) => {
                              clearErrors('bp_diastolic');
                              onChange(v);
                            }}
                            onBlur={onBlur}
                            keyboardType="numeric"
                            returnKeyType="done"
                            onSubmitEditing={focusedVitalType ? handleSubmit(onSubmit) : undefined}
                            error={errors.bp_diastolic?.message as string}
                          />
                        )}
                      />
                    </View>
                  </View>
                </View>
              );
            }

            return (
              <View key={config.key} className="mb-4">
                <Controller
                  control={control}
                  name={config.key}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label={config.name}
                      placeholder={`Enter ${config.name.toLowerCase()}`}
                      value={value || ''}
                      onChangeText={(v) => {
                        clearErrors(config.key);
                        onChange(v);
                      }}
                      onBlur={onBlur}
                      keyboardType="numeric"
                      returnKeyType="done"
                      autoFocus={!!focusedVitalType}
                      onSubmitEditing={focusedVitalType ? handleSubmit(onSubmit) : undefined}
                      icon={<IconComponent size={18} color={config.color} />}
                      rightIcon={
                        <Text className="text-xs text-muted-foreground">{config.unit}</Text>
                      }
                      error={errors[config.key]?.message as string}
                    />
                  )}
                />
              </View>
            );
          })}

          {/* Notes — hidden in single-vital mode for quick logging */}
          {!focusedVitalType && (
            <View className="mb-6">
              <Controller
                control={control}
                name="notes"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Notes (Optional)"
                    placeholder="Any additional notes..."
                    value={value || ''}
                    onChangeText={onChange}
                    multiline
                    numberOfLines={3}
                    icon={<StickyNote size={18} color={colors.mutedForeground} />}
                    className="h-24 items-start pt-3"
                  />
                )}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Save Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-background border-t border-border px-5 pt-3 pb-8">
        <Button
          variant="primary"
          onPress={handleSubmit(onSubmit)}
          loading={saving}
          disabled={filledCount === 0}
        >
          {`Save ${
            filledCount > 0 ? `(${filledCount} vital${filledCount > 1 ? 's' : ''})` : 'Vitals'
          }`}
        </Button>
      </View>
    </SafeAreaView>
  );
}
