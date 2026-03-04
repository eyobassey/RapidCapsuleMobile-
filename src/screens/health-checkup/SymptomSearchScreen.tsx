import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {Search, X, Plus, Check, User, ChevronDown, MapPin} from 'lucide-react-native';
import {Header, Button} from '../../components/ui';
import {useHealthCheckupStore} from '../../store/healthCheckup';
import {colors} from '../../theme/colors';
import BodyAvatar from '../../components/health-checkup/BodyAvatar';

type Tab = 'search' | 'body';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.48;

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

  // Bottom sheet animation
  const sheetAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(sheetAnim, {
      toValue: selectedRegion ? 1 : 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [selectedRegion, sheetAnim]);

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

  const dismissSheet = () => {
    setSelectedRegion(null);
    setRegionResults([]);
  };

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

  const sheetTranslateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SHEET_HEIGHT, 0],
  });

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
      <Header title="Symptoms" onBack={() => navigation.goBack()} />

      <View style={{flex: 1}}>
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={{paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24}}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Step indicator */}
          <View className="flex-row items-center gap-2 mb-4">
            <View className="h-1.5 flex-1 bg-primary rounded-full" />
            <View className="h-1.5 flex-1 bg-primary rounded-full" />
            <View className="h-1.5 flex-1 bg-primary rounded-full" />
            <View className="h-1.5 flex-1 bg-border rounded-full" />
            <View className="h-1.5 flex-1 bg-border rounded-full" />
          </View>

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

          {/* Selected symptoms chips */}
          {selected.size > 0 && (
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12}}>
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
            </View>
          )}

          {/* ── Search Tab ── */}
          {tab === 'search' && (
            <>
              <View style={{marginBottom: 8}}>
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

              {results.map((symptom: any) => {
                const isSelected = selected.has(symptom.id);
                return (
                  <TouchableOpacity
                    key={symptom.id}
                    activeOpacity={0.7}
                    onPress={() => toggleSymptom(symptom)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      padding: 16,
                      borderRadius: 16,
                      borderWidth: 1.5,
                      marginBottom: 8,
                      backgroundColor: isSelected ? `${colors.primary}15` : colors.card,
                      borderColor: isSelected ? colors.primary : colors.mutedForeground,
                    }}>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 2,
                        backgroundColor: isSelected ? colors.primary : 'transparent',
                        borderColor: isSelected ? colors.primary : colors.mutedForeground,
                      }}>
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

              {/* Continue button */}
              <View style={{marginTop: 24, paddingBottom: 40}}>
                <Button variant="primary" onPress={handleNext} loading={isLoading}>
                  {selected.size > 0
                    ? `Continue with ${selected.size} symptom${selected.size > 1 ? 's' : ''}`
                    : 'Select Symptoms'}
                </Button>
              </View>
            </>
          )}

          {/* ── Body Map Tab ── */}
          {tab === 'body' && (
            <>
              <View className="bg-card border border-border rounded-2xl p-4">
                <BodyAvatar
                  sex={avatarSex}
                  selectedRegion={selectedRegion}
                  onSelectRegion={handleSelectRegion}
                />
              </View>

              {!selectedRegion && (
                <View style={{alignItems: 'center', paddingVertical: 24}}>
                  <MapPin size={20} color={colors.mutedForeground} />
                  <Text style={{fontSize: 13, color: colors.mutedForeground, textAlign: 'center', marginTop: 8}}>
                    Tap a body part to see related symptoms
                  </Text>
                </View>
              )}

              {/* Spacer so content doesn't hide behind sheet */}
              {selectedRegion && <View style={{height: SHEET_HEIGHT + 20}} />}

              {/* Continue button (when no sheet) */}
              {!selectedRegion && (
                <View style={{marginTop: 8, paddingBottom: 40}}>
                  <Button variant="primary" onPress={handleNext} loading={isLoading}>
                    {selected.size > 0
                      ? `Continue with ${selected.size} symptom${selected.size > 1 ? 's' : ''}`
                      : 'Select Symptoms'}
                  </Button>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* ── Bottom Sheet for Body Map Symptoms ── */}
        {tab === 'body' && selectedRegion && (
          <Animated.View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: SHEET_HEIGHT,
              backgroundColor: colors.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              shadowColor: '#000',
              shadowOffset: {width: 0, height: -4},
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 16,
              transform: [{translateY: sheetTranslateY}],
            }}>
            {/* Drag handle */}
            <View style={{alignItems: 'center', paddingTop: 10, paddingBottom: 4}}>
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.border,
                }}
              />
            </View>

            {/* Sheet header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1}}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: `${colors.primary}15`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <MapPin size={16} color={colors.primary} />
                </View>
                <View style={{flex: 1}}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: 'bold',
                      color: colors.foreground,
                      textTransform: 'capitalize',
                    }}>
                    {selectedRegion}
                  </Text>
                  <Text style={{fontSize: 11, color: colors.mutedForeground}}>
                    {regionLoading
                      ? 'Loading symptoms...'
                      : `${regionResults.length} symptom${regionResults.length !== 1 ? 's' : ''} found`}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={dismissSheet}
                activeOpacity={0.7}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.muted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <ChevronDown size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Sheet content — symptom list */}
            {regionLoading ? (
              <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : (
              <ScrollView
                style={{flex: 1}}
                contentContainerStyle={{paddingHorizontal: 16, paddingTop: 8, paddingBottom: 80}}
                showsVerticalScrollIndicator={false}>
                {regionResults.length > 0 ? (
                  regionResults.map((symptom: any) => {
                    const isSelected = selected.has(symptom.id);
                    return (
                      <TouchableOpacity
                        key={symptom.id}
                        activeOpacity={0.7}
                        onPress={() => toggleSymptom(symptom)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 12,
                          padding: 14,
                          borderRadius: 16,
                          borderWidth: 1,
                          marginBottom: 6,
                          backgroundColor: isSelected ? `${colors.primary}10` : colors.background,
                          borderColor: isSelected ? colors.primary : colors.mutedForeground,
                        }}>
                        <View
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 2,
                            backgroundColor: isSelected ? colors.primary : 'transparent',
                            borderColor: isSelected ? colors.primary : colors.mutedForeground,
                          }}>
                          {isSelected ? (
                            <Check size={14} color={colors.white} />
                          ) : (
                            <Plus size={14} color={colors.mutedForeground} />
                          )}
                        </View>
                        <Text style={{fontSize: 13, color: colors.foreground, flex: 1}}>
                          {symptom.common_name || symptom.name || symptom.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={{alignItems: 'center', paddingVertical: 24}}>
                    <Text style={{fontSize: 13, color: colors.mutedForeground}}>
                      No symptoms found for this area
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}

            {/* Continue button inside sheet */}
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                paddingHorizontal: 16,
                paddingTop: 8,
                paddingBottom: 24,
                backgroundColor: colors.card,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}>
              <Button variant="primary" onPress={handleNext} loading={isLoading}>
                {selected.size > 0
                  ? `Continue with ${selected.size} symptom${selected.size > 1 ? 's' : ''}`
                  : 'Select Symptoms'}
              </Button>
            </View>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}
