import React, {useState, useEffect} from 'react';
import {View, Text, TextInput, TouchableOpacity, Alert} from 'react-native';
import {Plus, X} from 'lucide-react-native';
import SectionScreenLayout from '../../components/onboarding/SectionScreenLayout';
import SelectPicker from '../../components/onboarding/SelectPicker';
import {colors} from '../../theme/colors';
import {useAuthStore} from '../../store/auth';
import {useOnboardingStore} from '../../store/onboarding';
import {usersService} from '../../services/users.service';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {OnboardingStackParamList} from '../../navigation/OnboardingStack';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'MedicalHistory'>;

const SMOKING_OPTIONS = [
  {label: 'Never', value: 'never'},
  {label: 'Former', value: 'former'},
  {label: 'Current', value: 'current'},
  {label: 'Occasional', value: 'occasional'},
];
const ALCOHOL_OPTIONS = [
  {label: 'Never', value: 'never'},
  {label: 'Occasional', value: 'occasional'},
  {label: 'Moderate', value: 'moderate'},
  {label: 'Heavy', value: 'heavy'},
];
const EXERCISE_OPTIONS = [
  {label: 'Sedentary', value: 'sedentary'},
  {label: 'Light', value: 'light'},
  {label: 'Moderate', value: 'moderate'},
  {label: 'Active', value: 'active'},
];
const DIET_OPTIONS = [
  {label: 'Regular', value: 'regular'},
  {label: 'Vegetarian', value: 'vegetarian'},
  {label: 'Vegan', value: 'vegan'},
  {label: 'Keto', value: 'keto'},
];

export default function MedicalHistoryScreen({navigation}: Props) {
  const user = useAuthStore(s => s.user);
  const fetchUser = useAuthStore(s => s.fetchUser);
  const clearDraft = useOnboardingStore(s => s.clearDraft);

  const [conditions, setConditions] = useState<string[]>([]);
  const [medications, setMedications] = useState<string[]>([]);
  const [surgeries, setSurgeries] = useState<string[]>([]);
  const [familyHistory, setFamilyHistory] = useState<string[]>([]);
  const [lifestyle, setLifestyle] = useState({
    smoking: '',
    alcohol: '',
    exercise: '',
    diet: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const h = user?.medical_history || (user?.profile as any)?.medical_history;
    if (h) {
      setConditions(h.chronic_conditions || []);
      setMedications(
        (h.current_medications || []).map((m: any) =>
          typeof m === 'string' ? m : m.name || '',
        ),
      );
      setSurgeries(
        (h.past_surgeries || []).map((s: any) =>
          typeof s === 'string' ? s : s.procedure || '',
        ),
      );
      setFamilyHistory(
        (h.family_history || []).map((f: any) =>
          typeof f === 'string' ? f : `${f.condition}${f.relation ? ` (${f.relation})` : ''}`,
        ),
      );
      if (h.lifestyle) {
        setLifestyle({
          smoking: h.lifestyle.smoking || '',
          alcohol: h.lifestyle.alcohol || '',
          exercise: h.lifestyle.exercise || '',
          diet: h.lifestyle.diet || '',
        });
      }
    }
  }, [user]);

  const hasSomething =
    conditions.length > 0 ||
    medications.length > 0 ||
    surgeries.length > 0 ||
    familyHistory.length > 0 ||
    lifestyle.smoking ||
    lifestyle.alcohol ||
    lifestyle.exercise ||
    lifestyle.diet;

  const handleSave = async () => {
    setLoading(true);
    try {
      await usersService.updateProfile({
        medical_history: {
          chronic_conditions: conditions.filter(Boolean),
          current_medications: medications.filter(Boolean).map(name => ({name})),
          past_surgeries: surgeries.filter(Boolean).map(procedure => ({procedure})),
          family_history: familyHistory.filter(Boolean).map(condition => ({condition})),
          lifestyle: {
            smoking: lifestyle.smoking || undefined,
            alcohol: lifestyle.alcohol || undefined,
            exercise: lifestyle.exercise || undefined,
            diet: lifestyle.diet || undefined,
          },
        },
      });
      clearDraft('medicalHistory');
      await fetchUser();
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionScreenLayout
      title="Medical History"
      description="Your medical history helps doctors understand your health background."
      onBack={() => navigation.goBack()}
      onSave={handleSave}
      saveLabel={hasSomething ? 'Save & Continue' : 'Skip for Now'}
      loading={loading}>
      <View style={{gap: 24}}>
        <StringListSection
          title="Chronic Conditions"
          items={conditions}
          setItems={setConditions}
          placeholder="e.g. Diabetes, Hypertension"
          addLabel="Add Condition"
        />

        <StringListSection
          title="Current Medications"
          items={medications}
          setItems={setMedications}
          placeholder="e.g. Metformin 500mg"
          addLabel="Add Medication"
        />

        <StringListSection
          title="Past Surgeries"
          items={surgeries}
          setItems={setSurgeries}
          placeholder="e.g. Appendectomy"
          addLabel="Add Surgery"
        />

        <StringListSection
          title="Family History"
          items={familyHistory}
          setItems={setFamilyHistory}
          placeholder="e.g. Heart disease (Father)"
          addLabel="Add Family History"
        />

        {/* Lifestyle */}
        <View>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: colors.foreground,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              paddingBottom: 8,
              marginBottom: 16,
            }}>
            Lifestyle
          </Text>
          <View style={{gap: 16}}>
            <View style={{flexDirection: 'row', gap: 12}}>
              <View style={{flex: 1}}>
                <SelectPicker
                  label="Smoking"
                  value={lifestyle.smoking}
                  options={SMOKING_OPTIONS}
                  onChange={v => setLifestyle(prev => ({...prev, smoking: v}))}
                />
              </View>
              <View style={{flex: 1}}>
                <SelectPicker
                  label="Alcohol"
                  value={lifestyle.alcohol}
                  options={ALCOHOL_OPTIONS}
                  onChange={v => setLifestyle(prev => ({...prev, alcohol: v}))}
                />
              </View>
            </View>
            <View style={{flexDirection: 'row', gap: 12}}>
              <View style={{flex: 1}}>
                <SelectPicker
                  label="Exercise"
                  value={lifestyle.exercise}
                  options={EXERCISE_OPTIONS}
                  onChange={v => setLifestyle(prev => ({...prev, exercise: v}))}
                />
              </View>
              <View style={{flex: 1}}>
                <SelectPicker
                  label="Diet"
                  value={lifestyle.diet}
                  options={DIET_OPTIONS}
                  onChange={v => setLifestyle(prev => ({...prev, diet: v}))}
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    </SectionScreenLayout>
  );
}

// ─── Reusable string list component ─────────────────────────────

function StringListSection({
  title,
  items,
  setItems,
  placeholder,
  addLabel,
}: {
  title: string;
  items: string[];
  setItems: React.Dispatch<React.SetStateAction<string[]>>;
  placeholder: string;
  addLabel: string;
}) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !items.includes(trimmed)) {
      setItems(prev => [...prev, trimmed]);
      setInputValue('');
    }
  };

  return (
    <View>
      <Text
        style={{
          fontSize: 14,
          fontWeight: '700',
          color: colors.foreground,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingBottom: 8,
          marginBottom: 12,
        }}>
        {title}
      </Text>

      {/* Chips */}
      {items.length > 0 && (
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12}}>
          {items.map((item, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: `${colors.primary}15`,
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}>
              <Text style={{fontSize: 12, color: colors.primary, fontWeight: '500'}}>
                {item}
              </Text>
              <TouchableOpacity
                onPress={() => setItems(prev => prev.filter((_, i) => i !== index))}
                hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
                <X size={12} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Input + add button */}
      <View style={{flexDirection: 'row', gap: 8}}>
        <View style={{flex: 1}}>
          <TextInput
            style={{
              height: 48,
              borderRadius: 12,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 14,
              fontSize: 14,
              color: colors.foreground,
            }}
            placeholder={placeholder}
            placeholderTextColor={colors.mutedForeground}
            value={inputValue}
            onChangeText={setInputValue}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
        </View>
        <TouchableOpacity
          onPress={handleAdd}
          activeOpacity={0.7}
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Plus size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
