import React, {useState, useCallback, useRef} from 'react';
import {View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {Search, X, Plus, Check, User} from 'lucide-react-native';
import {Header, Button} from '../../components/ui';
import {useHealthCheckupStore} from '../../store/healthCheckup';
import {colors} from '../../theme/colors';
import BodyAvatar from '../../components/health-checkup/BodyAvatar';

type Tab = 'search' | 'body';

export default function SymptomSearchScreen() {
  const navigation = useNavigation<any>();
  const {addEvidence, submitDiagnosis, isLoading, searchSymptoms, sex} = useHealthCheckupStore();

  const [tab, setTab] = useState<Tab>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selected, setSelected] = useState<Map<string, any>>(new Map());
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<any>(null);

  // Body map state
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [regionResults, setRegionResults] = useState<any[]>([]);
  const [regionLoading, setRegionLoading] = useState(false);

  const handleSearch = useCallback(
    (text: string) => {
      setQuery(text);
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (text.trim().length < 2) {
        setResults([]);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        setSearching(true);
        const data = await searchSymptoms(text.trim());
        setResults(data);
        setSearching(false);
      }, 400);
    },
    [searchSymptoms],
  );

  const handleSelectRegion = useCallback(
    async (regionId: string) => {
      setSelectedRegion(regionId);
      setRegionLoading(true);
      const data = await searchSymptoms(regionId);
      setRegionResults(data);
      setRegionLoading(false);
    },
    [searchSymptoms],
  );

  const toggleSymptom = (symptom: any) => {
    setSelected(prev => {
      const next = new Map(prev);
      if (next.has(symptom.id)) {
        next.delete(symptom.id);
      } else {
        next.set(symptom.id, symptom);
      }
      return next;
    });
  };

  const handleNext = async () => {
    if (selected.size === 0) {
      Alert.alert('No Symptoms', 'Please select at least one symptom to continue.');
      return;
    }

    const evidence = Array.from(selected.keys()).map(id => ({
      id,
      choice_id: 'present' as const,
      source: 'initial' as const,
    }));
    addEvidence(evidence);

    try {
      await submitDiagnosis(false);
      navigation.navigate('HealthCheckupInterview');
    } catch {
      // Error handled in store
    }
  };

  const avatarSex = (sex === 'male' || sex === 'female') ? sex : 'male';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Symptoms" onBack={() => navigation.goBack()} />

      <View className="flex-1">
        {/* Step indicator */}
        <View className="flex-row items-center gap-2 px-5 pt-4 mb-4">
          <View className="h-1.5 flex-1 bg-primary rounded-full" />
          <View className="h-1.5 flex-1 bg-primary rounded-full" />
          <View className="h-1.5 flex-1 bg-primary rounded-full" />
          <View className="h-1.5 flex-1 bg-border rounded-full" />
          <View className="h-1.5 flex-1 bg-border rounded-full" />
        </View>

        <View className="px-5 mb-2">
          <Text className="text-lg font-bold text-foreground mb-1">
            What are your symptoms?
          </Text>
          <Text className="text-sm text-muted-foreground mb-3">
            Search for symptoms or tap body parts to add them.
          </Text>

          {/* Tab switcher */}
          <View className="flex-row bg-muted rounded-2xl p-1 mb-3">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setTab('search')}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 8,
                borderRadius: 14,
                backgroundColor: tab === 'search' ? colors.card : 'transparent',
              }}>
              <Search size={14} color={tab === 'search' ? colors.primary : colors.mutedForeground} />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: tab === 'search' ? colors.primary : colors.mutedForeground,
                }}>
                Search
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setTab('body')}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 8,
                borderRadius: 14,
                backgroundColor: tab === 'body' ? colors.card : 'transparent',
              }}>
              <User size={14} color={tab === 'body' ? colors.primary : colors.mutedForeground} />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: tab === 'body' ? colors.primary : colors.mutedForeground,
                }}>
                Body Map
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Selected symptoms chips */}
        {selected.size > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="px-5 py-2 gap-2"
            className="max-h-12">
            {Array.from(selected.values()).map((s: any) => (
              <TouchableOpacity
                key={s.id}
                onPress={() => toggleSymptom(s)}
                activeOpacity={0.7}
                className="flex-row items-center gap-1 bg-primary/10 border border-primary/30 rounded-full px-3 py-1.5">
                <Text className="text-xs font-medium text-primary">
                  {s.common_name || s.name || s.label}
                </Text>
                <X size={12} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* ── Search Tab ── */}
        {tab === 'search' && (
          <>
            <View className="px-5 mb-2">
              <View className="flex-row items-center bg-card border border-border rounded-2xl px-4 h-12">
                <Search size={18} color={colors.mutedForeground} />
                <TextInput
                  className="flex-1 text-sm text-foreground ml-3"
                  placeholder="Search symptoms (e.g. headache, fever)"
                  placeholderTextColor={colors.mutedForeground}
                  value={query}
                  onChangeText={handleSearch}
                  autoCapitalize="none"
                />
                {query.length > 0 && (
                  <TouchableOpacity onPress={() => {setQuery(''); setResults([]);}}>
                    <X size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                )}
                {searching && <ActivityIndicator size="small" color={colors.primary} />}
              </View>
            </View>

            <ScrollView
              className="flex-1"
              contentContainerClassName="px-5 pb-6"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              {results.map((symptom: any) => {
                const isSelected = selected.has(symptom.id);
                return (
                  <TouchableOpacity
                    key={symptom.id}
                    activeOpacity={0.7}
                    onPress={() => toggleSymptom(symptom)}
                    className={`flex-row items-center gap-3 p-4 rounded-2xl border mb-2 ${
                      isSelected ? 'bg-primary/10 border-primary' : 'bg-card border-border'
                    }`}>
                    <View
                      className={`w-6 h-6 rounded-full items-center justify-center ${
                        isSelected ? 'bg-primary' : 'bg-muted'
                      }`}>
                      {isSelected ? (
                        <Check size={14} color={colors.white} />
                      ) : (
                        <Plus size={14} color={colors.mutedForeground} />
                      )}
                    </View>
                    <Text className="text-sm text-foreground flex-1">
                      {symptom.common_name || symptom.name || symptom.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {query.length >= 2 && results.length === 0 && !searching && (
                <View className="items-center py-12">
                  <Text className="text-sm text-muted-foreground">No symptoms found</Text>
                </View>
              )}
            </ScrollView>
          </>
        )}

        {/* ── Body Map Tab ── */}
        {tab === 'body' && (
          <ScrollView
            className="flex-1"
            contentContainerClassName="px-5 pb-6"
            showsVerticalScrollIndicator={false}>
            <View className="bg-card border border-border rounded-2xl p-4">
              <BodyAvatar
                sex={avatarSex}
                selectedRegion={selectedRegion}
                onSelectRegion={handleSelectRegion}
              />
            </View>

            {/* Region symptoms */}
            {selectedRegion && (
              <View className="mt-4">
                <Text className="text-sm font-bold text-foreground mb-2 px-1 capitalize">
                  Symptoms for "{selectedRegion}"
                </Text>

                {regionLoading ? (
                  <View className="items-center py-6">
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text className="text-xs text-muted-foreground mt-2">Loading symptoms...</Text>
                  </View>
                ) : regionResults.length > 0 ? (
                  regionResults.map((symptom: any) => {
                    const isSelected = selected.has(symptom.id);
                    return (
                      <TouchableOpacity
                        key={symptom.id}
                        activeOpacity={0.7}
                        onPress={() => toggleSymptom(symptom)}
                        className={`flex-row items-center gap-3 p-4 rounded-2xl border mb-2 ${
                          isSelected ? 'bg-primary/10 border-primary' : 'bg-card border-border'
                        }`}>
                        <View
                          className={`w-6 h-6 rounded-full items-center justify-center ${
                            isSelected ? 'bg-primary' : 'bg-muted'
                          }`}>
                          {isSelected ? (
                            <Check size={14} color={colors.white} />
                          ) : (
                            <Plus size={14} color={colors.mutedForeground} />
                          )}
                        </View>
                        <Text className="text-sm text-foreground flex-1">
                          {symptom.common_name || symptom.name || symptom.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View className="items-center py-6">
                    <Text className="text-sm text-muted-foreground">
                      No symptoms found for this area
                    </Text>
                  </View>
                )}
              </View>
            )}

            {!selectedRegion && (
              <View className="items-center py-8">
                <Text className="text-sm text-muted-foreground text-center">
                  Tap a body part above to see related symptoms
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      <View className="bg-background border-t border-border px-5 pt-3 pb-8">
        <Button variant="primary" onPress={handleNext} loading={isLoading}>
          {selected.size > 0
            ? `Continue with ${selected.size} symptom${selected.size > 1 ? 's' : ''}`
            : 'Select Symptoms'}
        </Button>
      </View>
    </SafeAreaView>
  );
}
