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
  ShieldCheck,
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
        {/* High-Fidelity Hero Card */}
        <View className="mx-4 mt-6">
          <View style={styles.heroWrapper}>
            <LinearGradient
              colors={[`${colors.primary}20`, `${colors.card}`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              {/* Inner Glossy Border */}
              <View style={styles.heroInnerBorder} />

              <View className="flex-row items-center">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('EditProfile')}
                  style={styles.avatarWrapper}
                >
                  <Avatar uri={profileImage} firstName={firstName} lastName={lastName} size="lg" />
                  <View style={styles.editBadge}>
                    <Edit3 size={10} color={colors.white} strokeWidth={2.5} />
                  </View>
                </TouchableOpacity>

                <View className="flex-1 ml-5">
                  <Text style={styles.userName} numberOfLines={1}>
                    {firstName} {lastName}
                  </Text>
                  <Text style={styles.userEmail} numberOfLines={1}>
                    {email}
                  </Text>
                  {memberSince ? (
                    <View style={styles.memberSinceRow}>
                      <ShieldCheck size={12} color={colors.success} strokeWidth={2.5} />
                      <Text style={styles.memberSinceText}>Verified • Since {memberSince}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Identity Metrics Row */}
              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Health Score</Text>
                  <View style={styles.metricValueRow}>
                    <HeartPulse size={14} color={colors.primary} strokeWidth={2.5} />
                    <Text style={styles.metricValue}>84</Text>
                  </View>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Currency</Text>
                  <Text style={styles.metricValue}>
                    {currentCurrency.symbol} {currentCurrency.code}
                  </Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Status</Text>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusText}>Active</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Menu Sections with Refined Spacing */}
        {sections.map((section) => (
          <View key={section.title} className="mt-8">
            <Text style={styles.sectionHeader}>{section.title}</Text>
            <View className="mx-4 mt-2 bg-card border border-border/40 rounded-[28px] overflow-hidden">
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.title}
                  activeOpacity={0.6}
                  onPress={item.onPress}
                  style={[styles.menuItem, !item.isLast && styles.menuItemBorder]}
                >
                  <View
                    style={{ backgroundColor: item.iconBg }}
                    className="w-10 h-10 rounded-[14px] items-center justify-center mr-4"
                  >
                    {item.icon}
                  </View>

                  <View className="flex-1">
                    <Text style={styles.menuItemTitle}>{item.title}</Text>
                    {item.subtitle ? (
                      <Text style={styles.menuItemSubtitle} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </View>

                  <ChevronRight size={16} color={colors.mutedForeground} opacity={0.4} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* High-Contrast Logout Action */}
        <View className="mx-4 mt-10 mb-4">
          <TouchableOpacity activeOpacity={0.7} onPress={handleLogout} style={styles.logoutButton}>
            <View className="w-10 h-10 rounded-[14px] bg-destructive/10 items-center justify-center mr-4">
              <LogOut size={20} color={colors.destructive} />
            </View>
            <View className="flex-1">
              <Text style={styles.logoutText}>Sign Out</Text>
              <Text style={styles.logoutSubtitle}>Safely end your current session</Text>
            </View>
            <ChevronRight size={16} color={colors.destructive} opacity={0.4} />
          </TouchableOpacity>
        </View>

        {/* Minimal Footer */}
        <View className="items-center mt-6 mb-8">
          <Text style={styles.footerText}>RapidCapsule Premium v{DeviceInfo.getVersion()}</Text>
        </View>
      </ScrollView>

      {/* Modern Currency Sheet */}
      <KeyboardSheet
        visible={showCurrencyModal}
        onClose={() => setShowCurrencyModal(false)}
        bottomPadding={Platform.OS === 'ios' ? 40 : 20}
      >
        <View className="px-5 pt-2">
          <View className="flex-row items-center mb-6">
            <View className="w-11 h-11 rounded-2xl bg-primary/10 items-center justify-center mr-4">
              <DollarSign size={22} color={colors.primary} />
            </View>
            <View>
              <Text className="text-xl font-bold text-foreground tracking-tight">
                Select Currency
              </Text>
              <Text className="text-sm text-muted-foreground mt-0.5">
                Choose your preferred display currency
              </Text>
            </View>
          </View>

          <View className="bg-background/40 rounded-[28px] border border-border/40 overflow-hidden mb-4">
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
                    !isLast ? 'border-b border-border/20' : ''
                  }`}
                  style={{ backgroundColor: isSelected ? `${colors.primary}08` : 'transparent' }}
                >
                  <View className="w-11 h-11 rounded-full bg-muted/50 items-center justify-center mr-4">
                    <Text style={{ fontSize: 24 }}>{cur.flag}</Text>
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-[16px] ${
                        isSelected ? 'font-bold text-primary' : 'font-semibold text-foreground'
                      }`}
                    >
                      {cur.name}
                    </Text>
                    <Text className="text-xs text-muted-foreground mt-0.5">
                      {cur.code} • {cur.symbol}
                    </Text>
                  </View>
                  {isSelected && (
                    <View className="bg-primary w-6 h-6 rounded-full items-center justify-center">
                      <Check size={14} color={colors.white} strokeWidth={3.5} />
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
  heroWrapper: {
    borderRadius: 32,
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  heroCard: {
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  heroInnerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    margin: 1,
  },
  avatarWrapper: {
    position: 'relative',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.primary,
    width: 24,
    height: 22,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.foreground,
    letterSpacing: -0.5,
  },
  userEmail: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: 2,
    fontWeight: '500',
  },
  memberSinceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  memberSinceText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricsRow: {
    flexDirection: 'row',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.foreground,
    marginLeft: 4,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statusPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.success,
    textTransform: 'uppercase',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    paddingLeft: 28,
    opacity: 0.6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    letterSpacing: -0.2,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
    fontWeight: '400',
  },
  logoutButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.2)',
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    shadowColor: colors.destructive,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.destructive,
  },
  logoutSubtitle: {
    fontSize: 11,
    color: colors.destructive,
    opacity: 0.6,
    marginTop: 1,
    fontWeight: '500',
  },
  footerText: {
    fontSize: 10,
    color: colors.mutedForeground,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    opacity: 0.3,
  },
});
