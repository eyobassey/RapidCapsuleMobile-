import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import {
  ChevronRight,
  ClipboardList,
  FileText,
  Search,
  ShoppingCart,
  Upload,
} from 'lucide-react-native';
import React, { useCallback } from 'react';
import { RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import CategoryCard from '../../components/pharmacy/CategoryCard';
import DrugCard from '../../components/pharmacy/DrugCard';
import { Skeleton, Text } from '../../components/ui';
import { useFeaturedDrugsQuery, usePharmacyCategoriesQuery } from '../../hooks/queries';
import { usePharmacyStore } from '../../store/pharmacy';
import { colors } from '../../theme/colors';
import type { Drug, DrugCategory } from '../../types/pharmacy.types';

export default function PharmacyHomeScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const cartCount = usePharmacyStore((s) => s.cartCount);
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = usePharmacyCategoriesQuery();
  const {
    data: featuredDrugs = [],
    isLoading: featuredLoading,
    refetch: refetchFeatured,
  } = useFeaturedDrugsQuery();

  const catalogLoading = categoriesLoading || featuredLoading;

  const onRefresh = useCallback(() => {
    refetchCategories();
    refetchFeatured();
  }, [refetchCategories, refetchFeatured]);

  const handleDrugPress = (drug: Drug) => {
    navigation.navigate('DrugDetail', { drugId: drug._id });
  };

  const handleCategoryPress = (category: DrugCategory) => {
    navigation.navigate('DrugCategory', {
      categoryId: category._id,
      categoryName: category.name,
    });
  };

  const isFirstLoad = catalogLoading && featuredDrugs.length === 0;
  const cartFabBottom = insets.bottom + 76;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between bg-card border-b border-border px-5 py-3">
        <Text className="text-xl font-bold text-foreground">Pharmacy</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Shopping cart${cartCount > 0 ? `, ${cartCount} items` : ''}`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ShoppingCart size={24} color={colors.foreground} />
          {cartCount > 0 && (
            <View className="absolute -top-1.5 -right-1.5 bg-destructive rounded-full w-5 h-5 items-center justify-center">
              <Text className="text-[10px] font-bold text-white">
                {cartCount > 9 ? '9+' : cartCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-36"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}
      >
        {/* Search Bar (tap to navigate) */}
        <TouchableOpacity
          onPress={() => navigation.navigate('DrugSearch')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Search drugs"
          className="mx-5 mt-4 flex-row items-center bg-card border border-border rounded-2xl px-4 h-12"
        >
          <Search size={18} color={colors.mutedForeground} />
          <Text className="flex-1 text-muted-foreground text-base ml-3">Search drugs...</Text>
        </TouchableOpacity>

        {/* Quick Links */}
        <View className="mx-5 mt-6 bg-card border border-border rounded-2xl overflow-hidden">
          <TouchableOpacity
            onPress={() => navigation.navigate('UploadPrescription')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Upload prescription"
            className="p-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <Upload size={20} color={colors.primary} />
              <Text className="text-sm font-semibold text-foreground ml-3">
                Upload Prescription
              </Text>
            </View>
            <ChevronRight size={18} color={colors.mutedForeground} />
          </TouchableOpacity>

          <View className="border-t border-border" />

          <TouchableOpacity
            onPress={() => navigation.navigate('MyUploads')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="My prescriptions"
            className="p-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <FileText size={20} color={colors.primary} />
              <Text className="text-sm font-semibold text-foreground ml-3">My Prescriptions</Text>
            </View>
            <ChevronRight size={18} color={colors.mutedForeground} />
          </TouchableOpacity>

          <View className="border-t border-border" />

          <TouchableOpacity
            onPress={() => navigation.navigate('MyOrders')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="My orders"
            className="p-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <ClipboardList size={20} color={colors.primary} />
              <Text className="text-sm font-semibold text-foreground ml-3">My Orders</Text>
            </View>
            <ChevronRight size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Featured Drugs */}
        {featuredDrugs.length > 0 && (
          <View className="mt-6">
            <Text className="text-base font-bold text-foreground px-5 mb-3">Featured</Text>
            {isFirstLoad ? (
              <View className="flex-row px-5">
                {[1, 2, 3].map((i) => (
                  <View key={i} className="w-40 mr-3">
                    <Skeleton height={112} borderRadius={16} />
                    <Skeleton height={14} className="mt-2" />
                    <Skeleton height={14} width={80} className="mt-1" />
                  </View>
                ))}
              </View>
            ) : (
              <FlashList
                horizontal
                data={featuredDrugs}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <DrugCard drug={item} variant="compact" onPress={handleDrugPress} />
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20 }}
                estimatedItemSize={160}
                ListEmptyComponent={
                  <Text className="text-sm text-muted-foreground px-5">
                    No featured drugs available
                  </Text>
                }
              />
            )}
          </View>
        )}

        {/* Categories */}
        <View className="mt-6 px-5">
          <Text className="text-base font-bold text-foreground mb-3">Categories</Text>
          {isFirstLoad ? (
            <View className="flex-row flex-wrap">
              {[1, 2, 3, 4].map((i) => (
                <View key={i} className="w-[48%] m-1">
                  <Skeleton height={100} borderRadius={16} />
                </View>
              ))}
            </View>
          ) : (
            <View className="flex-row flex-wrap -mx-1.5">
              {categories.map((cat) => (
                <View key={cat._id} className="w-[48%]">
                  <CategoryCard category={cat} onPress={handleCategoryPress} />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Cart FAB */}
      {cartCount > 0 && (
        <TouchableOpacity
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`View cart, ${cartCount} items`}
          className="absolute right-5 bg-primary rounded-full w-14 h-14 items-center justify-center"
          style={{
            bottom: cartFabBottom,
            elevation: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
          }}
        >
          <ShoppingCart size={22} color="#fff" />
          <View className="absolute -top-1 -right-1 bg-destructive rounded-full w-5 h-5 items-center justify-center">
            <Text className="text-[10px] font-bold text-white">
              {cartCount > 9 ? '9+' : cartCount}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
