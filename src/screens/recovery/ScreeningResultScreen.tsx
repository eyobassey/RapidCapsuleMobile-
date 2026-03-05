import React, {useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity, ActivityIndicator} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Sparkles, ChevronRight} from 'lucide-react-native';
import {Header, Button} from '../../components/ui';
import RiskBadge from '../../components/recovery/RiskBadge';
import {colors} from '../../theme/colors';
import {recoveryService} from '../../services/recovery.service';
import type {ScreeningResult} from '../../types/recovery.types';

export default function ScreeningResultScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {screeningId, result: initialResult} = route.params as {
    screeningId: string;
    result: ScreeningResult;
  };

  const [result, setResult] = useState<ScreeningResult>(initialResult);
  const [generating, setGenerating] = useState(false);

  const handleGenerateAI = async () => {
    setGenerating(true);
    try {
      const updated = await recoveryService.getAIInterpretation(screeningId);
      setResult(updated);
    } catch {
      // ignore
    } finally {
      setGenerating(false);
    }
  };

  const ai = result.ai_interpretation?.content;

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
      <Header title="Screening Results" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={{padding: 16, paddingBottom: 40, gap: 16}}
        showsVerticalScrollIndicator={false}>
        {/* Score card */}
        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 24,
            padding: 24,
            alignItems: 'center',
          }}>
          <Text style={{fontSize: 12, fontWeight: '600', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1}}>
            {result.instrument?.toUpperCase()} Score
          </Text>
          <Text style={{fontSize: 52, fontWeight: '800', color: colors.foreground, marginTop: 4}}>
            {result.total_score}
          </Text>
          <RiskBadge level={result.risk_level} size="md" />
          {result.risk_zone_label && (
            <Text style={{fontSize: 12, color: colors.mutedForeground, marginTop: 6}}>
              {result.risk_zone_label}
            </Text>
          )}
        </View>

        {/* AI Interpretation */}
        {ai ? (
          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: `${colors.accent}30`,
              borderRadius: 16,
              padding: 16,
              gap: 12,
            }}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <Sparkles size={16} color={colors.accent} />
              <Text style={{fontSize: 14, fontWeight: '700', color: colors.foreground}}>
                AI Interpretation
              </Text>
            </View>

            <Text style={{fontSize: 13, color: colors.foreground, lineHeight: 20}}>
              {ai.summary}
            </Text>

            {ai.risk_assessment && (
              <View style={{gap: 4}}>
                <Text style={{fontSize: 12, fontWeight: '700', color: colors.foreground}}>
                  Risk Assessment
                </Text>
                <Text style={{fontSize: 12, color: colors.mutedForeground, lineHeight: 18}}>
                  {ai.risk_assessment}
                </Text>
              </View>
            )}

            {ai.recommended_interventions?.length > 0 && (
              <View style={{gap: 4}}>
                <Text style={{fontSize: 12, fontWeight: '700', color: colors.foreground}}>
                  Recommended Interventions
                </Text>
                {ai.recommended_interventions.map((item: string, i: number) => (
                  <Text key={i} style={{fontSize: 12, color: colors.mutedForeground, lineHeight: 18}}>
                    {'\u2022'} {item}
                  </Text>
                ))}
              </View>
            )}

            {ai.motivational_message && (
              <View
                style={{
                  backgroundColor: `${colors.success}10`,
                  borderRadius: 10,
                  padding: 12,
                }}>
                <Text style={{fontSize: 12, color: colors.success, lineHeight: 18, fontWeight: '500'}}>
                  {ai.motivational_message}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleGenerateAI}
            disabled={generating}
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: `${colors.accent}30`,
              borderRadius: 16,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: `${colors.accent}15`,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {generating ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Sparkles size={18} color={colors.accent} />
              )}
            </View>
            <View style={{flex: 1}}>
              <Text style={{fontSize: 14, fontWeight: '600', color: colors.foreground}}>
                Generate AI Interpretation
              </Text>
              <Text style={{fontSize: 11, color: colors.mutedForeground}}>
                Get personalized insights from AI (uses 1 credit)
              </Text>
            </View>
            <ChevronRight size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}

        {/* Actions */}
        <View style={{gap: 10}}>
          <Button
            variant="primary"
            onPress={() => navigation.navigate('RecoveryDashboard')}>
            Back to Dashboard
          </Button>
          <Button
            variant="outline"
            onPress={() => navigation.navigate('ScreeningHistory')}>
            View History
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
