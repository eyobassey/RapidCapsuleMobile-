import React, {useEffect, useState} from 'react';
import {View, Text, ScrollView, ActivityIndicator, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  AlertTriangle,
  Calendar,
  Check,
  Download,
  Shield,
  Stethoscope,
  User,
} from 'lucide-react-native';
import {Header, Button} from '../../components/ui';
import {useHealthCheckupStore} from '../../store/healthCheckup';
import {useAuthStore} from '../../store/auth';
import {colors} from '../../theme/colors';
import {formatDate} from '../../utils/formatters';
import AISummaryCard from '../../components/health-checkup/AISummaryCard';
import {generateHealthCheckupPDF} from '../../utils/healthCheckupPdf';

// Maps Infermedica triage_level values to display config
const TRIAGE_CONFIG: Record<string, {label: string; color: string; icon: any; description: string}> = {
  emergency_ambulance: {
    label: 'Emergency',
    color: colors.destructive,
    icon: AlertTriangle,
    description: 'A medical emergency was detected. Emergency services were recommended.',
  },
  emergency: {
    label: 'Emergency',
    color: colors.destructive,
    icon: AlertTriangle,
    description: 'A potentially serious condition was detected requiring immediate medical attention.',
  },
  consultation_24: {
    label: 'Urgent',
    color: colors.secondary,
    icon: AlertTriangle,
    description: 'Prompt medical attention was recommended within 24 hours.',
  },
  consultation: {
    label: 'See a Doctor',
    color: colors.primary,
    icon: Stethoscope,
    description: 'A doctor visit within the next few days was recommended.',
  },
  self_care: {
    label: 'Self-Care',
    color: colors.success,
    icon: Check,
    description: 'Symptoms appeared manageable with self-care at the time of assessment.',
  },
};

function ProbabilityBar({probability}: {probability: number}) {
  const pct = Math.round(probability * 100);
  const barColor = pct >= 70 ? colors.destructive : pct >= 40 ? colors.secondary : colors.primary;
  return (
    <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4}}>
      <View style={{flex: 1, height: 6, backgroundColor: colors.muted, borderRadius: 9999, overflow: 'hidden'}}>
        <View
          style={{
            width: `${pct}%`,
            height: '100%',
            backgroundColor: barColor,
            borderRadius: 9999,
          }}
        />
      </View>
      <Text style={{color: barColor, fontSize: 12, fontWeight: 'bold', width: 36, textAlign: 'right'}}>
        {pct}%
      </Text>
    </View>
  );
}

export default function HistoryDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {
    currentDetail,
    isLoading,
    fetchDetail,
    claudeSummary,
    summaryLoading,
    summaryCredits,
    fetchClaudeSummary,
    generateClaudeSummary,
    fetchSummaryStatus,
  } = useHealthCheckupStore();
  const authUser = useAuthStore(s => s.user);

  const [summaryExpanded, setSummaryExpanded] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const checkupId = route.params?.id;

  useEffect(() => {
    if (checkupId) {
      fetchDetail(checkupId);
      fetchClaudeSummary(checkupId);
      fetchSummaryStatus();
    }
  }, [checkupId, fetchDetail, fetchClaudeSummary, fetchSummaryStatus]);

  const handleGenerateSummary = async () => {
    if (!checkupId) return;
    try {
      await generateClaudeSummary(checkupId);
    } catch {
      Alert.alert('Unable to Generate', 'Could not generate AI summary. Please try again later.');
    }
  };

  const handleDownloadReport = async () => {
    if (!currentDetail) return;
    setPdfLoading(true);
    try {
      const responseData = currentDetail.response?.data;
      const patientName = `${authUser?.profile?.first_name || ''} ${authUser?.profile?.last_name || ''}`.trim() || 'Patient';
      // Age: try patient_info.age → request.age.value → derive from user DOB
      const detailAge =
        currentDetail.patient_info?.age ||
        currentDetail.request?.age?.value ||
        (authUser?.profile?.date_of_birth
          ? Math.floor((Date.now() - new Date(authUser.profile.date_of_birth).getTime()) / 31557600000)
          : 0);
      // Sex: try patient_info.gender → request.sex → user profile gender
      const detailSex =
        currentDetail.patient_info?.gender ||
        currentDetail.request?.sex ||
        authUser?.profile?.gender ||
        '';
      await generateHealthCheckupPDF({
        patientName,
        age: detailAge,
        sex: detailSex,
        date: currentDetail.created_at || currentDetail.createdAt || new Date().toISOString(),
        triageLevel: responseData?.triage_level || 'self_care',
        hasEmergency: responseData?.has_emergency_evidence || false,
        conditions: responseData?.conditions || [],
        claudeSummary: claudeSummary?.content || null,
      });
    } finally {
      setPdfLoading(false);
    }
  };

  if (isLoading || !currentDetail) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header title="Checkup Detail" onBack={() => navigation.goBack()} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-sm text-muted-foreground mt-3">Loading checkup...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const responseData = currentDetail.response?.data;
  const conditions = responseData?.conditions || [];
  const rawTriageLevel = responseData?.triage_level || 'self_care';
  const hasEmergency = responseData?.has_emergency_evidence;
  const patientInfo = currentDetail.patient_info;
  const symptoms = currentDetail.request?.symptoms || [];

  // If emergency evidence is detected, always show Emergency
  const effectiveTriageLevel = hasEmergency ? 'emergency' : rawTriageLevel;
  const triage = TRIAGE_CONFIG[effectiveTriageLevel] || TRIAGE_CONFIG.self_care;
  const TriageIcon = triage.icon;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Checkup Detail" onBack={() => navigation.goBack()} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-4 pb-32"
        showsVerticalScrollIndicator={false}>
        {/* Date */}
        <Text className="text-xs text-muted-foreground mb-4">
          {formatDate(currentDetail.created_at || currentDetail.createdAt)}
        </Text>

        {/* Triage Card */}
        <View
          style={{
            backgroundColor: `${triage.color}15`,
            borderWidth: 1,
            borderColor: `${triage.color}40`,
            borderRadius: 20,
            padding: 20,
            marginBottom: 16,
          }}>
          <View className="flex-row items-center gap-3 mb-3">
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: `${triage.color}25`,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <TriageIcon size={24} color={triage.color} />
            </View>
            <View className="flex-1">
              <Text style={{color: triage.color, fontWeight: 'bold', fontSize: 18}}>
                {triage.label}
              </Text>
              {hasEmergency && effectiveTriageLevel === 'emergency' && (
                <Text style={{color: colors.destructive, fontSize: 12, fontWeight: '600', marginTop: 2}}>
                  Immediate attention recommended
                </Text>
              )}
            </View>
          </View>
          <Text className="text-sm text-foreground leading-relaxed">
            {triage.description}
          </Text>
        </View>

        {/* Patient Info */}
        {patientInfo && (
          <View className="bg-card border border-border rounded-2xl p-4 mb-4">
            <View className="flex-row items-center gap-2 mb-2">
              <User size={16} color={colors.mutedForeground} />
              <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Patient Info
              </Text>
            </View>
            <View className="flex-row gap-4">
              {patientInfo.age && (
                <Text className="text-sm text-foreground">
                  Age: <Text className="font-semibold">{patientInfo.age}</Text>
                </Text>
              )}
              {patientInfo.gender && (
                <Text className="text-sm text-foreground">
                  Gender: <Text className="font-semibold capitalize">{patientInfo.gender}</Text>
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Initial Symptoms */}
        {symptoms.length > 0 && (
          <View className="mb-4">
            <Text className="text-sm font-bold text-foreground mb-3 px-1">
              Reported Symptoms ({symptoms.length})
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {symptoms.map((symptom: any, index: number) => (
                <View
                  key={symptom.id || index}
                  className="bg-primary/10 border border-primary/30 rounded-full px-3 py-1.5">
                  <Text className="text-xs font-medium text-primary">
                    {symptom.common_name || symptom.name || symptom.id}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Conditions */}
        <Text className="text-sm font-bold text-foreground mb-3 px-1">
          Possible Conditions ({conditions.length})
        </Text>

        {conditions.map((condition: any, index: number) => (
          <View
            key={condition.id || index}
            className="bg-card border border-border rounded-2xl p-4 mb-2">
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
              No specific conditions were identified during this checkup.
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
            onToggleExpand={() => setSummaryExpanded(v => !v)}
          />
        </View>

        {/* Actions */}
        <View className="mt-6 gap-3">
          <Button
            variant="outline"
            onPress={handleDownloadReport}
            loading={pdfLoading}
            icon={<Download size={18} color={colors.foreground} />}>
            Download Report
          </Button>

          <Button
            variant="primary"
            onPress={() => {
              navigation.navigate('HealthCheckupStart');
            }}
            icon={<Stethoscope size={18} color={colors.white} />}>
            Start New Checkup
          </Button>

          <Button
            variant="secondary"
            onPress={() => navigation.navigate('Main', {screen: 'Bookings'})}
            icon={<Calendar size={18} color={colors.foreground} />}>
            Book Appointment
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
