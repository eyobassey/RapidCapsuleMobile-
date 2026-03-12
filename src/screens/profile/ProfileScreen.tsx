import { useNavigation } from '@react-navigation/native';
import {
  Bell,
  Calendar,
  Check,
  ChevronRight,
  ClipboardList,
  DollarSign,
  Edit3,
  FileText,
  HelpCircle,
  Info,
  LogOut,
  Pill,
  Shield,
  Wallet,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, ListItem } from '../../components/ui';
import { Text } from '../../components/ui/Text';
import { useAuthStore } from '../../store/auth';
import { useCurrencyStore } from '../../store/currency';
import { colors } from '../../theme/colors';
import { CURRENCY_LIST, SUPPORTED_CURRENCIES } from '../../utils/currency';
import { formatDate } from '../../utils/formatters';

interface MenuSection {
  title: string;
  items: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showChevron?: boolean;
    textColor?: string;
  }[];
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const currencyCode = useCurrencyStore((s) => s.currencyCode);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const currentCurrency = SUPPORTED_CURRENCIES[currencyCode] ?? SUPPORTED_CURRENCIES.USD;

  const firstName = user?.profile?.first_name || 'User';
  const lastName = user?.profile?.last_name || '';
  const email = user?.email || '';
  const profileImage = user?.profile?.profile_photo || user?.profile?.profile_image;
  const memberSince = (user as any)?.created_at ? formatDate((user as any).created_at) : '';

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const sections: MenuSection[] = [
    {
      title: 'Health',
      items: [
        {
          icon: <Pill size={20} color={colors.primary} />,
          title: 'Prescriptions',
          subtitle: 'View your prescriptions',
          onPress: () => navigation.navigate('PrescriptionsList'),
        },
        {
          icon: <ClipboardList size={20} color={colors.secondary} />,
          title: 'Order History',
          subtitle: 'Track your pharmacy orders',
          onPress: () => navigation.navigate('Pharmacy' as any, { screen: 'MyOrders' }),
        },
        {
          icon: <FileText size={20} color={colors.accent} />,
          title: 'Health Records',
          subtitle: 'Medical history & reports',
          onPress: () => navigation.navigate('HealthRecords'),
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          icon: <Wallet size={20} color={colors.success} />,
          title: 'Wallet & Billing',
          subtitle: 'Balance, transactions & payments',
          onPress: () => navigation.navigate('Wallet'),
        },
        {
          icon: <DollarSign size={20} color={colors.primary} />,
          title: 'Currency',
          subtitle: `${currentCurrency.flag} ${currentCurrency.name} (${currentCurrency.symbol})`,
          onPress: () => setShowCurrencyModal(true),
        },
        {
          icon: <Bell size={20} color={colors.secondary} />,
          title: 'Notification Preferences',
          subtitle: 'Manage your alerts',
          onPress: () => navigation.navigate('Settings'),
        },
        {
          icon: <Shield size={20} color={colors.accent} />,
          title: 'Security',
          subtitle: 'Password & two-factor auth',
          onPress: () => navigation.navigate('Settings'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: <HelpCircle size={20} color={colors.primary} />,
          title: 'Help & Support',
          subtitle: 'FAQs, contact us',
          onPress: () => {},
        },
        {
          icon: <Info size={20} color={colors.mutedForeground} />,
          title: 'About RapidCapsule',
          subtitle: 'Version 2.1.0',
          onPress: () => {},
        },
      ],
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-28"
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View className="items-center pt-8 pb-6 px-5">
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('EditProfile')}>
            <Avatar uri={profileImage} firstName={firstName} lastName={lastName} size="lg" />
          </TouchableOpacity>

          <Text className="text-xl font-bold text-foreground mt-4">
            {firstName} {lastName}
          </Text>
          <Text className="text-sm text-muted-foreground mt-0.5">{email}</Text>

          {memberSince ? (
            <View className="flex-row items-center gap-1.5">
              <Calendar size={12} color={colors.mutedForeground} />
              <Text className="text-xs text-muted-foreground">Member since {memberSince}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
            onPress={() => navigation.navigate('EditProfile')}
            className="mt-4 bg-card border border-border rounded-full px-5 py-2 flex-row items-center gap-2"
          >
            <Edit3 size={14} color={colors.primary} />
            <Text className="text-sm font-medium text-primary">Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Sections */}
        {sections.map((section) => (
          <View key={section.title}>
            <Text className="text-xs text-muted-foreground uppercase tracking-wider px-5 pt-6 pb-2 font-semibold">
              {section.title}
            </Text>
            <View className="mx-5 bg-card border border-border rounded-2xl overflow-hidden">
              {section.items.map((item) => (
                <ListItem
                  key={item.title}
                  icon={
                    <View className="w-9 h-9 rounded-full bg-muted items-center justify-center">
                      {item.icon}
                    </View>
                  }
                  title={item.title}
                  subtitle={item.subtitle}
                  onPress={item.onPress}
                  showChevron
                />
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <View className="mx-5 mt-8">
          <TouchableOpacity
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            onPress={handleLogout}
            className="bg-card border border-border rounded-2xl overflow-hidden"
          >
            <View className="flex-row items-center p-4">
              <View className="w-9 h-9 rounded-full bg-destructive/10 items-center justify-center mr-3">
                <LogOut size={20} color={colors.destructive} />
              </View>
              <Text className="flex-1 font-medium text-destructive">Sign Out</Text>
              <ChevronRight size={16} color={colors.destructive} />
            </View>
          </TouchableOpacity>
        </View>

        <View className="h-8" />
      </ScrollView>

      {/* Currency Selector Modal */}
      <Modal
        visible={showCurrencyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCurrencyModal(false)}
      >
        <Pressable
          onPress={() => setShowCurrencyModal(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: 40,
            }}
          >
            {/* Handle */}
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
              <View
                style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }}
              />
            </View>

            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: colors.foreground,
                paddingHorizontal: 20,
                paddingBottom: 16,
              }}
            >
              Select Currency
            </Text>

            {CURRENCY_LIST.map((cur) => {
              const isSelected = cur.code === currencyCode;
              return (
                <TouchableOpacity
                  key={cur.code}
                  activeOpacity={0.7}
                  accessibilityRole="radio"
                  accessibilityLabel={`${cur.name} ${cur.code}`}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => {
                    setCurrency(cur.code);
                    setShowCurrencyModal(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    backgroundColor: isSelected ? `${colors.primary}10` : 'transparent',
                  }}
                >
                  <Text style={{ fontSize: 24, marginRight: 12 }}>{cur.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}>
                      {cur.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                      {cur.code} ({cur.symbol})
                    </Text>
                  </View>
                  {isSelected && <Check size={20} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
