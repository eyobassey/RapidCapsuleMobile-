import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, Alert} from 'react-native';
import {Input} from '../../components/ui';
import SectionScreenLayout from '../../components/onboarding/SectionScreenLayout';
import SelectPicker from '../../components/onboarding/SelectPicker';
import ArrayFieldList from '../../components/onboarding/ArrayFieldList';
import {colors} from '../../theme/colors';
import {useAuthStore} from '../../store/auth';
import {useOnboardingStore} from '../../store/onboarding';
import {usersService} from '../../services/users.service';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {OnboardingStackParamList} from '../../navigation/OnboardingStack';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Allergies'>;

const SEVERITY_OPTIONS = [
  {label: 'Mild', value: 'mild'},
  {label: 'Moderate', value: 'moderate'},
  {label: 'Severe', value: 'severe'},
  {label: 'Life Threatening', value: 'life_threatening'},
];

type AllergyCategory = 'drug' | 'food' | 'environmental' | 'other';

interface AllergyForm {
  name: string;
  reaction: string;
  severity: string;
}

const CATEGORY_CONFIG: {key: AllergyCategory; label: string; nameLabel: string; placeholder: string}[] = [
  {key: 'drug', label: 'Drug Allergies', nameLabel: 'Drug Name', placeholder: 'e.g. Penicillin'},
  {key: 'food', label: 'Food Allergies', nameLabel: 'Food Name', placeholder: 'e.g. Peanuts'},
  {key: 'environmental', label: 'Environmental Allergies', nameLabel: 'Allergen', placeholder: 'e.g. Pollen'},
  {key: 'other', label: 'Other Allergies', nameLabel: 'Allergen', placeholder: 'e.g. Latex'},
];

export default function AllergiesScreen({navigation}: Props) {
  const user = useAuthStore(s => s.user);
  const fetchUser = useAuthStore(s => s.fetchUser);
  const clearDraft = useOnboardingStore(s => s.clearDraft);

  const [hasAllergies, setHasAllergies] = useState<boolean | null>(null);
  const [allergies, setAllergies] = useState<Record<AllergyCategory, AllergyForm[]>>({
    drug: [],
    food: [],
    environmental: [],
    other: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.allergies) {
      const a = user.allergies;
      setHasAllergies(a.has_allergies ?? null);
      setAllergies({
        drug: (a.drug_allergies || []).map((x: any) => ({
          name: x.drug_name || '', reaction: x.reaction || '', severity: x.severity || '',
        })),
        food: (a.food_allergies || []).map((x: any) => ({
          name: x.food_name || '', reaction: x.reaction || '', severity: x.severity || '',
        })),
        environmental: (a.environmental_allergies || []).map((x: any) => ({
          name: x.allergen || '', reaction: x.reaction || '', severity: x.severity || '',
        })),
        other: (a.other_allergies || []).map((x: any) => ({
          name: x.allergen || '', reaction: x.reaction || '', severity: x.severity || '',
        })),
      });
    }
  }, [user]);

  const updateItem = (category: AllergyCategory, index: number, field: keyof AllergyForm, value: string) => {
    setAllergies(prev => {
      const items = [...prev[category]];
      items[index] = {...items[index], [field]: value};
      return {...prev, [category]: items};
    });
  };

  const addItem = (category: AllergyCategory) => {
    setAllergies(prev => ({
      ...prev,
      [category]: [...prev[category], {name: '', reaction: '', severity: ''}],
    }));
  };

  const removeItem = (category: AllergyCategory, index: number) => {
    setAllergies(prev => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const nameKey = (cat: AllergyCategory) =>
        cat === 'drug' ? 'drug_name' : cat === 'food' ? 'food_name' : 'allergen';

      await usersService.updateProfile({
        allergies: {
          has_allergies: hasAllergies ?? false,
          drug_allergies: allergies.drug.filter(a => a.name.trim()).map(a => ({
            [nameKey('drug')]: a.name.trim(), reaction: a.reaction.trim(), severity: a.severity,
          })),
          food_allergies: allergies.food.filter(a => a.name.trim()).map(a => ({
            [nameKey('food')]: a.name.trim(), reaction: a.reaction.trim(), severity: a.severity,
          })),
          environmental_allergies: allergies.environmental.filter(a => a.name.trim()).map(a => ({
            [nameKey('environmental')]: a.name.trim(), reaction: a.reaction.trim(), severity: a.severity,
          })),
          other_allergies: allergies.other.filter(a => a.name.trim()).map(a => ({
            [nameKey('other')]: a.name.trim(), reaction: a.reaction.trim(), severity: a.severity,
          })),
        },
      });
      clearDraft('allergies');
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
      title="Allergies"
      description="Record your known allergies to help healthcare providers keep you safe."
      onBack={() => navigation.goBack()}
      onSave={handleSave}
      saveLabel={hasAllergies !== null ? 'Save & Continue' : 'Skip for Now'}
      loading={loading}>
      {/* Quick toggle: do you have allergies? */}
      <Text
        style={{
          fontSize: 14,
          fontWeight: '700',
          color: colors.foreground,
          marginBottom: 12,
        }}>
        Do you have any known allergies?
      </Text>
      <View style={{flexDirection: 'row', gap: 12, marginBottom: 24}}>
        {([
          {label: 'Yes', value: true},
          {label: 'No', value: false},
        ] as const).map(opt => (
          <TouchableOpacity
            key={opt.label}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${opt.label}, ${opt.label === 'Yes' ? 'I have allergies' : 'No known allergies'}`}
            accessibilityState={{selected: hasAllergies === opt.value}}
            onPress={() => setHasAllergies(opt.value)}
            style={{
              flex: 1,
              paddingVertical: 14,
              borderRadius: 16,
              borderWidth: 1.5,
              alignItems: 'center',
              backgroundColor:
                hasAllergies === opt.value ? `${colors.primary}15` : colors.card,
              borderColor:
                hasAllergies === opt.value ? colors.primary : colors.border,
            }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color:
                  hasAllergies === opt.value
                    ? colors.primary
                    : colors.foreground,
              }}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {hasAllergies === true &&
        CATEGORY_CONFIG.map(cat => (
          <View key={cat.key} style={{marginBottom: 20}}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: colors.foreground,
                marginBottom: 12,
              }}>
              {cat.label}
            </Text>
            <ArrayFieldList
              items={allergies[cat.key]}
              onAdd={() => addItem(cat.key)}
              onRemove={index => removeItem(cat.key, index)}
              addLabel={`Add ${cat.label.replace(' Allergies', '')}`}
              emptyText={`No ${cat.label.toLowerCase()} recorded`}
              renderItem={(item, index) => (
                <View style={{gap: 12}}>
                  <Input
                    label={cat.nameLabel}
                    placeholder={cat.placeholder}
                    value={item.name}
                    onChangeText={v => updateItem(cat.key, index, 'name', v)}
                  />
                  <Input
                    label="Reaction"
                    placeholder="Describe the reaction"
                    value={item.reaction}
                    onChangeText={v => updateItem(cat.key, index, 'reaction', v)}
                  />
                  <SelectPicker
                    label="Severity"
                    value={item.severity}
                    options={SEVERITY_OPTIONS}
                    onChange={v => updateItem(cat.key, index, 'severity', v)}
                  />
                </View>
              )}
            />
          </View>
        ))}

      {hasAllergies === false && (
        <View
          style={{
            backgroundColor: `${colors.success}15`,
            borderRadius: 16,
            padding: 20,
            alignItems: 'center',
          }}>
          <Text style={{fontSize: 14, color: colors.success, fontWeight: '600'}}>
            No known allergies
          </Text>
          <Text style={{fontSize: 12, color: colors.mutedForeground, marginTop: 4}}>
            This will be saved to your health profile.
          </Text>
        </View>
      )}
    </SectionScreenLayout>
  );
}
