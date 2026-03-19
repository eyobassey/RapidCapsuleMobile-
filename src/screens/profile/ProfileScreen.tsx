import { useNavigation } from '@react-navigation/native';
import {
  Bell,
  Check,
  ChevronRight,
  ClipboardList,
  DollarSign,
  Edit3,
  FileText,
  Gift,
  HelpCircle,
  Info,
  LogOut,
  Pill,
  Shield,
  Wallet,
  Settings,
  ShieldCheck,
  CreditCard,
  HeartPulse,
} from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import { Alert, ScrollView, TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import DeviceInfo from 'react-native-device-info';
import { Avatar, KeyboardSheet } from '../../components/ui';
import { Text } from '../../components/ui/Text';
import { useAuthStore } from '../../store/auth';
import { useCurrencyStore } from '../../store/currency';
import { colors } from '../../theme/colors';
import { CURRENCY_LIST, SUPPORTED_CURRENCIES } from '../../utils/currency';
import { formatDate } from '../../utils/formatters';

function getAppVersionLabel(): string {
  const version = DeviceInfo.getVersion();
  const build = DeviceInfo.getBuildNumber();
  return build ? `${version} (${build})` : version;
}

interface MenuSection {
  title: string;
  items: {
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showChevron?: boolean;
    textColor?: string;
    isLast?: boolean;
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
  const appVersionLabel = getAppVersionLabel();

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

  const sections: MenuSection[] = useMemo(
    () => [
      {
        title: 'Health Journey',
        items: [
          {
            icon: <Pill size={18} color={colors.primary} />,
            iconBg: `${colors.primary}15`,
            title: 'Prescriptions',
            subtitle: 'Active meds & refills',
            onPress: () => navigation.navigate('PrescriptionsList'),
          },
          {
            icon: <ClipboardList size={18} color={colors.secondary} />,
            iconBg: `${colors.secondary}15`,
            title: 'Order History',
            subtitle: 'Pharmacy orders & tracking',
            onPress: () => navigation.navigate('Pharmacy' as any, { screen: 'MyOrders' }),
          },
          {
            icon: <FileText size={18} color={colors.accent} />,
            iconBg: `${colors.accent}15`,
            title: 'Health Records',
            subtitle: 'Lab results & medical reports',
            onPress: () => navigation.navigate('HealthRecords'),
            isLast: true,
          },
        ],
      },
      {
        title: 'Preferences & Billing',
        items: [
          {
            icon: <Wallet size={18} color={colors.success} />,
            iconBg: `${colors.success}15`,
            title: 'Wallet & Billing',
            subtitle: 'Payments & credits',
            onPress: () => navigation.navigate('Wallet'),
          },
          {
            icon: <DollarSign size={18} color={colors.primary} />,
            iconBg: `${colors.primary}15`,
            title: 'Display Currency',
            subtitle: `${currentCurrency.flag} ${currentCurrency.name} (${currentCurrency.code})`,
            onPress: () => setShowCurrencyModal(true),
          },
          {
            icon: <Bell size={18} color={colors.secondary} />,
            iconBg: `${colors.secondary}15`,
            title: 'Notifications',
            subtitle: 'Alerts & communications',
            onPress: () => navigation.navigate('NotificationPreferences'),
          },
          {
            icon: <Gift size={18} color="#f59e0b" />,
            iconBg: '#f59e0b15',
            title: 'Referrals & Rewards',
            subtitle: 'Invite friends, earn credits',
            onPress: () => navigation.navigate('ReferralRewards'),
          },
          {
            icon: <ShieldCheck size={18} color={colors.accent} />,
            iconBg: `${colors.accent}15`,
            title: 'Security Settings',
            subtitle: 'Two-factor auth & privacy',
            onPress: () => navigation.navigate('SecuritySettings'),
            isLast: true,
          },
        ],
      },
      {
        title: 'Support & Info',
        items: [
          {
            icon: <HelpCircle size={18} color={colors.primary} />,
            iconBg: `${colors.primary}15`,
            title: 'Help Center',
            subtitle: 'FAQs & technical support',
            onPress: () => {},
          },
          {
            icon: <FileText size={18} color={colors.mutedForeground} />,
            iconBg: `${colors.mutedForeground}15`,
            title: 'Terms & Conditions',
            onPress: () =>
              navigation.navigate('WebView', {
                title: 'Terms of Service',
                url: 'https://rapidcapsule.com/terms-of-service',
              }),
          },
          {
            icon: <Shield size={18} color={colors.mutedForeground} />,
            iconBg: `${colors.mutedForeground}15`,
            title: 'Privacy Policy',
            onPress: () =>
              navigation.navigate('WebView', {
                title: 'Privacy Policy',
                url: 'https://rapidcapsule.com/privacy-policy',
              }),
          },
          {
            icon: <Info size={18} color={colors.mutedForeground} />,
            iconBg: `${colors.mutedForeground}15`,
            title: 'About RapidCapsule',
            subtitle: `v${appVersionLabel}`,
            onPress: () => navigation.navigate('About'),
            isLast: true,
          },
        ],
      },
    ],
    [navigation, currentCurrency, appVersionLabel]
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-32"
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Header Design */}
        <View className="px-5 pt-6 pb-2">
          <LinearGradient
            colors={[`${colors.primary}15`, 'transparent']}
            className="rounded-[32px] p-6 border border-border/50"
          >
            <View className="flex-row items-center">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('EditProfile')}
                style={styles.avatarContainer}
              >
                <Avatar uri={profileImage} firstName={firstName} lastName={lastName} size="lg" />
                <View style={styles.editBadge}>
                  <Edit3 size={10} color={colors.white} />
                </View>
              </TouchableOpacity>

              <View className="flex-1 ml-4">
                <Text
                  className="text-2xl font-bold text-foreground leading-tight"
                  numberOfLines={1}
                >
                  {firstName} {lastName}
                </Text>
                <Text className="text-sm text-muted-foreground mt-0.5" numberOfLines={1}>
                  {email}
                </Text>
                {memberSince ? (
                  <View className="flex-row items-center mt-2 opacity-80">
                    <ShieldCheck size={12} color={colors.success} />
                    <Text className="text-[11px] font-semibold text-success ml-1 uppercase tracking-tighter">
                      Verified Member since {memberSince}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Quick Stats/Badges Row */}
            <View className="flex-row mt-6 pt-6 border-t border-border/30 justify-between">
              <View className="items-center flex-1 border-r border-border/30">
                <Text className="text-xs text-muted-foreground mb-1">Health Score</Text>
                <View className="flex-row items-center">
                  <HeartPulse size={14} color={colors.primary} />
                  <Text className="font-bold text-foreground ml-1">84</Text>
                </View>
              </View>
              <View className="items-center flex-1 border-r border-border/30">
                <Text className="text-xs text-muted-foreground mb-1">Currency</Text>
                <Text className="font-bold text-foreground">{currentCurrency.symbol}</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-xs text-muted-foreground mb-1">Account</Text>
                <View className="bg-success/20 px-2 py-0.5 rounded-full border border-success/30">
                  <Text className="text-[10px] font-bold text-success uppercase">Active</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Menu Sections */}
        {sections.map((section) => (
          <View key={section.title} className="mt-4">
            <Text className="text-[11px] text-muted-foreground uppercase tracking-[1.5px] px-7 mb-2 font-bold opacity-70">
              {section.title}
            </Text>
            <View className="mx-5 bg-card border border-border/60 rounded-[24px] overflow-hidden">
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.title}
                  activeOpacity={0.6}
                  onPress={item.onPress}
                  className={`flex-row items-center p-4 ${
                    !item.isLast ? 'border-b border-border/40' : ''
                  }`}
                >
                  <View
                    style={{ backgroundColor: item.iconBg }}
                    className="w-10 h-10 rounded-xl items-center justify-center mr-4"
                  >
                    {item.icon}
                  </View>

                  <View className="flex-1">
                    <Text className="text-[15px] font-semibold text-foreground">{item.title}</Text>
                    {item.subtitle ? (
                      <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </View>

                  <ChevronRight size={16} color={colors.mutedForeground} opacity={0.5} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Section */}
        <View className="mx-5 mt-8 mb-4">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleLogout}
            className="bg-card border border-border/60 rounded-2xl overflow-hidden"
          >
            <View className="flex-row items-center p-4">
              <View className="w-10 h-10 rounded-xl bg-destructive/10 items-center justify-center mr-4">
                <LogOut size={20} color={colors.destructive} />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-destructive">Sign Out</Text>
                <Text className="text-[11px] text-destructive/60 font-medium">
                  Log out of your account securely
                </Text>
              </View>
              <ChevronRight size={16} color={colors.destructive} opacity={0.5} />
            </View>
          </TouchableOpacity>
        </View>

        {/* App Version Footer */}
        <View className="items-center mt-4">
          <Text className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest">
            RapidCapsule v{DeviceInfo.getVersion()}
          </Text>
        </View>
      </ScrollView>

      {/* Premium Currency Selector */}
      <KeyboardSheet
        visible={showCurrencyModal}
        onClose={() => setShowCurrencyModal(false)}
        bottomPadding={Platform.OS === 'ios' ? 40 : 20}
      >
        <View className="px-5 pt-2">
          <View className="flex-row items-center mb-6">
            <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
              <DollarSign size={20} color={colors.primary} />
            </View>
            <View>
              <Text className="text-lg font-bold text-foreground">Select Currency</Text>
              <Text className="text-xs text-muted-foreground">
                Prices will be shown in your choice
              </Text>
            </View>
          </View>

          <View className="bg-background/50 rounded-2xl border border-border/50 overflow-hidden">
            {CURRENCY_LIST.map((cur, idx) => {
              const isSelected = cur.code === currencyCode;
              const isLast = idx === CURRENCY_LIST.length - 1;
              return (
                <TouchableOpacity
                  key={cur.code}
                  activeOpacity={0.7}
                  onPress={() => {
                    setCurrency(cur.code);
                    setShowCurrencyModal(false);
                  }}
                  className={`flex-row items-center p-4 ${
                    !isLast ? 'border-b border-border/30' : ''
                  }`}
                  style={{ backgroundColor: isSelected ? `${colors.primary}10` : 'transparent' }}
                >
                  <View className="w-10 h-10 rounded-full bg-muted items-center justify-center mr-4">
                    <Text className="text-lg">{cur.flag}</Text>
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-[15px] ${
                        isSelected ? 'font-bold text-primary' : 'font-semibold text-foreground'
                      }`}
                    >
                      {cur.name}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      {cur.code} ({cur.symbol})
                    </Text>
                  </View>
                  {isSelected && (
                    <View className="bg-primary rounded-full p-1">
                      <Check size={12} color={colors.white} strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </KeyboardSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    position: 'relative',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
