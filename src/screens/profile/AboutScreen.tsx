import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Globe,
  Heart,
  Info,
  Mail,
  Shield,
  Smartphone,
} from 'lucide-react-native';
import React from 'react';
import { Linking, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DeviceInfo from 'react-native-device-info';

import { Text } from '../../components/ui/Text';
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
  isLast = false,
  rightLabel,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  isLast?: boolean;
  rightLabel?: string;
}) {
  const inner = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: colors.card,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.muted,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground }}>{label}</Text>
        {subtitle ? (
          <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightLabel ? (
        <Text style={{ fontSize: 13, color: colors.mutedForeground }}>{rightLabel}</Text>
      ) : onPress ? (
        <ExternalLink size={15} color={colors.mutedForeground} />
      ) : null}
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

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AboutScreen() {
  const navigation = useNavigation<any>();

  const version = DeviceInfo.getVersion();
  const build = DeviceInfo.getBuildNumber();
  const versionLabel = build ? `${version} (${build})` : version;
  const systemName = DeviceInfo.getSystemName();
  const systemVersion = DeviceInfo.getSystemVersion();

  const openWebView = (title: string, url: string) => {
    navigation.navigate('WebView', { title, url });
  };

  const openEmail = () => {
    Linking.openURL('mailto:support@rapidcapsule.com');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.card,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={8}
          activeOpacity={0.7}
          style={{ padding: 4, marginRight: 8, marginLeft: -4 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', flex: 1, color: colors.foreground }}>
          About
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* ── App Identity Card ────────────────────────────────────────────── */}
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              backgroundColor: colors.primary + '18',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.primary + '30',
              marginBottom: 16,
            }}
          >
            <Heart size={36} color={colors.primary} />
          </View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.foreground }}>
            Rapid Capsule
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: colors.mutedForeground,
              marginTop: 6,
              textAlign: 'center',
              paddingHorizontal: 40,
            }}
          >
            Your AI-powered personal health companion
          </Text>
          <View
            style={{
              marginTop: 14,
              paddingHorizontal: 16,
              paddingVertical: 6,
              backgroundColor: colors.muted,
              borderRadius: 20,
            }}
          >
            <Text style={{ fontSize: 12, color: colors.mutedForeground, fontWeight: '600' }}>
              Version {versionLabel}
            </Text>
          </View>
        </View>

        {/* ── App Info ─────────────────────────────────────────────────────── */}
        <SectionHeader title="App Info" />
        <View
          style={{
            marginHorizontal: 16,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
          }}
        >
          <ListRow
            icon={<Smartphone size={17} color={colors.primary} />}
            label="Version"
            rightLabel={versionLabel}
            isLast={false}
          />
          <ListRow
            icon={<Info size={17} color={colors.secondary} />}
            label="Platform"
            rightLabel={`${systemName} ${systemVersion}`}
            isLast
          />
        </View>

        {/* ── Legal ────────────────────────────────────────────────────────── */}
        <SectionHeader title="Legal" />
        <View
          style={{
            marginHorizontal: 16,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
          }}
        >
          <ListRow
            icon={<FileText size={17} color={colors.primary} />}
            label="Terms of Service"
            subtitle="Read our terms and conditions"
            onPress={() =>
              openWebView('Terms of Service', 'https://rapidcapsule.com/terms-of-service')
            }
          />
          <ListRow
            icon={<Shield size={17} color={colors.secondary} />}
            label="Privacy Policy"
            subtitle="How we handle your data"
            onPress={() => openWebView('Privacy Policy', 'https://rapidcapsule.com/privacy-policy')}
            isLast
          />
        </View>

        {/* ── Company ──────────────────────────────────────────────────────── */}
        <SectionHeader title="Company" />
        <View
          style={{
            marginHorizontal: 16,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
          }}
        >
          <ListRow
            icon={<Globe size={17} color={colors.accent} />}
            label="About Rapid Capsule"
            subtitle="Our mission & story"
            onPress={() => openWebView('About Rapid Capsule', 'https://rapidcapsule.com/about')}
          />
          <ListRow
            icon={<Mail size={17} color={colors.success} />}
            label="Contact Support"
            subtitle="support@rapidcapsule.com"
            onPress={openEmail}
            isLast
          />
        </View>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <View style={{ alignItems: 'center', paddingTop: 40, paddingBottom: 8 }}>
          <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
            © {new Date().getFullYear()} Rapid Capsule. All rights reserved.
          </Text>
          <Text style={{ fontSize: 11, color: colors.border, marginTop: 4 }}>
            Made with ♥ for better health
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
