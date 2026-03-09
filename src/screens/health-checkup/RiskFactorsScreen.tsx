import React, {useState, useMemo} from 'react';
import {View, Text, ScrollView, TouchableOpacity, TextInput} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {Check, Shield, Search, X, ChevronDown, ChevronUp} from 'lucide-react-native';
import {Header, Button} from '../../components/ui';
import {useHealthCheckupStore} from '../../store/healthCheckup';
import {colors} from '../../theme/colors';

const INITIAL_VISIBLE = 8;

function FactorItem({
  factor,
  isSelected,
  onToggle,
}: {
  factor: any;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      accessibilityRole="checkbox"
      accessibilityLabel={factor.common_name || factor.name}
      accessibilityState={{checked: isSelected}}
      onPress={onToggle}
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
      <View style={{flex: 1}}>
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
}

export default function RiskFactorsScreen() {
  const navigation = useNavigation<any>();
  const {riskFactors, addEvidence} = useHealthCheckupStore();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

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

  // Split factors: selected ones from search that aren't in top 8, visible common ones, search results
  const topFactors = useMemo(() => riskFactors.slice(0, INITIAL_VISIBLE), [riskFactors]);
  const remainingFactors = useMemo(() => riskFactors.slice(INITIAL_VISIBLE), [riskFactors]);

  // Factors selected from search that aren't in the visible top list
  const extraSelected = useMemo(() => {
    const topIds = new Set(topFactors.map((f: any) => f.id));
    return riskFactors.filter((f: any) => selected.has(f.id) && !topIds.has(f.id));
  }, [riskFactors, selected, topFactors]);

  // Search results from remaining factors
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return remainingFactors.filter((f: any) => {
      const name = (f.common_name || f.name || '').toLowerCase();
      const question = (f.question || '').toLowerCase();
      return name.includes(q) || question.includes(q);
    });
  }, [query, remainingFactors]);

  const handleNext = () => {
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

  const hasMore = remainingFactors.length > 0;

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
      <Header title="Risk Factors" onBack={() => navigation.goBack()} />

      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40}}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Step indicator */}
        <View className="flex-row items-center gap-2 mb-6">
          <View className="h-1.5 flex-1 bg-primary rounded-full" />
          <View className="h-1.5 flex-1 bg-primary rounded-full" />
          <View className="h-1.5 flex-1 bg-border rounded-full" />
          <View className="h-1.5 flex-1 bg-border rounded-full" />
          <View className="h-1.5 flex-1 bg-border rounded-full" />
        </View>

        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4}}>
          <Shield size={20} color={colors.primary} />
          <Text className="text-lg font-bold text-foreground">Risk Factors</Text>
        </View>
        <Text className="text-sm text-muted-foreground mb-6">
          Select any that apply. You can search for more below.
        </Text>

        {riskFactors.length === 0 ? (
          <View className="bg-card border border-border rounded-2xl p-6 items-center">
            <Text className="text-sm text-muted-foreground text-center">
              No risk factors to display for your age group.
            </Text>
          </View>
        ) : (
          <>
            {/* Extra selected (from search, not in top 8) — pinned at top */}
            {extraSelected.length > 0 && (
              <View style={{gap: 8, marginBottom: 8}}>
                {extraSelected.map((factor: any) => (
                  <FactorItem
                    key={factor.id}
                    factor={factor}
                    isSelected={true}
                    onToggle={() => toggleFactor(factor.id)}
                  />
                ))}
              </View>
            )}

            {/* Common risk factors (top 8) */}
            <View style={{gap: 8}}>
              {topFactors.map((factor: any) => (
                <FactorItem
                  key={factor.id}
                  factor={factor}
                  isSelected={selected.has(factor.id)}
                  onToggle={() => toggleFactor(factor.id)}
                />
              ))}
            </View>

            {/* Show All toggle for remaining factors without search */}
            {hasMore && !query && (
              <TouchableOpacity
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={showAll ? 'Show less risk factors' : `Show all ${riskFactors.length} risk factors`}
                onPress={() => setShowAll(v => !v)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  marginTop: 12,
                  paddingVertical: 8,
                }}>
                {showAll ? (
                  <ChevronUp size={16} color={colors.primary} />
                ) : (
                  <ChevronDown size={16} color={colors.primary} />
                )}
                <Text style={{fontSize: 13, fontWeight: '600', color: colors.primary}}>
                  {showAll ? 'Show Less' : `Show All (${riskFactors.length} total)`}
                </Text>
              </TouchableOpacity>
            )}

            {/* Expanded full list */}
            {showAll && !query && (
              <View style={{gap: 8, marginTop: 8}}>
                {remainingFactors.map((factor: any) => (
                  <FactorItem
                    key={factor.id}
                    factor={factor}
                    isSelected={selected.has(factor.id)}
                    onToggle={() => toggleFactor(factor.id)}
                  />
                ))}
              </View>
            )}

            {/* Search bar */}
            {hasMore && (
              <View style={{marginTop: 16}}>
                <Text style={{fontSize: 12, fontWeight: 'bold', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4}}>
                  Search Risk Factors
                </Text>
                <View className="flex-row items-center bg-card border border-border rounded-2xl px-4 h-12">
                  <Search size={18} color={colors.mutedForeground} />
                  <TextInput
                    style={{flex: 1, fontSize: 14, color: colors.foreground, marginLeft: 12}}
                    placeholder="Type to search..."
                    placeholderTextColor={colors.mutedForeground}
                    value={query}
                    onChangeText={setQuery}
                    autoCapitalize="none"
                    accessibilityLabel="Search risk factors"
                  />
                  {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel="Clear search">
                      <X size={18} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Search results */}
                {query.length > 0 && searchResults.length > 0 && (
                  <View style={{gap: 8, marginTop: 12}}>
                    {searchResults.map((factor: any) => (
                      <FactorItem
                        key={factor.id}
                        factor={factor}
                        isSelected={selected.has(factor.id)}
                        onToggle={() => toggleFactor(factor.id)}
                      />
                    ))}
                  </View>
                )}

                {query.length >= 2 && searchResults.length === 0 && (
                  <View style={{alignItems: 'center', paddingVertical: 16}}>
                    <Text className="text-sm text-muted-foreground">No matching risk factors</Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* Continue button */}
        <View style={{marginTop: 24}}>
          <Button variant="primary" onPress={handleNext}>
            {selected.size > 0
              ? `Continue with ${selected.size} factor${selected.size > 1 ? 's' : ''}`
              : 'Skip & Continue'}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
