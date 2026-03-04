import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity, ActivityIndicator} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {Brain, Check, HelpCircle} from 'lucide-react-native';
import {Header, Button} from '../../components/ui';
import {useHealthCheckupStore} from '../../store/healthCheckup';
import {colors} from '../../theme/colors';

type ChoiceId = 'present' | 'absent' | 'unknown';

const SINGLE_OPTIONS: {label: string; value: ChoiceId; color: string}[] = [
  {label: 'Yes', value: 'present', color: colors.success},
  {label: 'No', value: 'absent', color: colors.destructive},
  {label: "Don't know", value: 'unknown', color: colors.mutedForeground},
];

export default function InterviewScreen() {
  const navigation = useNavigation<any>();
  const {
    currentQuestion,
    shouldStop,
    conditions,
    isLoading,
    evidence,
    addEvidence,
    submitDiagnosis,
  } = useHealthCheckupStore();

  const [selectedSingle, setSelectedSingle] = useState<string | null>(null);
  const [selectedMultiple, setSelectedMultiple] = useState<Set<string>>(new Set());
  const [questionCount, setQuestionCount] = useState(1);

  // Navigate to results when interview is done
  useEffect(() => {
    if (shouldStop && conditions.length > 0) {
      navigation.replace('HealthCheckupResults');
    }
  }, [shouldStop, conditions, navigation]);

  const handleSingleAnswer = useCallback(
    async (choiceId: ChoiceId) => {
      if (!currentQuestion) return;

      const item = currentQuestion.items?.[0];
      if (!item) return;

      addEvidence([{id: item.id, choice_id: choiceId, source: 'interview'}]);
      setSelectedSingle(null);
      setQuestionCount(prev => prev + 1);

      try {
        await submitDiagnosis(false);
      } catch {
        // Error in store
      }
    },
    [currentQuestion, addEvidence, submitDiagnosis],
  );

  const handleGroupSingleAnswer = useCallback(
    async (itemId: string) => {
      if (!currentQuestion) return;

      // Mark selected as present, others as absent
      const newEvidence = currentQuestion.items.map((item: any) => ({
        id: item.id,
        choice_id: item.id === itemId ? 'present' : 'absent',
        source: 'interview' as const,
      }));

      addEvidence(newEvidence);
      setSelectedSingle(null);
      setQuestionCount(prev => prev + 1);

      try {
        await submitDiagnosis(false);
      } catch {
        // Error in store
      }
    },
    [currentQuestion, addEvidence, submitDiagnosis],
  );

  const handleGroupMultipleSubmit = useCallback(async () => {
    if (!currentQuestion) return;

    const newEvidence = currentQuestion.items.map((item: any) => ({
      id: item.id,
      choice_id: selectedMultiple.has(item.id) ? 'present' : 'absent',
      source: 'interview' as const,
    }));

    addEvidence(newEvidence);
    setSelectedMultiple(new Set());
    setQuestionCount(prev => prev + 1);

    try {
      await submitDiagnosis(false);
    } catch {
      // Error in store
    }
  }, [currentQuestion, selectedMultiple, addEvidence, submitDiagnosis]);

  const handleStopEarly = useCallback(async () => {
    try {
      await submitDiagnosis(true);
    } catch {
      // Error in store
    }
  }, [submitDiagnosis]);

  if (isLoading && !currentQuestion) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header title="Health Interview" onBack={() => navigation.goBack()} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-sm text-muted-foreground mt-3">Analyzing your symptoms...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentQuestion) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header title="Health Interview" onBack={() => navigation.goBack()} />
        <View className="flex-1 items-center justify-center px-8">
          <HelpCircle size={40} color={colors.mutedForeground} />
          <Text className="text-base font-medium text-foreground mt-3 text-center">
            No more questions
          </Text>
          <Button variant="primary" onPress={handleStopEarly} className="mt-4">
            View Results
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const questionType = currentQuestion.type; // 'single', 'group_single', 'group_multiple'
  const questionText = currentQuestion.text;
  const items = currentQuestion.items || [];

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
      <Header title="Health Interview" onBack={() => navigation.goBack()} />

      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24}}
        showsVerticalScrollIndicator={false}>
        {/* Step indicator */}
        <View className="flex-row items-center gap-2 mb-6">
          <View className="h-1.5 flex-1 bg-primary rounded-full" />
          <View className="h-1.5 flex-1 bg-primary rounded-full" />
          <View className="h-1.5 flex-1 bg-primary rounded-full" />
          <View className="h-1.5 flex-1 bg-primary rounded-full" />
          <View className="h-1.5 flex-1 bg-border rounded-full" />
        </View>

        {/* Question counter */}
        <View className="flex-row items-center gap-2 mb-4">
          <Brain size={18} color={colors.primary} />
          <Text className="text-xs text-muted-foreground font-medium">
            Question {questionCount}
          </Text>
        </View>

        {/* Question text */}
        <Text className="text-lg font-bold text-foreground mb-6 leading-relaxed">
          {questionText}
        </Text>

        {/* Answer options based on question type */}
        {questionType === 'single' && (
          <View className="gap-3">
            {SINGLE_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                activeOpacity={0.7}
                disabled={isLoading}
                onPress={() => handleSingleAnswer(opt.value)}
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1.5,
                  borderColor: colors.mutedForeground,
                  borderRadius: 16,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}>
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{backgroundColor: `${opt.color}20`} as any}>
                  <Text style={{color: opt.color, fontWeight: 'bold', fontSize: 13}}>
                    {opt.label}
                  </Text>
                </View>
                <Text className="text-sm font-medium text-foreground">{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {questionType === 'group_single' && (
          <View className="gap-2">
            {items.map((item: any) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                disabled={isLoading}
                onPress={() => handleGroupSingleAnswer(item.id)}
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1.5,
                  borderColor: colors.mutedForeground,
                  borderRadius: 16,
                  padding: 16,
                }}>
                <Text style={{fontSize: 14, fontWeight: '500', color: colors.foreground}}>
                  {item.name || item.common_name}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              activeOpacity={0.7}
              disabled={isLoading}
              onPress={() => {
                // Mark all as absent (none apply)
                const newEvidence = items.map((item: any) => ({
                  id: item.id,
                  choice_id: 'absent' as const,
                  source: 'interview' as const,
                }));
                addEvidence(newEvidence);
                setQuestionCount(prev => prev + 1);
                submitDiagnosis(false);
              }}
              style={{
                backgroundColor: colors.muted,
                borderWidth: 1.5,
                borderColor: colors.mutedForeground,
                borderRadius: 16,
                padding: 16,
              }}>
              <Text style={{fontSize: 14, fontWeight: '500', color: colors.mutedForeground}}>None of the above</Text>
            </TouchableOpacity>
          </View>
        )}

        {questionType === 'group_multiple' && (
          <View className="gap-2">
            {items.map((item: any) => {
              const isSelected = selectedMultiple.has(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedMultiple(prev => {
                      const next = new Set(prev);
                      if (next.has(item.id)) next.delete(item.id);
                      else next.add(item.id);
                      return next;
                    });
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    padding: 16,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    backgroundColor: isSelected ? `${colors.primary}15` : colors.card,
                    borderColor: isSelected ? colors.primary : colors.mutedForeground,
                  }}>
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 8,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 2,
                      backgroundColor: isSelected ? colors.primary : 'transparent',
                      borderColor: isSelected ? colors.primary : colors.mutedForeground,
                    }}>
                    {isSelected && <Check size={14} color={colors.white} />}
                  </View>
                  <Text className="text-sm font-medium text-foreground flex-1">
                    {item.name || item.common_name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Submit button for group_multiple */}
        {questionType === 'group_multiple' && (
          <View style={{marginTop: 24}}>
            <Button variant="primary" onPress={handleGroupMultipleSubmit} loading={isLoading}>
              Continue
            </Button>
          </View>
        )}

        {/* Stop early option */}
        {questionCount > 3 && (
          <TouchableOpacity
            onPress={handleStopEarly}
            activeOpacity={0.7}
            disabled={isLoading}
            style={{marginTop: 24, alignItems: 'center'}}>
            <Text className="text-xs text-muted-foreground">
              Answered enough?{' '}
              <Text className="text-primary font-semibold">Get results now</Text>
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Loading overlay */}
      {isLoading && currentQuestion && (
        <View className="absolute inset-0 bg-background/80 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-sm text-muted-foreground mt-3">Processing...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
