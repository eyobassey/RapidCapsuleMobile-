import React, {useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {Check, Shield} from 'lucide-react-native';
import {Header, Button} from '../../components/ui';
import {useHealthCheckupStore} from '../../store/healthCheckup';
import {colors} from '../../theme/colors';

export default function RiskFactorsScreen() {
  const navigation = useNavigation<any>();
  const {riskFactors, addEvidence} = useHealthCheckupStore();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleFactor = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleNext = () => {
    // Add selected risk factors as evidence
    const evidence = Array.from(selected).map(id => ({
      id,
      choice_id: 'present' as const,
      source: 'initial' as const,
    }));
    if (evidence.length > 0) {
      addEvidence(evidence);
    }
    navigation.navigate('HealthCheckupSymptomSearch');
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Risk Factors" onBack={() => navigation.goBack()} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-6 pb-6"
        showsVerticalScrollIndicator={false}>
        {/* Step indicator */}
        <View className="flex-row items-center gap-2 mb-6">
          <View className="h-1.5 flex-1 bg-primary rounded-full" />
          <View className="h-1.5 flex-1 bg-primary rounded-full" />
          <View className="h-1.5 flex-1 bg-border rounded-full" />
          <View className="h-1.5 flex-1 bg-border rounded-full" />
          <View className="h-1.5 flex-1 bg-border rounded-full" />
        </View>

        <View className="flex-row items-center gap-2 mb-1">
          <Shield size={20} color={colors.primary} />
          <Text className="text-lg font-bold text-foreground">Risk Factors</Text>
        </View>
        <Text className="text-sm text-muted-foreground mb-6">
          Select any risk factors that apply to you. These help us provide a more accurate assessment.
        </Text>

        {riskFactors.length === 0 ? (
          <View className="bg-card border border-border rounded-2xl p-6 items-center">
            <Text className="text-sm text-muted-foreground text-center">
              No risk factors to display for your age group.
            </Text>
          </View>
        ) : (
          <View className="gap-2">
            {riskFactors.map((factor: any) => {
              const isSelected = selected.has(factor.id);
              return (
                <TouchableOpacity
                  key={factor.id}
                  activeOpacity={0.7}
                  onPress={() => toggleFactor(factor.id)}
                  className={`flex-row items-center gap-3 p-4 rounded-2xl border ${
                    isSelected ? 'bg-primary/10 border-primary' : 'bg-card border-border'
                  }`}>
                  <View
                    className={`w-6 h-6 rounded-lg items-center justify-center border ${
                      isSelected ? 'bg-primary border-primary' : 'border-border'
                    }`}>
                    {isSelected && <Check size={14} color={colors.white} />}
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">
                      {factor.common_name || factor.name}
                    </Text>
                    {factor.question && (
                      <Text className="text-xs text-muted-foreground mt-0.5">
                        {factor.question}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View className="bg-background border-t border-border px-5 pt-3 pb-8">
        <Button variant="primary" onPress={handleNext}>
          {selected.size > 0
            ? `Continue with ${selected.size} factor${selected.size > 1 ? 's' : ''}`
            : 'Skip & Continue'}
        </Button>
      </View>
    </SafeAreaView>
  );
}
