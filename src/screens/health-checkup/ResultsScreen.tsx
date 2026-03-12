import { useNavigation } from '@react-navigation/native';
import { AlertTriangle, Calendar, Check, Download, Stethoscope } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AISummaryCard from '../../components/health-checkup/AISummaryCard';
import { Button, Header } from '../../components/ui';
import { Text } from '../../components/ui/Text';
import { useAuthStore } from '../../store/auth';
import { useHealthCheckupStore } from '../../store/healthCheckup';
import { colors } from '../../theme/colors';
import { generateHealthCheckupPDF } from '../../utils/healthCheckupPdf';

// Maps Infermedica triage_level values to display config
const TRIAGE_CONFIG: Record<
  string,
  { label: string; color: string; icon: any; description: string }
> = {
  emergency_ambulance: {
    label: 'Emergency',
    color: colors.destructive,
    icon: AlertTriangle,
    description:
      'Your symptoms indicate a medical emergency. Please call emergency services immediately.',
  },
  emergency: {
    label: 'Emergency',
    color: colors.destructive,
    icon: AlertTriangle,
    description:
      'Your symptoms suggest a potentially serious condition that requires immediate medical attention.',
  },
  consultation_24: {
    label: 'Urgent',
    color: colors.secondary,
    icon: AlertTriangle,
    description: 'Your symptoms require prompt medical attention. See a doctor within 24 hours.',
  },
  consultation: {
    label: 'See a Doctor',
    color: colors.primary,
    icon: Stethoscope,
    description:
      'Your symptoms suggest you should schedule a doctor visit within the next few days.',
  },
  self_care: {
    label: 'Self-Care',
    color: colors.success,
    icon: Check,
    description:
      'Your symptoms appear manageable with self-care. Monitor and consult a doctor if they worsen.',
  },
};

function ProbabilityBar({ probability }: { probability: number }) {
  const pct = Math.round(probability * 100);
  const barColor = pct >= 70 ? colors.destructive : pct >= 40 ? colors.secondary : colors.primary;
  return (
    <View className="flex-row items-center gap-2 mt-1">
      <View className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <View
          style={{
            width: `${pct}%`,
            height: '100%',
            backgroundColor: barColor,
            borderRadius: 9999,
          }}
        />
      </View>
      <Text
        style={{ color: barColor, fontSize: 12, fontWeight: 'bold', width: 36, textAlign: 'right' }}
      >
        {pct}%
      </Text>
    </View>
  );
}

export default function ResultsScreen() {
  const navigation = useNavigation<any>();
  const {
    checkupId,
    conditions,
    triageLevel,
    hasEmergency,
    claudeSummary,
    summaryLoading,
    summaryCredits,
    fetchClaudeSummary,
    generateClaudeSummary,
    fetchSummaryStatus,
    sex,
    age,
    reset,
  } = useHealthCheckupStore();
  const user = useAuthStore((s) => s.user);

  const [summaryExpanded, setSummaryExpanded] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Auto-fetch summary if checkup has one, and check credits
  useEffect(() => {
    if (checkupId) {
      fetchClaudeSummary(checkupId);
      fetchSummaryStatus();
    }
  }, [checkupId, fetchClaudeSummary, fetchSummaryStatus]);

  const handleGenerateSummary = async () => {
    if (!checkupId) return;
    try {
      await generateClaudeSummary(checkupId);
    } catch {
      Alert.alert('Unable to Generate', 'Could not generate AI summary. Please try again later.');
    }
  };

  // If emergency evidence is detected, always show Emergency regardless of triage_level
  const effectiveTriageLevel = hasEmergency ? 'emergency' : triageLevel || 'self_care';
  const triage = TRIAGE_CONFIG[effectiveTriageLevel] || TRIAGE_CONFIG.self_care;
  const TriageIcon = triage.icon;

  const handleDownloadReport = async () => {
    setPdfLoading(true);
    try {
      const patientName =
        `${user?.profile?.first_name || ''} ${user?.profile?.last_name || ''}`.trim() || 'Patient';
      // Fallback to user profile if store values are empty
      const reportAge =
        age ||
        (user?.profile?.date_of_birth
          ? Math.floor((Date.now() - new Date(user.profile.date_of_birth).getTime()) / 31557600000)
          : 0);
      const reportSex = sex || user?.profile?.gender || '';
      await generateHealthCheckupPDF({
        patientName,
        age: reportAge,
        sex: reportSex,
        date: new Date().toISOString(),
        triageLevel: triageLevel || 'self_care',
        hasEmergency,
        conditions,
        claudeSummary: claudeSummary?.content || null,
      });
    } finally {
      setPdfLoading(false);
    }
  };

  const handleBookAppointment = () => {
    const topCondition = conditions?.[0]?.common_name || conditions?.[0]?.name;
    const summary = topCondition
      ? `Health checkup indicated: ${topCondition}`
      : 'Health checkup completed';
    const savedCheckupId = checkupId;
    reset();
    navigation.navigate('Main', {
      screen: 'Bookings',
      params: {
        screen: 'SelectSpecialty',
        params: {
          healthCheckupId: savedCheckupId,
          healthCheckupSummary: summary,
        },
      },
    });
  };

  const handleGoHome = () => {
    reset();
    navigation.navigate('HomeScreen');
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Results" />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-4 pb-32"
        showsVerticalScrollIndicator={false}
      >
        {/* Step indicator */}
        <View className="flex-row items-center gap-2 mb-6">
          <View className="h-1.5 flex-1 bg-primary rounded-full" />
          <View className="h-1.5 flex-1 bg-primary rounded-full" />
          <View className="h-1.5 flex-1 bg-primary rounded-full" />
          <View className="h-1.5 flex-1 bg-primary rounded-full" />
          <View className="h-1.5 flex-1 bg-primary rounded-full" />
        </View>

        {/* Triage Card */}
        <View
          style={{
            backgroundColor: `${triage.color}15`,
            borderWidth: 1,
            borderColor: `${triage.color}40`,
            borderRadius: 20,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <View className="flex-row items-center gap-3 mb-3">
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: `${triage.color}25`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TriageIcon size={24} color={triage.color} />
            </View>
            <View className="flex-1">
              <Text style={{ color: triage.color, fontWeight: 'bold', fontSize: 18 }}>
                {triage.label}
              </Text>
              {hasEmergency && effectiveTriageLevel === 'emergency' && (
                <Text
                  style={{
                    color: colors.destructive,
                    fontSize: 12,
                    fontWeight: '600',
                    marginTop: 2,
                  }}
                >
                  Immediate attention recommended
                </Text>
              )}
            </View>
          </View>
          <Text className="text-sm text-foreground leading-relaxed">{triage.description}</Text>
        </View>

        {/* Conditions */}
        <Text className="text-sm font-bold text-foreground mb-3 px-1">
          Possible Conditions ({conditions.length})
        </Text>

        {conditions.map((condition: any, index: number) => (
          <View
            key={condition.id || index}
            className="bg-card border border-border rounded-2xl p-4 mb-2"
          >
            <View className="flex-row items-start gap-3">
              <View className="w-8 h-8 rounded-full bg-muted items-center justify-center mt-0.5">
                <Text className="text-xs font-bold text-muted-foreground">{index + 1}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-foreground">
                  {condition.common_name || condition.name}
                </Text>
                {condition.category && (
                  <Text className="text-xs text-muted-foreground mt-0.5">{condition.category}</Text>
                )}
                <ProbabilityBar probability={condition.probability || 0} />
              </View>
            </View>
          </View>
        ))}

        {conditions.length === 0 && (
          <View className="bg-card border border-border rounded-2xl p-6 items-center">
            <Stethoscope size={32} color={colors.mutedForeground} />
            <Text className="text-sm text-muted-foreground text-center mt-2">
              No specific conditions identified. If symptoms persist, please consult a doctor.
            </Text>
          </View>
        )}

        {/* AI Summary */}
        <View className="mt-4">
          <AISummaryCard
            summary={claudeSummary}
            loading={summaryLoading}
            onGenerate={handleGenerateSummary}
            credits={summaryCredits}
            expanded={summaryExpanded}
            onToggleExpand={() => setSummaryExpanded((v) => !v)}
          />
        </View>

        {/* Actions */}
        <View className="mt-6 gap-3">
          <Button
            variant="outline"
            onPress={handleDownloadReport}
            loading={pdfLoading}
            icon={<Download size={18} color={colors.foreground} />}
          >
            Download Report
          </Button>

          <Button
            variant="primary"
            onPress={handleBookAppointment}
            icon={<Calendar size={18} color={colors.white} />}
          >
            Book Appointment with Specialist
          </Button>

          <Button variant="secondary" onPress={handleGoHome}>
            Back to Home
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
