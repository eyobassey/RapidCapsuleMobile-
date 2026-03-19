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
  Gift,
  HeartPulse,
  HelpCircle,
  Info,
  LogOut,
  Pill,
  Shield,
  ShieldCheck,
  Wallet,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import DeviceInfo from 'react-native-device-info';
import { Avatar, KeyboardSheet } from '../../components/ui';
import { Text } from '../../components/ui/Text';
import { useAppointmentsQuery } from '../../hooks/queries/useAppointmentsQuery';
import { useHealthScoreQuery } from '../../hooks/queries/useHealthScoreQuery';
import { useWalletBalanceQuery } from '../../hooks/queries/useWalletQuery';
import { useCurrency } from '../../hooks/useCurrency';
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

  const { format } = useCurrency();
  const healthQuery = useHealthScoreQuery();
  const walletQuery = useWalletBalanceQuery();
  const appointmentsQuery = useAppointmentsQuery('upcoming');

  const firstName = user?.profile?.first_name || 'User';
  const lastName = user?.profile?.last_name || '';
  const email = user?.email || '';
  const profileImage = user?.profile?.profile_photo || user?.profile?.profile_image;
  const memberSince = (user as any)?.created_at ? formatDate((user as any).created_at) : '';

  const healthScore = healthQuery.data?.totalScore ?? healthQuery.data?.score ?? 0;
  const walletBalance = walletQuery.data?.currentBalance ?? walletQuery.data?.balance ?? 0;
  const upcomingCount = appointmentsQuery.data?.length ?? 0;

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
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={[`${colors.primary}10`, 'transparent']}
            style={styles.headerGradient}
          />
          <View style={styles.headerContent}>
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

            <View style={styles.headerInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {firstName} {lastName}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {email}
              </Text>
              {memberSince ? (
                <View style={styles.verifiedBadge}>
                  <ShieldCheck size={12} color={colors.success} strokeWidth={2.5} />
                  <Text style={styles.verifiedText}>Member since {memberSince}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.metricsContainer}>
            <View style={styles.metricCard}>
              <View
                style={[styles.metricIconContainer, { backgroundColor: `${colors.primary}15` }]}
              >
                <HeartPulse size={16} color={colors.primary} strokeWidth={2.5} />
              </View>
              <Text style={styles.metricLabel}>Health</Text>
              {healthQuery.isLoading ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 2 }} />
              ) : (
                <Text style={styles.metricValue}>{healthScore}</Text>
              )}
            </View>

            <View style={styles.metricCard}>
              <View
                style={[styles.metricIconContainer, { backgroundColor: `${colors.success}15` }]}
              >
                <Wallet size={16} color={colors.success} strokeWidth={2.5} />
              </View>
              <Text style={styles.metricLabel}>Credits</Text>
              <Text style={styles.metricValue}>
                {walletQuery.isLoading ? '...' : format(walletBalance)}
              </Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIconContainer, { backgroundColor: `${colors.accent}15` }]}>
                <Calendar size={16} color={colors.accent} strokeWidth={2.5} />
              </View>
              <Text style={styles.metricLabel}>Upcoming</Text>
              {appointmentsQuery.isLoading ? (
                <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 2 }} />
              ) : (
                <Text style={styles.metricValue}>{upcomingCount}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Menu Sections */}
        {sections.map((section) => (
          <View key={section.title} className="mt-6">
            <Text style={styles.sectionHeader}>{section.title}</Text>
            <View className="mx-4 mt-2 bg-card border border-border/40 rounded-[20px] overflow-hidden">
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.title}
                  activeOpacity={0.6}
                  onPress={item.onPress}
                  style={[styles.menuItem, !item.isLast && styles.menuItemBorder]}
                >
                  <View
                    style={{ backgroundColor: item.iconBg }}
                    className="w-10 h-10 rounded-[12px] items-center justify-center mr-4"
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

        {/* Action List Section (Logout) */}
        <View className="mx-4 mt-8">
          <TouchableOpacity activeOpacity={0.7} onPress={handleLogout} style={styles.logoutItem}>
            <View className="w-10 h-10 rounded-[12px] bg-destructive/10 items-center justify-center mr-4">
              <LogOut size={20} color={colors.destructive} />
            </View>
            <View className="flex-1">
              <Text style={styles.logoutText}>Sign Out</Text>
              <Text style={styles.logoutSubtitle}>Sign out of your account</Text>
            </View>
            <ChevronRight size={16} color={colors.destructive} opacity={0.4} />
          </TouchableOpacity>
        </View>

        <View className="items-center mt-8 mb-4">
          <Text style={styles.footerText}>RapidCapsule v{DeviceInfo.getVersion()}</Text>
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

          <View className="bg-background/40 rounded-[20px] border border-border/40 overflow-hidden mb-4">
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
  headerContainer: {
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
    height: 200,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.foreground,
    letterSpacing: -0.4,
  },
  userEmail: {
    fontSize: 13,
    color: colors.mutedForeground,
    fontWeight: '400',
    marginTop: 0,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.success,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  metricIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.foreground,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    paddingLeft: 24,
    opacity: 0.5,
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
    fontSize: 15,
    fontWeight: '500',
    color: colors.foreground,
    letterSpacing: -0.1,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
    fontWeight: '400',
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.1)',
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
    opacity: 0.2,
  },
});
