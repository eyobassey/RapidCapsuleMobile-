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
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '../../components/ui/Text';
import { Session, TwoFactorMethod, securityService } from '../../services/security.service';
import { useAuthStore } from '../../store/auth';
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
  isFirst = false,
  isLast = false,
  destructive = false,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  isFirst?: boolean;
  isLast?: boolean;
  destructive?: boolean;
}) {
  const content = (
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

  if (!onPress) return content;
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {content}
    </TouchableOpacity>
  );
}

/** Password field with show/hide toggle */
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

/** Bottom-sheet modal wrapper (reusable) */
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
            maxHeight: '90%',
          }}
        >
          {/* Drag handle */}
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

/** Relative time helper */
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

// ─── 2FA method meta ──────────────────────────────────────────────────────────

const TFA_METHODS: Array<{
  key: TwoFactorMethod;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
}> = [
  {
    key: 'email',
    label: 'Email',
    subtitle: 'Receive verification codes via email',
    icon: <Mail size={18} color={colors.primary} />,
  },
  {
    key: 'sms',
    label: 'SMS',
    subtitle: 'Receive verification codes via SMS',
    icon: <MessageCircle size={18} color={colors.success} />,
  },
  {
    key: 'totp',
    label: 'Auth App',
    subtitle: 'Use an authenticator app like Google Authenticator',
    icon: <Shield size={18} color={colors.accent} />,
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SecuritySettingsScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const email = user?.email ?? '';

  // Loading / refreshing
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Security state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<TwoFactorMethod>('email');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // Sheet visibility
  const [showPasswordSheet, setShowPasswordSheet] = useState(false);
  const [showTFASheet, setShowTFASheet] = useState(false);
  const [showSessionsSheet, setShowSessionsSheet] = useState(false);
  const [showTOTPSheet, setShowTOTPSheet] = useState(false);

  // Change password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  // 2FA enable flow
  const [tfaCode, setTfaCode] = useState('');
  const [tfaSecret, setTfaSecret] = useState('');
  const [tfaSaving, setTfaSaving] = useState(false);

  // Session actions
  const [sessionLoading, setSessionLoading] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  // ── Data fetch ─────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    try {
      const [sessionsResult, bioResult] = await Promise.allSettled([
        securityService.getSessions(),
        securityService.getBiometricCredentials(),
      ]);

      if (sessionsResult.status === 'fulfilled') {
        setSessions(sessionsResult.value);
      }
      if (bioResult.status === 'fulfilled') {
        setBiometricEnabled(bioResult.value.length > 0);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAll();
  }, [fetchAll]);

  // ── Change password ────────────────────────────────────────────────────────

  const handleChangePassword = useCallback(async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing fields', 'Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords do not match', 'New password and confirmation must match.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Too short', 'Password must be at least 8 characters.');
      return;
    }
    setPasswordSaving(true);
    try {
      await securityService.changePassword({ currentPassword, newPassword });
      setShowPasswordSheet(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Password updated', 'Your password has been changed successfully.');
    } catch (err: any) {
      Alert.alert('Could not update password', err?.message ?? 'Please try again.');
    } finally {
      setPasswordSaving(false);
    }
  }, [currentPassword, newPassword, confirmPassword]);

  // ── 2FA ───────────────────────────────────────────────────────────────────

  const handleEnable2FA = useCallback(async () => {
    if (twoFactorMethod === 'totp') {
      // Generate secret and show TOTP setup sheet
      try {
        const { secret } = await securityService.generate2FASecret();
        setTfaSecret(secret);
        setShowTFASheet(false);
        setShowTOTPSheet(true);
      } catch {
        Alert.alert('Error', 'Could not generate 2FA secret. Please try again.');
      }
    } else {
      // Email / SMS: just show code input within TFA sheet
      setTfaCode('');
      setShowTFASheet(true);
    }
  }, [twoFactorMethod]);

  const handleVerifyAndEnable = useCallback(async () => {
    if (!tfaCode || tfaCode.length < 6) {
      Alert.alert('Enter code', 'Please enter the 6-digit verification code.');
      return;
    }
    setTfaSaving(true);
    try {
      await securityService.enable2FA(tfaCode);
      setTwoFactorEnabled(true);
      setShowTFASheet(false);
      setShowTOTPSheet(false);
      setTfaCode('');
      Alert.alert('2FA enabled', 'Two-factor authentication is now active.');
    } catch (err: any) {
      Alert.alert('Invalid code', err?.message ?? 'Please check the code and try again.');
    } finally {
      setTfaSaving(false);
    }
  }, [tfaCode]);

  // ── Sessions ──────────────────────────────────────────────────────────────

  const handleRevokeSession = useCallback(async (sessionId: string) => {
    Alert.alert('Revoke session', 'Sign out this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setSessionLoading(sessionId);
          try {
            await securityService.revokeSession(sessionId);
            setSessions((prev) => prev.filter((s) => s.id !== sessionId));
          } catch {
            Alert.alert('Error', 'Could not revoke the session. Please try again.');
          } finally {
            setSessionLoading(null);
          }
        },
      },
    ]);
  }, []);

  const handleRevokeAll = useCallback(async () => {
    Alert.alert(
      'Sign out all other devices',
      'This will immediately sign out all other active sessions. You will remain logged in on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out All',
          style: 'destructive',
          onPress: async () => {
            setRevokingAll(true);
            try {
              await securityService.revokeAllOtherSessions();
              setSessions((prev) => prev.filter((s) => s.isCurrent));
            } catch {
              Alert.alert('Error', 'Could not revoke sessions. Please try again.');
            } finally {
              setRevokingAll(false);
            }
          },
        },
      ]
    );
  }, []);

  // ── Biometric ─────────────────────────────────────────────────────────────

  const handleBiometricSetup = useCallback(() => {
    Alert.alert(
      biometricEnabled ? 'Biometric Login' : 'Set Up Biometric Login',
      biometricEnabled
        ? 'Biometric login is enabled for this device. Remove it?'
        : 'Set up Face ID or fingerprint to sign in quickly without a password.',
      biometricEnabled
        ? [
            { text: 'Keep enabled', style: 'cancel' },
            {
              text: 'Remove',
              style: 'destructive',
              onPress: async () => {
                try {
                  const creds = await securityService.getBiometricCredentials();
                  if (creds[0])
                    await securityService.deleteBiometricCredential(creds[0].credentialId);
                  setBiometricEnabled(false);
                } catch {
                  Alert.alert('Error', 'Could not remove biometric credentials.');
                }
              },
            },
          ]
        : [
            { text: 'Not now', style: 'cancel' },
            {
              text: 'Set Up',
              onPress: () =>
                Alert.alert(
                  'Coming soon',
                  'Biometric registration will be available in the next update.'
                ),
            },
          ]
    );
  }, [biometricEnabled]);

  // ── Derived values ─────────────────────────────────────────────────────────

  const otherSessions = sessions.filter((s) => !s.isCurrent);
  const currentSession = sessions.find((s) => s.isCurrent);

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
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
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-16"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
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
                  ? `2FA active · ${sessions.length} device${
                      sessions.length === 1 ? '' : 's'
                    } logged in`
                  : `Enable 2FA for stronger account protection`}
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
          {/* Status row */}
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
                  ? `Active · ${TFA_METHODS.find((m) => m.key === twoFactorMethod)?.label}`
                  : 'Not enabled — adds an extra layer of security'}
              </Text>
            </View>
            {twoFactorEnabled ? (
              <View
                style={{
                  backgroundColor: `${colors.success}20`,
                  borderRadius: 20,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.success }}>On</Text>
              </View>
            ) : null}
          </View>

          {/* Method rows */}
          {TFA_METHODS.map((method, i) => {
            const isActive = twoFactorEnabled && twoFactorMethod === method.key;
            const isLast = i === TFA_METHODS.length - 1;
            return (
              <TouchableOpacity
                key={method.key}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${method.label} two-factor authentication`}
                onPress={() => {
                  setTwoFactorMethod(method.key);
                  if (!twoFactorEnabled) setShowTFASheet(true);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  backgroundColor: isActive ? `${colors.primary}0a` : 'transparent',
                  borderBottomWidth: isLast ? 0 : 1,
                  borderBottomColor: colors.border,
                }}
              >
                <View className="w-9 h-9 rounded-full bg-muted items-center justify-center mr-3">
                  {method.icon}
                </View>
                <View className="flex-1 mr-3">
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: isActive ? colors.foreground : colors.foreground,
                    }}
                  >
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
            onPress={handleBiometricSetup}
            isLast
            right={
              biometricEnabled ? (
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

        {/* ── WhatsApp Notifications ── */}
        <SectionHeader title="WhatsApp Notifications" />
        <View className="mx-5 bg-card border border-border rounded-2xl overflow-hidden">
          <ListRow
            icon={<Bell size={18} color={colors.success} />}
            label="WhatsApp Notifications"
            subtitle="Appointment reminders, prescription updates & health tips via WhatsApp"
            onPress={() =>
              Alert.alert(
                'WhatsApp Notifications',
                'Configure which notifications you receive on WhatsApp from the Notification Preferences screen.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Open Preferences',
                    onPress: () => navigation.navigate('NotificationPreferences'),
                  },
                ]
              )
            }
            isLast
            right={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>
                  Configure
                </Text>
                <ChevronRight size={14} color={colors.primary} />
              </View>
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
                {sessions.length} device{sessions.length === 1 ? '' : 's'} logged in
              </Text>
              <Text className="text-xs text-muted-foreground mt-0.5">Including this device</Text>
            </View>
            {otherSessions.length > 0 && (
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
          {currentSession ? (
            <View className="flex-row items-center p-4 border-b border-border">
              <View className="w-9 h-9 rounded-full bg-muted items-center justify-center mr-3">
                <Smartphone size={16} color={colors.primary} />
              </View>
              <View className="flex-1 mr-2">
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm font-medium text-foreground">
                    {currentSession.browser || 'This Device'}
                    {currentSession.os ? ` on ${currentSession.os}` : ''}
                  </Text>
                  <View
                    style={{
                      backgroundColor: `${colors.primary}20`,
                      borderRadius: 10,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '700', color: colors.primary }}>
                      THIS DEVICE
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-muted-foreground mt-0.5">
                  {currentSession.lastActive
                    ? relativeTime(currentSession.lastActive)
                    : 'Active now'}
                  {currentSession.location ? ` · ${currentSession.location}` : ''}
                </Text>
              </View>
              <CheckCircle2 size={16} color={colors.success} />
            </View>
          ) : null}

          {/* Revoke all others */}
          {otherSessions.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleRevokeAll}
              accessibilityRole="button"
              accessibilityLabel="Sign out all other devices"
              className="flex-row items-center p-4"
            >
              {revokingAll ? (
                <ActivityIndicator
                  size="small"
                  color={colors.destructive}
                  style={{ marginRight: 12 }}
                />
              ) : (
                <View className="w-9 h-9 rounded-full bg-muted items-center justify-center mr-3">
                  <LogOut size={16} color={colors.destructive} />
                </View>
              )}
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: colors.destructive }}>
                Sign out {otherSessions.length} other device{otherSessions.length === 1 ? '' : 's'}
              </Text>
              <ChevronRight size={16} color={colors.destructive} />
            </TouchableOpacity>
          )}

          {sessions.length === 0 && (
            <View className="p-4">
              <Text className="text-sm text-muted-foreground text-center">
                No active sessions found
              </Text>
            </View>
          )}
        </View>

        {/* ── Password tips info note ── */}
        <View className="mx-5 mt-4 flex-row items-start gap-2.5 bg-muted/50 border border-border rounded-2xl p-4">
          <Key size={15} color={colors.mutedForeground} style={{ marginTop: 1 }} />
          <Text className="flex-1 text-xs text-muted-foreground leading-5">
            Use at least 8 characters including numbers and symbols. Never reuse passwords across
            different services.
          </Text>
        </View>
      </ScrollView>

      {/* ════════════════════════════════════════════════════════════════
          Change Password Sheet
      ════════════════════════════════════════════════════════════════ */}
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

            <PasswordInput
              label="Current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <PasswordInput
              label="New password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Min. 8 characters"
            />
            <PasswordInput
              label="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            {/* Password rules */}
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
              disabled={passwordSaving}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                opacity: passwordSaving ? 0.7 : 1,
              }}
            >
              {passwordSaving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Lock size={16} color={colors.white} />
              )}
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.white }}>
                {passwordSaving ? 'Updating…' : 'Update Password'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </BottomSheet>

      {/* ════════════════════════════════════════════════════════════════
          2FA Enable Sheet
      ════════════════════════════════════════════════════════════════ */}
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
                  Enable 2FA via {TFA_METHODS.find((m) => m.key === twoFactorMethod)?.label}
                </Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
                  Enter the 6-digit code sent to your{' '}
                  {twoFactorMethod === 'email' ? 'email' : 'phone'}
                </Text>
              </View>
            </View>

            <TextInput
              value={tfaCode}
              onChangeText={(v) => setTfaCode(v.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              placeholder="000000"
              placeholderTextColor={colors.mutedForeground}
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
              maxLength={6}
            />

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleVerifyAndEnable}
              disabled={tfaSaving}
              style={{
                backgroundColor: colors.accent,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                opacity: tfaSaving ? 0.7 : 1,
                marginBottom: 8,
              }}
            >
              {tfaSaving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <ShieldCheck size={16} color={colors.white} />
              )}
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.white }}>
                {tfaSaving ? 'Verifying…' : 'Verify & Enable'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </BottomSheet>

      {/* ════════════════════════════════════════════════════════════════
          TOTP Setup Sheet (Auth App)
      ════════════════════════════════════════════════════════════════ */}
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
                  Open your auth app and enter the code below
                </Text>
              </View>
            </View>

            {/* Secret key display */}
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
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: colors.foreground,
                  letterSpacing: 2,
                  fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                }}
                selectable
              >
                {tfaSecret}
              </Text>
              <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 8 }}>
                Add this key in Google Authenticator, Authy, or 1Password
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
              maxLength={6}
            />

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleVerifyAndEnable}
              disabled={tfaSaving}
              style={{
                backgroundColor: colors.accent,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                opacity: tfaSaving ? 0.7 : 1,
                marginBottom: 8,
              }}
            >
              {tfaSaving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <ShieldCheck size={16} color={colors.white} />
              )}
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.white }}>
                {tfaSaving ? 'Verifying…' : 'Verify & Enable'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </BottomSheet>

      {/* ════════════════════════════════════════════════════════════════
          All Sessions Sheet
      ════════════════════════════════════════════════════════════════ */}
      <BottomSheet visible={showSessionsSheet} onClose={() => setShowSessionsSheet(false)}>
        <View style={{ paddingBottom: 8 }}>
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
                {sessions.length} device{sessions.length === 1 ? '' : 's'} logged in
              </Text>
            </View>
            {otherSessions.length > 0 && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setShowSessionsSheet(false);
                  // Small delay so sheet closes before alert
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
                {revokingAll ? (
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

          <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
            {sessions.map((session, i) => (
              <View
                key={session.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  paddingVertical: 14,
                  borderBottomWidth: i < sessions.length - 1 ? 1 : 0,
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
                  <Monitor
                    size={16}
                    color={session.isCurrent ? colors.primary : colors.mutedForeground}
                  />
                </View>

                <View style={{ flex: 1, marginRight: 8 }}>
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>
                      {session.browser || 'Unknown Browser'}
                      {session.os ? ` on ${session.os}` : ''}
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
                    {session.lastActive ? relativeTime(session.lastActive) : 'Unknown'}
                    {session.location ? ` · ${session.location}` : ''}
                  </Text>
                </View>

                {!session.isCurrent && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleRevokeSession(session.id)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Sign out session on ${session.browser}`}
                  >
                    {sessionLoading === session.id ? (
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
