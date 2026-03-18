import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Fingerprint,
  Key,
  Lock,
  LogOut,
  Mail,
  MessageCircle,
  Monitor,
  RefreshCw,
  Shield,
  ShieldCheck,
  Smartphone,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '../../components/ui/Text';
import {
  useBiometricCredentialsQuery,
  useChangePasswordMutation,
  useDeleteBiometricMutation,
  useRevokeAllSessionsMutation,
  useRevokeSessionMutation,
  useSessionsQuery,
  useUpdateUserSettingsMutation,
  useUserSettingsQuery,
} from '../../hooks/queries/useSecurityQuery';
import { TwoFactorMedium, securityService } from '../../services/security.service';
import { colors } from '../../theme/colors';

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-xs text-muted-foreground uppercase tracking-wider px-5 pt-6 pb-2 font-semibold">
      {title}
    </Text>
  );
}

function ListRow({
  icon,
  label,
  subtitle,
  onPress,
  right,
  isLast = false,
  destructive = false,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  isLast?: boolean;
  destructive?: boolean;
}) {
  const inner = (
    <View
      className={`flex-row items-center p-4 bg-card ${!isLast ? 'border-b border-border' : ''}`}
    >
      <View className="w-9 h-9 rounded-full bg-muted items-center justify-center mr-3">{icon}</View>
      <View className="flex-1 mr-3">
        <Text
          className="font-medium text-sm"
          style={{ color: destructive ? colors.destructive : colors.foreground }}
        >
          {label}
        </Text>
        {subtitle ? (
          <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ?? (onPress ? <ChevronRight size={16} color={colors.mutedForeground} /> : null)}
    </View>
  );

  if (!onPress) return inner;
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {inner}
    </TouchableOpacity>
  );
}

function PasswordInput({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 12, color: colors.mutedForeground, marginBottom: 6 }}>{label}</Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.muted,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 14,
          paddingVertical: 12,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          placeholder={placeholder ?? label}
          placeholderTextColor={colors.mutedForeground}
          style={{ flex: 1, fontSize: 14, color: colors.foreground }}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity onPress={() => setVisible((v) => !v)} hitSlop={8} activeOpacity={0.7}>
          {visible ? (
            <EyeOff size={18} color={colors.mutedForeground} />
          ) : (
            <Eye size={18} color={colors.mutedForeground} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function BottomSheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: 40,
            maxHeight: '92%',
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <View
              style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }}
            />
          </View>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const TFA_METHODS: Array<{
  key: TwoFactorMedium;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
}> = [
  {
    key: 'EMAIL',
    label: 'Email',
    subtitle: 'Receive verification codes via email',
    icon: <Mail size={18} color={colors.primary} />,
  },
  {
    key: 'SMS',
    label: 'SMS',
    subtitle: 'Receive verification codes via SMS',
    icon: <MessageCircle size={18} color={colors.success} />,
  },
  {
    key: 'TOTP',
    label: 'Auth App',
    subtitle: 'Use an authenticator app like Google Authenticator',
    icon: <Shield size={18} color={colors.accent} />,
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SecuritySettingsScreen() {
  const navigation = useNavigation<any>();

  // ── TanStack queries ────────────────────────────────────────────────────────
  const sessionsQuery = useSessionsQuery();
  const userSettingsQuery = useUserSettingsQuery();
  const biometricsQuery = useBiometricCredentialsQuery();

  const revokeSession = useRevokeSessionMutation();
  const revokeAll = useRevokeAllSessionsMutation();
  const updateSettings = useUpdateUserSettingsMutation();
  const changePassword = useChangePasswordMutation();
  const deleteBiometric = useDeleteBiometricMutation();

  // ── Derived state from queries ──────────────────────────────────────────────
  const sessions = sessionsQuery.data;
  const settings = userSettingsQuery.data;
  const biometrics = biometricsQuery.data;

  const twoFactorEnabled = settings?.twoFA_auth ?? false;
  const twoFactorMedium: TwoFactorMedium = settings?.twoFA_medium ?? 'EMAIL';
  const whatsappEnabled = settings?.whatsapp_notifications ?? false;
  const biometricEnabled = biometrics?.isEnabled ?? false;

  const isLoading =
    sessionsQuery.isLoading && userSettingsQuery.isLoading && biometricsQuery.isLoading;

  // ── Sheet visibility ────────────────────────────────────────────────────────
  const [showPasswordSheet, setShowPasswordSheet] = useState(false);
  const [showTFASheet, setShowTFASheet] = useState(false);
  const [showTOTPSheet, setShowTOTPSheet] = useState(false);
  const [showSessionsSheet, setShowSessionsSheet] = useState(false);

  // ── Password form ───────────────────────────────────────────────────────────
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  // ── 2FA TOTP setup ──────────────────────────────────────────────────────────
  const [tfaCode, setTfaCode] = useState('');
  const [tfaSecret, setTfaSecret] = useState('');
  const [pendingMethod, setPendingMethod] = useState<TwoFactorMedium>('EMAIL');

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleChangePassword = useCallback(async () => {
    if (!currentPw || !newPw || !confirmPw) {
      Alert.alert('Missing fields', 'Please fill in all password fields.');
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert('Passwords do not match', 'New password and confirmation must match.');
      return;
    }
    if (newPw.length < 8) {
      Alert.alert('Too short', 'Password must be at least 8 characters.');
      return;
    }
    changePassword.mutate(
      { current_password: currentPw, new_password: newPw, confirm_password: confirmPw },
      {
        onSuccess: () => {
          setShowPasswordSheet(false);
          setCurrentPw('');
          setNewPw('');
          setConfirmPw('');
          Alert.alert('Password updated', 'Your password has been changed successfully.');
        },
        onError: (err: any) => {
          Alert.alert('Could not update password', err?.message ?? 'Please try again.');
        },
      }
    );
  }, [currentPw, newPw, confirmPw, changePassword]);

  const handleSelectTFAMethod = useCallback(
    async (method: TwoFactorMedium) => {
      setPendingMethod(method);
      if (!twoFactorEnabled) {
        if (method === 'TOTP') {
          try {
            const { secret } = await securityService.generate2FASecret();
            setTfaSecret(secret);
            setTfaCode('');
            setShowTOTPSheet(true);
          } catch {
            Alert.alert('Error', 'Could not generate 2FA secret. Please try again.');
          }
        } else {
          setTfaCode('');
          setShowTFASheet(true);
        }
      } else {
        // Already enabled — switch method
        updateSettings.mutate(
          { twoFA_medium: method },
          {
            onError: (err: any) =>
              Alert.alert('Error', err?.message ?? 'Could not update 2FA method.'),
          }
        );
      }
    },
    [twoFactorEnabled, updateSettings]
  );

  const handleVerifyAndEnable = useCallback(async () => {
    if (!tfaCode || tfaCode.length < 6) {
      Alert.alert('Enter code', 'Please enter the 6-digit verification code.');
      return;
    }
    try {
      await securityService.enable2FA(tfaCode);
      updateSettings.mutate(
        { twoFA_auth: true, twoFA_medium: pendingMethod },
        {
          onSettled: () => {
            setShowTFASheet(false);
            setShowTOTPSheet(false);
            setTfaCode('');
          },
        }
      );
    } catch (err: any) {
      Alert.alert('Invalid code', err?.message ?? 'Please check the code and try again.');
    }
  }, [tfaCode, pendingMethod, updateSettings]);

  const handleToggle2FA = useCallback(
    (enabled: boolean) => {
      updateSettings.mutate(
        { twoFA_auth: enabled },
        {
          onError: (err: any) =>
            Alert.alert('Error', err?.message ?? 'Could not update 2FA setting.'),
        }
      );
    },
    [updateSettings]
  );

  const handleToggleWhatsApp = useCallback(
    (enabled: boolean) => {
      updateSettings.mutate(
        { whatsapp_notifications: enabled },
        {
          onError: (err: any) =>
            Alert.alert('Error', err?.message ?? 'Could not update WhatsApp setting.'),
        }
      );
    },
    [updateSettings]
  );

  const handleRevokeSession = useCallback(
    (sessionId: string, deviceName: string) => {
      Alert.alert('Sign out device', `Sign out "${deviceName}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            revokeSession.mutate(sessionId, {
              onError: () =>
                Alert.alert('Error', 'Could not revoke this session. Please try again.'),
            });
          },
        },
      ]);
    },
    [revokeSession]
  );

  const handleRevokeAll = useCallback(() => {
    const othersCount = sessions?.others.length ?? 0;
    Alert.alert(
      'Sign out all other devices',
      `This will sign out ${othersCount} other active session${
        othersCount === 1 ? '' : 's'
      }. You will remain logged in here.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out All',
          style: 'destructive',
          onPress: () => {
            revokeAll.mutate(undefined, {
              onError: () => Alert.alert('Error', 'Could not revoke sessions. Please try again.'),
            });
          },
        },
      ]
    );
  }, [revokeAll, sessions?.others.length]);

  const handleBiometricToggle = useCallback(() => {
    if (biometricEnabled) {
      Alert.alert('Remove biometric login', 'Remove Face ID / fingerprint from this device?', [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const first = biometrics?.credentials[0];
            if (!first) return;
            deleteBiometric.mutate(first.credentialId, {
              onError: () => Alert.alert('Error', 'Could not remove biometric credentials.'),
            });
          },
        },
      ]);
    } else {
      Alert.alert('Set Up Biometric Login', 'Set up Face ID or fingerprint to sign in quickly.', [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Set Up',
          onPress: () =>
            Alert.alert(
              'Coming soon',
              'Biometric registration will be available in the next update.'
            ),
        },
      ]);
    }
  }, [biometricEnabled, biometrics, deleteBiometric]);

  // ── Loading state ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="h-14 bg-card border-b border-border flex-row items-center px-4 gap-3">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-9 h-9 rounded-xl bg-background border border-border items-center justify-center"
          >
            <ArrowLeft size={18} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="flex-1 text-base font-bold text-foreground">Security Settings</Text>
        </View>
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-sm text-muted-foreground">Loading security settings…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────

  const otherSessionCount = sessions?.others.length ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="h-14 bg-card border-b border-border flex-row items-center px-4 gap-3">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="w-9 h-9 rounded-xl bg-background border border-border items-center justify-center"
        >
          <ArrowLeft size={18} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="flex-1 text-base font-bold text-foreground">Security Settings</Text>
        {(updateSettings.isPending || revokeSession.isPending || revokeAll.isPending) && (
          <ActivityIndicator size="small" color={colors.primary} />
        )}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-16"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Status banner ── */}
        <View className="mx-5 mt-5 bg-card border border-border rounded-2xl overflow-hidden">
          <View className="p-4 flex-row items-center gap-4">
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                backgroundColor: twoFactorEnabled ? `${colors.success}20` : `${colors.secondary}20`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={24} color={twoFactorEnabled ? colors.success : colors.secondary} />
            </View>
            <View className="flex-1">
              <Text className="text-foreground font-semibold text-base">
                {twoFactorEnabled ? 'Account Protected' : 'Improve Your Security'}
              </Text>
              <Text className="text-muted-foreground text-xs mt-0.5">
                {twoFactorEnabled
                  ? `2FA active · ${sessions?.all.length ?? 0} device${
                      sessions?.all.length === 1 ? '' : 's'
                    } logged in`
                  : 'Enable 2FA for stronger account protection'}
              </Text>
            </View>
            {twoFactorEnabled && (
              <View
                style={{
                  backgroundColor: `${colors.success}20`,
                  borderRadius: 20,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderWidth: 1,
                  borderColor: `${colors.success}40`,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.success }}>
                  Enabled
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Password ── */}
        <SectionHeader title="Password" />
        <View className="mx-5 bg-card border border-border rounded-2xl overflow-hidden">
          <ListRow
            icon={<Lock size={18} color={colors.primary} />}
            label="Change Password"
            subtitle="Update your account password"
            onPress={() => setShowPasswordSheet(true)}
            isLast
          />
        </View>

        {/* ── Two-Factor Authentication ── */}
        <SectionHeader title="Two-Factor Authentication" />
        <View className="mx-5 bg-card border border-border rounded-2xl overflow-hidden">
          {/* Master toggle row */}
          <View className="flex-row items-center p-4 border-b border-border">
            <View className="w-9 h-9 rounded-full bg-muted items-center justify-center mr-3">
              <ShieldCheck
                size={18}
                color={twoFactorEnabled ? colors.success : colors.mutedForeground}
              />
            </View>
            <View className="flex-1 mr-3">
              <Text className="text-foreground font-medium text-sm">Two-Factor Authentication</Text>
              <Text className="text-xs text-muted-foreground mt-0.5">
                {twoFactorEnabled
                  ? `Active · ${TFA_METHODS.find((m) => m.key === twoFactorMedium)?.label}`
                  : 'Adds an extra layer of security'}
              </Text>
            </View>
            <Switch
              value={twoFactorEnabled}
              onValueChange={handleToggle2FA}
              trackColor={{ false: colors.border, true: `${colors.success}80` }}
              thumbColor={twoFactorEnabled ? colors.success : colors.mutedForeground}
              style={{ alignSelf: 'center' }}
              accessibilityLabel="Toggle two-factor authentication"
              accessibilityRole="switch"
              accessibilityState={{ checked: twoFactorEnabled }}
            />
          </View>

          {/* Method rows */}
          {TFA_METHODS.map((method, i) => {
            const isActive = twoFactorEnabled && twoFactorMedium === method.key;
            return (
              <TouchableOpacity
                key={method.key}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Use ${method.label} for two-factor authentication`}
                onPress={() => handleSelectTFAMethod(method.key)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  backgroundColor: isActive ? `${colors.primary}0a` : 'transparent',
                  borderBottomWidth: i < TFA_METHODS.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <View className="w-9 h-9 rounded-full bg-muted items-center justify-center mr-3">
                  {method.icon}
                </View>
                <View className="flex-1 mr-3">
                  <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground }}>
                    {method.label}
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-0.5">{method.subtitle}</Text>
                </View>
                {isActive ? (
                  <CheckCircle2 size={18} color={colors.success} />
                ) : (
                  <ChevronRight size={16} color={colors.mutedForeground} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── WhatsApp Notifications ── */}
        <SectionHeader title="WhatsApp Notifications" />
        <View className="mx-5 bg-card border border-border rounded-2xl overflow-hidden">
          <View className="flex-row items-center p-4">
            <View className="w-9 h-9 rounded-full bg-muted items-center justify-center mr-3">
              <Bell size={18} color={colors.success} />
            </View>
            <View className="flex-1 mr-3">
              <Text className="text-foreground font-medium text-sm">
                Enable WhatsApp Notifications
              </Text>
              <Text className="text-xs text-muted-foreground mt-0.5">
                Appointment reminders, prescription updates & health tips
              </Text>
            </View>
            <Switch
              value={whatsappEnabled}
              onValueChange={handleToggleWhatsApp}
              trackColor={{ false: colors.border, true: `${colors.success}80` }}
              thumbColor={whatsappEnabled ? colors.success : colors.mutedForeground}
              style={{ alignSelf: 'center' }}
              accessibilityLabel="Toggle WhatsApp notifications"
              accessibilityRole="switch"
              accessibilityState={{ checked: whatsappEnabled }}
            />
          </View>
        </View>

        {/* ── Biometric Login ── */}
        <SectionHeader title="Biometric Login" />
        <View className="mx-5 bg-card border border-border rounded-2xl overflow-hidden">
          <ListRow
            icon={
              <Fingerprint size={18} color={biometricEnabled ? colors.success : colors.accent} />
            }
            label={biometricEnabled ? 'Biometric Login Enabled' : 'Set Up Biometric Login'}
            subtitle={
              biometricEnabled
                ? 'Face ID or fingerprint is set up on this device'
                : 'Sign in using Face ID or fingerprint'
            }
            onPress={handleBiometricToggle}
            isLast
            right={
              deleteBiometric.isPending ? (
                <ActivityIndicator size="small" color={colors.destructive} />
              ) : biometricEnabled ? (
                <CheckCircle2 size={18} color={colors.success} />
              ) : (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.primary,
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    gap: 4,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.white }}>
                    Set Up
                  </Text>
                  <ArrowRight size={12} color={colors.white} />
                </View>
              )
            }
          />
        </View>

        {/* ── Active Sessions ── */}
        <SectionHeader title="Active Sessions" />
        <View className="mx-5 bg-card border border-border rounded-2xl overflow-hidden">
          {/* Summary row */}
          <View className="flex-row items-center p-4 border-b border-border">
            <View className="w-9 h-9 rounded-full bg-muted items-center justify-center mr-3">
              <Monitor size={18} color={colors.accent} />
            </View>
            <View className="flex-1">
              <Text className="text-foreground font-medium text-sm">
                {sessions?.all.length ?? 0} device{sessions?.all.length === 1 ? '' : 's'} logged in
              </Text>
              <Text className="text-xs text-muted-foreground mt-0.5">Including this device</Text>
            </View>
            {sessionsQuery.isFetching && !sessionsQuery.isLoading && (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
            )}
            {otherSessionCount > 0 && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowSessionsSheet(true)}
                accessibilityRole="button"
                accessibilityLabel="View all sessions"
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>
                  View all
                </Text>
                <ChevronRight size={14} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Current device */}
          {sessions?.current ? (
            <View className="flex-row items-center p-4 border-b border-border">
              <View className="w-9 h-9 rounded-full bg-muted items-center justify-center mr-3">
                <Smartphone size={16} color={colors.primary} />
              </View>
              <View className="flex-1 mr-2">
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}
                >
                  <Text className="text-sm font-medium text-foreground">
                    {sessions.current.deviceName}
                  </Text>
                  <View
                    style={{
                      backgroundColor: `${colors.primary}20`,
                      borderRadius: 10,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                    }}
                  >
                    <Text style={{ fontSize: 9, fontWeight: '700', color: colors.primary }}>
                      THIS DEVICE
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-muted-foreground mt-0.5">
                  {relativeTime(sessions.current.lastActiveAt)}
                  {sessions.current.location ? ` · ${sessions.current.location}` : ''}
                </Text>
              </View>
              <CheckCircle2 size={16} color={colors.success} />
            </View>
          ) : null}

          {/* Sign out all others */}
          {otherSessionCount > 0 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleRevokeAll}
              accessibilityRole="button"
              accessibilityLabel="Sign out all other devices"
              className="flex-row items-center p-4"
            >
              <View className="w-9 h-9 rounded-full bg-muted items-center justify-center mr-3">
                {revokeAll.isPending ? (
                  <ActivityIndicator size="small" color={colors.destructive} />
                ) : (
                  <LogOut size={16} color={colors.destructive} />
                )}
              </View>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: colors.destructive }}>
                Sign out {otherSessionCount} other device{otherSessionCount === 1 ? '' : 's'}
              </Text>
              <ChevronRight size={16} color={colors.destructive} />
            </TouchableOpacity>
          )}

          {sessions?.all.length === 0 && (
            <View className="p-4">
              <Text className="text-sm text-muted-foreground text-center">
                No active sessions found
              </Text>
            </View>
          )}
        </View>

        {/* ── Password tip ── */}
        <View className="mx-5 mt-4 flex-row items-start gap-2.5 bg-muted/50 border border-border rounded-2xl p-4">
          <Key size={15} color={colors.mutedForeground} style={{ marginTop: 1 }} />
          <Text className="flex-1 text-xs text-muted-foreground leading-5">
            Use at least 8 characters including numbers and symbols. Never reuse passwords across
            different services.
          </Text>
        </View>
      </ScrollView>

      {/* ════════════════════════════════════════════════════════
          Change Password Sheet
      ════════════════════════════════════════════════════════ */}
      <BottomSheet visible={showPasswordSheet} onClose={() => setShowPasswordSheet(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={40}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16 }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: `${colors.primary}20`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Lock size={18} color={colors.primary} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground }}>
                Change Password
              </Text>
            </View>

            <PasswordInput label="Current password" value={currentPw} onChangeText={setCurrentPw} />
            <PasswordInput
              label="New password"
              value={newPw}
              onChangeText={setNewPw}
              placeholder="Min. 8 characters"
            />
            <PasswordInput
              label="Confirm new password"
              value={confirmPw}
              onChangeText={setConfirmPw}
            />

            <View style={{ gap: 6, marginBottom: 20 }}>
              {[
                'At least 8 characters',
                'Include numbers and symbols',
                "Don't reuse passwords",
              ].map((rule) => (
                <View key={rule} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Check size={13} color={colors.success} />
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }}>{rule}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleChangePassword}
              disabled={changePassword.isPending}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                opacity: changePassword.isPending ? 0.7 : 1,
              }}
            >
              {changePassword.isPending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Lock size={16} color={colors.white} />
              )}
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.white }}>
                {changePassword.isPending ? 'Updating…' : 'Update Password'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </BottomSheet>

      {/* ════════════════════════════════════════════════════════
          2FA Code Verification Sheet (Email / SMS)
      ════════════════════════════════════════════════════════ */}
      <BottomSheet visible={showTFASheet} onClose={() => setShowTFASheet(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={40}
        >
          <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16 }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: `${colors.accent}20`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheck size={18} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground }}>
                  Enable 2FA via {TFA_METHODS.find((m) => m.key === pendingMethod)?.label}
                </Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
                  Enter the 6-digit code sent to your{' '}
                  {pendingMethod === 'EMAIL' ? 'email' : 'phone'}
                </Text>
              </View>
            </View>

            <TextInput
              value={tfaCode}
              onChangeText={(v) => setTfaCode(v.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              placeholder="000000"
              placeholderTextColor={colors.mutedForeground}
              maxLength={6}
              style={{
                backgroundColor: colors.muted,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 24,
                fontWeight: '700',
                color: colors.foreground,
                textAlign: 'center',
                letterSpacing: 8,
                marginBottom: 16,
              }}
            />

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleVerifyAndEnable}
              disabled={updateSettings.isPending}
              style={{
                backgroundColor: colors.accent,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                opacity: updateSettings.isPending ? 0.7 : 1,
                marginBottom: 8,
              }}
            >
              {updateSettings.isPending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <ShieldCheck size={16} color={colors.white} />
              )}
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.white }}>
                {updateSettings.isPending ? 'Verifying…' : 'Verify & Enable'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </BottomSheet>

      {/* ════════════════════════════════════════════════════════
          TOTP Auth App Setup Sheet
      ════════════════════════════════════════════════════════ */}
      <BottomSheet visible={showTOTPSheet} onClose={() => setShowTOTPSheet(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={40}
        >
          <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16 }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: `${colors.accent}20`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Smartphone size={18} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground }}>
                  Authenticator App
                </Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
                  Add this key in Google Authenticator, Authy, or 1Password
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: colors.muted,
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 11, color: colors.mutedForeground, marginBottom: 6 }}>
                Manual entry key
              </Text>
              <Text
                selectable
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: colors.foreground,
                  letterSpacing: 2,
                  fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                }}
              >
                {tfaSecret}
              </Text>
            </View>

            <Text style={{ fontSize: 12, color: colors.mutedForeground, marginBottom: 8 }}>
              Enter the 6-digit code from your app to verify
            </Text>

            <TextInput
              value={tfaCode}
              onChangeText={(v) => setTfaCode(v.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              placeholder="000000"
              placeholderTextColor={colors.mutedForeground}
              maxLength={6}
              style={{
                backgroundColor: colors.muted,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 24,
                fontWeight: '700',
                color: colors.foreground,
                textAlign: 'center',
                letterSpacing: 8,
                marginBottom: 16,
              }}
            />

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleVerifyAndEnable}
              disabled={updateSettings.isPending}
              style={{
                backgroundColor: colors.accent,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                opacity: updateSettings.isPending ? 0.7 : 1,
                marginBottom: 8,
              }}
            >
              {updateSettings.isPending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <ShieldCheck size={16} color={colors.white} />
              )}
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.white }}>
                {updateSettings.isPending ? 'Verifying…' : 'Verify & Enable'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </BottomSheet>

      {/* ════════════════════════════════════════════════════════
          All Sessions Sheet
      ════════════════════════════════════════════════════════ */}
      <BottomSheet visible={showSessionsSheet} onClose={() => setShowSessionsSheet(false)}>
        <View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground }}>
                Active Sessions
              </Text>
              <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
                {sessions?.all.length ?? 0} device{sessions?.all.length === 1 ? '' : 's'} logged in
              </Text>
            </View>
            {otherSessionCount > 0 && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setShowSessionsSheet(false);
                  setTimeout(handleRevokeAll, 300);
                }}
                style={{
                  backgroundColor: `${colors.destructive}15`,
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderWidth: 1,
                  borderColor: `${colors.destructive}30`,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {revokeAll.isPending ? (
                  <ActivityIndicator size="small" color={colors.destructive} />
                ) : (
                  <RefreshCw size={12} color={colors.destructive} />
                )}
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.destructive }}>
                  Logout All Others
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
            {(sessions?.all ?? []).map((session, i) => (
              <View
                key={session._id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  paddingVertical: 14,
                  borderBottomWidth: i < (sessions?.all.length ?? 0) - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                  backgroundColor: session.isCurrent ? `${colors.primary}08` : 'transparent',
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: colors.muted,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  {session.deviceType === 'mobile' ? (
                    <Smartphone
                      size={16}
                      color={session.isCurrent ? colors.primary : colors.mutedForeground}
                    />
                  ) : (
                    <Monitor
                      size={16}
                      color={session.isCurrent ? colors.primary : colors.mutedForeground}
                    />
                  )}
                </View>

                <View style={{ flex: 1, marginRight: 8 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Text
                      style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}
                      numberOfLines={1}
                    >
                      {session.deviceName}
                    </Text>
                    {session.isCurrent && (
                      <View
                        style={{
                          backgroundColor: `${colors.primary}20`,
                          borderRadius: 8,
                          paddingHorizontal: 5,
                          paddingVertical: 1,
                        }}
                      >
                        <Text style={{ fontSize: 9, fontWeight: '700', color: colors.primary }}>
                          THIS DEVICE
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>
                    {relativeTime(session.lastActiveAt)}
                    {session.location ? ` · ${session.location}` : ''}
                  </Text>
                </View>

                {!session.isCurrent && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleRevokeSession(session._id, session.deviceName)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Sign out ${session.deviceName}`}
                  >
                    {revokeSession.isPending && revokeSession.variables === session._id ? (
                      <ActivityIndicator size="small" color={colors.destructive} />
                    ) : (
                      <LogOut size={18} color={colors.destructive} />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
