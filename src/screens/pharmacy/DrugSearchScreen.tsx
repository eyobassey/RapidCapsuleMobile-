import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Search, X, Clock, TrendingUp } from 'lucide-react-native';

import { useDrugSearchQuery } from '../../hooks/queries';
import { usePharmacyStore } from '../../store/pharmacy';
import DrugCard from '../../components/pharmacy/DrugCard';
import { Header, EmptyState } from '../../components/ui';
import { colors } from '../../theme/colors';
import type { Drug } from '../../types/pharmacy.types';

const POPULAR_TAGS = [
  'Paracetamol',
  'Ibuprofen',
  'Vitamin C',
  'Amoxicillin',
  'Omeprazole',
  'Cetirizine',
];

export default function DrugSearchScreen() {
  const navigation = useNavigation<any>();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const recentSearches = usePharmacyStore((s) => s.recentSearches);
  const addRecentSearch = usePharmacyStore((s) => s.addRecentSearch);
  const clearRecentSearches = usePharmacyStore((s) => s.clearRecentSearches);

  const { data, isFetching } = useDrugSearchQuery(
    { query: debouncedQuery, limit: 20 },
    debouncedQuery.trim().length >= 2
  );
  const searchResults = data?.drugs ?? [];
  const searchTotal = data?.total ?? 0;
  const catalogLoading = isFetching;

  // Auto-focus on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Debounce query for search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setDebouncedQuery('');
      return;
    }
    debounceRef.current = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleDrugPress = (drug: Drug) => {
    addRecentSearch(query.trim());
    navigation.navigate('DrugDetail', { drugId: drug._id });
  };

  const handleTagPress = useCallback((tag: string) => {
    setQuery(tag);
  }, []);

  const handleRecentPress = useCallback((term: string) => {
    setQuery(term);
  }, []);

  const hasQuery = query.trim().length >= 2;
  const showSuggestions = !hasQuery;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Search Drugs" onBack={() => navigation.goBack()} />

      {/* Search Input */}
      <View className="px-5 pt-3 pb-2">
        <View className="flex-row items-center bg-card border border-border rounded-2xl px-4 h-12">
          <Search size={18} color={colors.mutedForeground} />
          <TextInput
            ref={inputRef}
            className="flex-1 text-foreground text-base ml-3 h-full"
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name, generic name..."
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Search drugs"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <X size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showSuggestions ? (
        <View className="flex-1 px-5 pt-2">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Clock size={14} color={colors.mutedForeground} />
                  <Text className="text-xs font-bold text-foreground/70 uppercase tracking-wider ml-1.5">
                    Recent
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={clearRecentSearches}
                  accessibilityRole="button"
                  accessibilityLabel="Clear recent searches"
                >
                  <Text className="text-xs text-primary">Clear</Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {recentSearches.map((term) => (
                  <TouchableOpacity
                    key={term}
                    onPress={() => handleRecentPress(term)}
                    accessibilityRole="button"
                    accessibilityLabel={`Search for ${term}`}
                    className="bg-card border border-border rounded-full px-3 py-1.5"
                  >
                    <Text className="text-sm text-foreground">{term}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Popular Tags */}
          <View>
            <View className="flex-row items-center mb-2">
              <TrendingUp size={14} color={colors.mutedForeground} />
              <Text className="text-xs font-bold text-foreground/70 uppercase tracking-wider ml-1.5">
                Popular
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {POPULAR_TAGS.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  onPress={() => handleTagPress(tag)}
                  accessibilityRole="button"
                  accessibilityLabel={`Search for ${tag}`}
                  className="bg-primary/10 rounded-full px-3 py-1.5"
                >
                  <Text className="text-sm text-primary font-medium">{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      ) : (
        <FlashList<Drug>
          data={searchResults}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <DrugCard drug={item} variant="full" onPress={handleDrugPress} />
          )}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          estimatedItemSize={100}
          ListHeaderComponent={
            catalogLoading ? (
              <View className="items-center py-4">
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : searchResults.length > 0 ? (
              <Text className="text-xs text-muted-foreground mb-2">
                {searchTotal} result{searchTotal !== 1 ? 's' : ''}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            !catalogLoading ? (
              <EmptyState
                icon={<Search size={32} color={colors.mutedForeground} />}
                title="No results"
                subtitle={`No drugs found for "${query}"`}
              />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
