import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import {
  Pill,
  ShieldAlert,
  Minus,
  Plus,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
} from 'lucide-react-native';

import {usePharmacyStore} from '../../store/pharmacy';
import DrugCard from '../../components/pharmacy/DrugCard';
import {Header} from '../../components/ui';
import {colors} from '../../theme/colors';
import {useCurrency} from '../../hooks/useCurrency';
import type {Drug} from '../../types/pharmacy.types';
import {getDrugPrice, getDrugImage} from '../../types/pharmacy.types';
import type {PharmacyStackParamList} from '../../navigation/stacks/PharmacyStack';

function CollapsibleSection({title, items, icon}: {title: string; items: string[]; icon: React.ReactNode}) {
  const [open, setOpen] = useState(false);
  if (!items || items.length === 0) return null;

  return (
    <View className="border-t border-border">
      <TouchableOpacity
        onPress={() => setOpen(!open)}
        className="flex-row items-center justify-between py-3 px-4"
        activeOpacity={0.7}>
        <View className="flex-row items-center">
          {icon}
          <Text className="text-sm font-semibold text-foreground ml-2">{title}</Text>
        </View>
        {open ? (
          <ChevronUp size={18} color={colors.mutedForeground} />
        ) : (
          <ChevronDown size={18} color={colors.mutedForeground} />
        )}
      </TouchableOpacity>
      {open && (
        <View className="px-4 pb-3">
          {items.map((item, idx) => (
            <Text key={idx} className="text-sm text-muted-foreground mb-1">
              {'\u2022'} {item}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

export default function DrugDetailScreen() {
  const {format} = useCurrency();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<PharmacyStackParamList, 'DrugDetail'>>();
  const {drugId} = route.params;

  const {
    currentDrug,
    similarDrugs,
    catalogLoading,
    fetchDrugById,
    fetchSimilarDrugs,
    addToCart,
  } = usePharmacyStore();

  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchDrugById(drugId);
    fetchSimilarDrugs(drugId);
  }, [drugId, fetchDrugById, fetchSimilarDrugs]);

  const drug = currentDrug;
  const maxQty = drug?.max_quantity_per_order || 10;
  const dosageForm = drug ? (typeof drug.dosage_form === 'object' ? drug.dosage_form?.name : drug.dosage_form) : '';
  const drugImage = drug ? getDrugImage(drug) : null;
  const drugPrice = drug ? getDrugPrice(drug) : 0;

  const handleAddToCart = () => {
    if (!drug) return;
    for (let i = 0; i < quantity; i++) {
      addToCart(drug);
    }
    Alert.alert(
      'Added to Cart',
      `${quantity}x ${drug.name} added to your cart.`,
      [{text: 'Continue Shopping'}, {text: 'View Cart', onPress: () => navigation.navigate('Cart')}],
    );
    setQuantity(1);
  };

  const handleSimilarPress = (d: Drug) => {
    navigation.push('DrugDetail', {drugId: d._id});
  };

  if (catalogLoading && !drug) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header title="Drug Detail" onBack={() => navigation.goBack()} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!drug) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header title="Drug Detail" onBack={() => navigation.goBack()} />
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-muted-foreground">Drug not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header
        title={drug.name}
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={() => navigation.navigate('Cart')}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <ShoppingCart size={22} color={colors.foreground} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-32"
        showsVerticalScrollIndicator={false}>
        {/* Image */}
        {drugImage ? (
          <Image
            source={{uri: drugImage}}
            className="w-full h-56"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-56 bg-muted items-center justify-center">
            <Pill size={56} color={colors.mutedForeground} />
          </View>
        )}

        {/* Info Card */}
        <View className="bg-card border border-border rounded-2xl mx-5 mt-4 p-4">
          <Text className="text-lg font-bold text-foreground">{drug.name}</Text>
          {drug.generic_name && (
            <Text className="text-sm text-muted-foreground">{drug.generic_name}</Text>
          )}
          <Text className="text-xs text-muted-foreground mt-1">
            {[drug.strength, dosageForm].filter(Boolean).join(' · ')}
          </Text>
          {drug.manufacturer && (
            <Text className="text-xs text-muted-foreground mt-0.5">
              Manufacturer: {drug.manufacturer}
            </Text>
          )}

          <View className="flex-row items-center justify-between mt-3">
            <Text className="text-xl font-bold text-primary">
              {format(drugPrice)}
            </Text>
            {(drug.is_available !== false && drug.is_active !== false) ? (
              <Text className="text-xs text-success font-medium">In Stock</Text>
            ) : (
              <Text className="text-xs text-destructive font-medium">Out of Stock</Text>
            )}
          </View>
        </View>

        {/* Rx Warning */}
        {drug.requires_prescription && (
          <View className="mx-5 mt-3 bg-secondary/10 border border-secondary/30 rounded-2xl p-3 flex-row items-center">
            <ShieldAlert size={18} color={colors.secondary} />
            <Text className="text-sm text-secondary ml-2 flex-1">
              This drug requires a prescription from a licensed physician.
            </Text>
          </View>
        )}

        {/* Description */}
        {drug.description && (
          <View className="mx-5 mt-4">
            <Text className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-1">
              Description
            </Text>
            <Text className="text-sm text-muted-foreground leading-5">
              {drug.description}
            </Text>
          </View>
        )}

        {/* Quantity Selector */}
        {drug.is_available !== false && drug.is_active && !drug.requires_prescription && (
          <View className="mx-5 mt-4">
            <Text className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-2">
              Quantity
            </Text>
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl bg-card border border-border items-center justify-center"
                activeOpacity={0.7}>
                <Minus size={18} color={colors.foreground} />
              </TouchableOpacity>
              <Text className="text-lg font-bold text-foreground mx-5 min-w-[30px] text-center">
                {quantity}
              </Text>
              <TouchableOpacity
                onPress={() => setQuantity(q => Math.min(maxQty, q + 1))}
                className="w-10 h-10 rounded-xl bg-card border border-border items-center justify-center"
                activeOpacity={0.7}>
                <Plus size={18} color={colors.foreground} />
              </TouchableOpacity>
              <Text className="text-xs text-muted-foreground ml-3">
                Max {maxQty} per order
              </Text>
            </View>
          </View>
        )}

        {/* Collapsible Safety Sections */}
        <View className="mx-5 mt-4 bg-card border border-border rounded-2xl overflow-hidden">
          <CollapsibleSection
            title="Warnings"
            items={drug.warnings || []}
            icon={<AlertTriangle size={16} color={colors.secondary} />}
          />
          <CollapsibleSection
            title="Side Effects"
            items={drug.side_effects || []}
            icon={<Info size={16} color={colors.primary} />}
          />
          <CollapsibleSection
            title="Contraindications"
            items={drug.contraindications || []}
            icon={<ShieldAlert size={16} color={colors.destructive} />}
          />
        </View>

        {/* Similar Drugs */}
        {similarDrugs.length > 0 && (
          <View className="mt-6">
            <Text className="text-base font-bold text-foreground px-5 mb-3">
              Similar Drugs
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{paddingHorizontal: 20}}>
              {similarDrugs.map(d => (
                <DrugCard key={d._id} drug={d} variant="compact" onPress={handleSimilarPress} />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Bar */}
      {drug.is_available !== false && drug.is_active && !drug.requires_prescription && (
        <View className="absolute bottom-0 left-0 right-0 bg-background border-t border-border px-5 pt-3 pb-8 flex-row items-center">
          <View className="flex-1">
            <Text className="text-xs text-muted-foreground">Total</Text>
            <Text className="text-lg font-bold text-primary">
              {format(drugPrice * quantity)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleAddToCart}
            className="bg-primary rounded-2xl px-6 py-3.5 flex-row items-center"
            activeOpacity={0.8}>
            <ShoppingCart size={18} color="#fff" />
            <Text className="text-white font-bold text-base ml-2">Add to Cart</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
