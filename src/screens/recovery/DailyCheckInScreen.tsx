import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Check, X, Pencil } from 'lucide-react-native';
import { Header, Button, Text, TextInput } from '../../components/ui';
import { colors } from '../../theme/colors';
import { recoveryService } from '../../services/recovery.service';
import { useRecoveryStore } from '../../store/recovery';

const TRIGGERS = [
  'Stress',
  'Social pressure',
  'Boredom',
  'Emotional pain',
  'Celebration',
  'Loneliness',
  'Work',
  'Financial',
  'Relationship',
];

const COPING = [
  'Exercise',
  'Meditation',
  'Called someone',
  'Journaling',
  'Deep breathing',
  'Attended meeting',
  'Walked',
  'Music',
  'Prayer',
];

function SliderRow({
  label,
  value,
  onChange,
  max = 10,
  lowLabel = '',
  highLabel = '',
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
  lowLabel?: string;
  highLabel?: string;
}) {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>{label}</Text>
        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>
          {value}/{max}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {Array.from({ length: max }, (_, i) => i + 1).map((v) => (
          <TouchableOpacity
            key={v}
            onPress={() => onChange(v)}
            accessibilityRole="button"
            accessibilityLabel={`${label} ${v} of ${max}`}
            style={{
              flex: 1,
              height: 28,
              borderRadius: 6,
              backgroundColor: v <= value ? colors.primary : colors.muted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 9,
                fontWeight: '700',
                color: v <= value ? colors.white : colors.mutedForeground,
              }}
            >
              {v}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {(lowLabel || highLabel) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 9, color: colors.mutedForeground }}>{lowLabel}</Text>
          <Text style={{ fontSize: 9, color: colors.mutedForeground }}>{highLabel}</Text>
        </View>
      )}
    </View>
  );
}

export default function DailyCheckInScreen() {
  const navigation = useNavigation<any>();
  const fetchDashboard = useRecoveryStore((s) => s.fetchDashboard);
  const loggedToday = useRecoveryStore((s) => s.dashboard?.daily_log_summary?.logged_today);

  const [isEditing, setIsEditing] = useState(false);
  const [prefilling, setPrefilling] = useState(true);
  const [soberToday, setSoberToday] = useState<boolean | null>(null);
  const [mood, setMood] = useState(5);
  const [craving, setCraving] = useState(0);
  const [energy, setEnergy] = useState(5);
  const [sleep, setSleep] = useState(5);
  const [anxiety, setAnxiety] = useState(3);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [coping, setCoping] = useState<string[]>([]);
  const [exercised, setExercised] = useState(false);
  const [gratitude, setGratitude] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Pre-fill from today's existing log if available
  useEffect(() => {
    (async () => {
      try {
        const logs = await recoveryService.getLogs({ limit: 1 });
        const today = new Date().toISOString().slice(0, 10);
        const todayLog = logs.find(
          (l) => l.log_date?.slice(0, 10) === today || l.created_at?.slice(0, 10) === today
        );
        if (todayLog) {
          setIsEditing(true);
          setSoberToday(todayLog.sober_today ?? null);
          setMood(todayLog.mood_score ?? 5);
          setCraving(todayLog.craving_intensity ?? 0);
          setEnergy(todayLog.energy_level ?? 5);
          setSleep(todayLog.sleep_quality ?? 5);
          setAnxiety(todayLog.anxiety_level ?? 3);
          setTriggers(todayLog.triggers_encountered ?? []);
          setCoping(todayLog.coping_strategies_used ?? []);
          setExercised(todayLog.exercised ?? false);
          setGratitude(todayLog.gratitude_note ?? '');
          setNotes(todayLog.notes ?? '');
        }
      } catch {}
      setPrefilling(false);
    })();
  }, []);

  const toggleItem = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  };

  const handleSubmit = async () => {
    if (soberToday === null) {
      Alert.alert('Required', 'Please indicate if you stayed sober today.');
      return;
    }

    setLoading(true);
    try {
      const result = await recoveryService.logDaily({
        log_date: new Date().toISOString(),
        sober_today: soberToday,
        mood_score: mood,
        craving_intensity: craving,
        energy_level: energy,
        sleep_quality: sleep,
        anxiety_level: anxiety,
        triggers_encountered: triggers,
        coping_strategies_used: coping,
        exercised,
        gratitude_note: gratitude || undefined,
        notes: notes || undefined,
      });

      await fetchDashboard();

      if (result.milestones_awarded?.length > 0) {
        Alert.alert(
          'Milestone Achieved!',
          result.milestones_awarded.map((m: any) => m.milestone_name).join('\n'),
          [{ text: 'Great!', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert(
          isEditing ? 'Check-in Updated' : 'Check-in Saved',
          "Keep going, you're doing great!",
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save check-in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <Header
        title={isEditing ? 'Update Check-in' : 'Daily Check-in'}
        onBack={() => navigation.goBack()}
      />

      {prefilling ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Already checked in banner */}
          {isEditing && (
            <View
              style={{
                backgroundColor: `${colors.primary}10`,
                borderRadius: 12,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Pencil size={16} color={colors.primary} />
              <Text
                style={{ flex: 1, fontSize: 12, color: colors.mutedForeground, lineHeight: 17 }}
              >
                You've already checked in today. Feel free to update your responses.
              </Text>
            </View>
          )}

          {/* Sober today? */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.foreground }}>
              Did you stay sober today?
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSoberToday(true)}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: soberToday === true ? `${colors.success}15` : colors.card,
                  borderWidth: 2,
                  borderColor: soberToday === true ? colors.success : colors.border,
                }}
              >
                <Check
                  size={18}
                  color={soberToday === true ? colors.success : colors.mutedForeground}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: soberToday === true ? colors.success : colors.foreground,
                  }}
                >
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSoberToday(false)}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: soberToday === false ? `${colors.destructive}15` : colors.card,
                  borderWidth: 2,
                  borderColor: soberToday === false ? colors.destructive : colors.border,
                }}
              >
                <X
                  size={18}
                  color={soberToday === false ? colors.destructive : colors.mutedForeground}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: soberToday === false ? colors.destructive : colors.foreground,
                  }}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sliders */}
          <SliderRow
            label="Mood"
            value={mood}
            onChange={setMood}
            lowLabel="Low"
            highLabel="Great"
          />
          <SliderRow
            label="Craving Intensity"
            value={craving}
            onChange={setCraving}
            max={10}
            lowLabel="None"
            highLabel="Extreme"
          />
          <SliderRow
            label="Energy Level"
            value={energy}
            onChange={setEnergy}
            lowLabel="Exhausted"
            highLabel="Energized"
          />
          <SliderRow
            label="Sleep Quality"
            value={sleep}
            onChange={setSleep}
            lowLabel="Poor"
            highLabel="Excellent"
          />
          <SliderRow
            label="Anxiety Level"
            value={anxiety}
            onChange={setAnxiety}
            lowLabel="Calm"
            highLabel="Severe"
          />

          {/* Triggers */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>
              Triggers Encountered
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {TRIGGERS.map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => toggleItem(triggers, t, setTriggers)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    backgroundColor: triggers.includes(t) ? `${colors.secondary}20` : colors.muted,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: triggers.includes(t) ? colors.secondary : colors.mutedForeground,
                      fontWeight: '500',
                    }}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Coping */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>
              Coping Strategies Used
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {COPING.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => toggleItem(coping, c, setCoping)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    backgroundColor: coping.includes(c) ? `${colors.success}20` : colors.muted,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: coping.includes(c) ? colors.success : colors.mutedForeground,
                      fontWeight: '500',
                    }}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Exercise toggle */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setExercised(!exercised)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              padding: 14,
              backgroundColor: exercised ? `${colors.success}10` : colors.card,
              borderWidth: 1,
              borderColor: exercised ? colors.success : colors.border,
              borderRadius: 12,
            }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: exercised ? colors.success : colors.mutedForeground,
                backgroundColor: exercised ? colors.success : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {exercised && <Check size={14} color={colors.white} />}
            </View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>
              I exercised today
            </Text>
          </TouchableOpacity>

          {/* Gratitude */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>
              Gratitude Note
            </Text>
            <TextInput
              value={gratitude}
              onChangeText={setGratitude}
              placeholder="What are you grateful for today?"
              placeholderTextColor={colors.mutedForeground}
              multiline
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 12,
                fontSize: 13,
                color: colors.foreground,
                minHeight: 60,
                textAlignVertical: 'top',
              }}
            />
          </View>

          {/* Notes */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>
              Additional Notes
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Anything else on your mind..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 12,
                fontSize: 13,
                color: colors.foreground,
                minHeight: 60,
                textAlignVertical: 'top',
              }}
            />
          </View>

          <Button variant="primary" onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : isEditing ? (
              'Update Check-in'
            ) : (
              'Save Check-in'
            )}
          </Button>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
