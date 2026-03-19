import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Copy,
  Crown,
  Facebook,
  Gift,
  Globe,
  Link,
  Linkedin,
  Lock,
  Mail,
  MessageCircle,
  Share2,
  Shield,
  Smartphone,
  Star,
  Trophy,
  Twitter,
  Users,
  Zap,
} from 'lucide-react-native';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '../../components/ui/Text';
import {
  useMyReferralQuery,
  useReferralSettingsQuery,
  useReferralStatsQuery,
  useShareMessagesQuery,
  useTrackShareMutation,
} from '../../hooks/queries/useReferralsQuery';
import { ApiMilestone, SharePlatform } from '../../services/referrals.service';
import { colors } from '../../theme/colors';

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-xs text-muted-foreground uppercase tracking-wider px-5 pt-6 pb-2 font-semibold">
      {title}
    </Text>
  );
}

// ─── Badge icon resolver (maps API badge_icon string → lucide component) ──────

function BadgeIcon({ icon, size = 18, color }: { icon: string; size?: number; color: string }) {
  switch (icon) {
    case 'trophy':
      return <Trophy size={size} color={color} />;
    case 'crown':
      return <Crown size={size} color={color} />;
    case 'shield':
      return <Shield size={size} color={color} />;
    case 'star':
    default:
      return <Star size={size} color={color} />;
  }
}

const MILESTONE_COLORS = [colors.primary, colors.secondary, colors.accent, colors.success];

// ─── Share platform config ─────────────────────────────────────────────────────

type PlatformConfig = {
  key: SharePlatform;
  label: string;
  icon: React.ReactNode;
  color: string;
};

const SHARE_PLATFORMS: PlatformConfig[] = [
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    icon: <MessageCircle size={22} color="#25D366" />,
    color: '#25D366',
  },
  {
    key: 'twitter',
    label: 'Twitter',
    icon: <Twitter size={22} color="#1DA1F2" />,
    color: '#1DA1F2',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    icon: <Facebook size={22} color="#1877F2" />,
    color: '#1877F2',
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    icon: <Linkedin size={22} color="#0A66C2" />,
    color: '#0A66C2',
  },
  {
    key: 'email',
    label: 'Email',
    icon: <Mail size={22} color={colors.primary} />,
    color: colors.primary,
  },
  {
    key: 'sms',
    label: 'SMS',
    icon: <Smartphone size={22} color={colors.success} />,
    color: colors.success,
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ReferralRewardsScreen() {
  const navigation = useNavigation<any>();

  const referralQuery = useMyReferralQuery();
  const statsQuery = useReferralStatsQuery();
  const settingsQuery = useReferralSettingsQuery();
  const shareMessagesQuery = useShareMessagesQuery();
  const trackShare = useTrackShareMutation();

  const referral = referralQuery.data;
  const stats = statsQuery.data;
  const settings = settingsQuery.data;
  const shareData = shareMessagesQuery.data;

  const isLoading = referralQuery.isLoading || settingsQuery.isLoading;
  const isRefreshing =
    referralQuery.isRefetching || statsQuery.isRefetching || settingsQuery.isRefetching;

  const onRefresh = useCallback(() => {
    referralQuery.refetch();
    statsQuery.refetch();
    settingsQuery.refetch();
    shareMessagesQuery.refetch();
  }, [referralQuery, statsQuery, settingsQuery, shareMessagesQuery]);

  // Prefer the pre-built link from share-messages endpoint, fall back to constructing it
  const referralLink =
    shareData?.referral_link ??
    (referral?.referral_code ? `https://rapidcapsule.com/r/${referral.referral_code}` : '');

  const referralCode = shareData?.referral_code ?? referral?.referral_code ?? '';

  const copyLink = useCallback(() => {
    if (!referralLink) return;
    Clipboard.setString(referralLink);
    trackShare.mutate('copy');
    Alert.alert('Copied!', 'Referral link copied to clipboard.');
  }, [referralLink, trackShare]);

  const handleShare = useCallback(
    (platform: SharePlatform) => {
      if (!referralLink) return;

      // Use the pre-built message from the API (already has the link injected by the server)
      const apiMessage = shareData?.messages?.[platform as keyof typeof shareData.messages];
      const fallback = `Join Rapid Capsule using my referral link and get free health credits! ${referralLink}`;
      const message = apiMessage ?? fallback;

      trackShare.mutate(platform);

      Alert.alert(`Share via ${platform}`, message, [
        { text: 'Copy & Close', onPress: () => Clipboard.setString(message) },
        { text: 'Close', style: 'cancel' },
      ]);
    },
    [referralLink, shareData, trackShare]
  );

  // Stats data — prefer /stats endpoint (more detailed), fall back to /me
  const totalClicks = stats?.total_clicks ?? referral?.total_clicks ?? 0;
  const totalShares = stats?.total_shares ?? referral?.total_shares ?? 0;
  const totalSignups = stats?.total_signups ?? referral?.total_signups ?? 0;
  const totalCredits = stats?.total_credits_earned ?? referral?.total_credits_earned ?? 0;
  const conversionRate = stats?.conversion_rate ?? '0';

  // Milestones — sourced entirely from settings API
  const milestones: ApiMilestone[] = settings?.milestones ?? [];

  // Which milestones have been achieved — from stats (most up-to-date) or referral
  const milestonesAchieved: string[] =
    stats?.milestones_achieved ?? referral?.milestones_achieved ?? [];

  // Hero banner config from settings
  const heroBg = settings?.hero_banner?.background_color ?? colors.primary;
  const heroTitle = settings?.hero_banner?.title ?? 'Referrals & Rewards';
  const heroSubtitle =
    settings?.hero_banner?.subtitle ?? 'Invite friends and earn rewards for every referral';
  const showStats = settings?.hero_banner?.show_stats ?? true;

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center px-4 py-3 border-b border-border bg-card">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2 mr-2 -ml-2"
            hitSlop={8}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-lg font-bold flex-1">Referrals & Rewards</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Main UI ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border bg-card">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 mr-2 -ml-2"
          hitSlop={8}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-lg font-bold flex-1">Referrals & Rewards</Text>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.primary + '20',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Gift size={18} color={colors.primary} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ── Hero Banner ───────────────────────────────────────────────────── */}
        <View style={{ marginHorizontal: 16, marginTop: 16, borderRadius: 20, overflow: 'hidden' }}>
          <View style={{ backgroundColor: heroBg, padding: 20, paddingBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Gift size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{heroTitle}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 }}>
                  {heroSubtitle}
                </Text>
              </View>
            </View>

            {showStats && (
              <View
                style={{
                  flexDirection: 'row',
                  marginTop: 16,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: 14,
                  overflow: 'hidden',
                }}
              >
                {[
                  { label: 'Friends Joined', value: totalSignups },
                  { label: 'Credits Earned', value: totalCredits },
                  { label: 'Conversion', value: `${conversionRate}%` },
                ].map((stat, i, arr) => (
                  <View
                    key={stat.label}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      paddingVertical: 12,
                      borderRightWidth: i < arr.length - 1 ? 1 : 0,
                      borderRightColor: 'rgba(255,255,255,0.2)',
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>
                      {stat.value}
                    </Text>
                    <Text
                      style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10, marginTop: 2 }}
                      numberOfLines={1}
                    >
                      {stat.label.toUpperCase()}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* ── Referral Link ─────────────────────────────────────────────────── */}
        <SectionHeader title="Your Referral Link" />
        <View style={{ marginHorizontal: 16 }}>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: 'hidden',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
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
                <Link size={17} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600', fontSize: 14, color: colors.foreground }}>
                  Your Referral Link
                </Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
                  Share this unique link with friends and family
                </Text>
              </View>
            </View>

            <View
              style={{
                paddingHorizontal: 16,
                paddingBottom: 14,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.muted,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginTop: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                }}
              >
                <Text
                  style={{ flex: 1, color: colors.foreground, fontSize: 13 }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {referralLink || '—'}
                </Text>
                <TouchableOpacity
                  onPress={copyLink}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: 8,
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginLeft: 10,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Copy referral link"
                >
                  <Copy size={14} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600', marginLeft: 5 }}>
                    Copy
                  </Text>
                </TouchableOpacity>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 10,
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Your Code: </Text>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>
                  {referralCode || '—'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Share With Friends ────────────────────────────────────────────── */}
        <SectionHeader title="Share With Friends" />
        <View style={{ marginHorizontal: 16 }}>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: 'hidden',
            }}
          >
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
                  <Share2 size={17} color={colors.primary} />
                </View>
                <View>
                  <Text style={{ fontWeight: '600', fontSize: 14, color: colors.foreground }}>
                    Choose your preferred platform
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
                    Tap to share your referral link
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 12 }}>
              {SHARE_PLATFORMS.map((platform) => {
                const shareCount = stats?.shares_by_platform?.[platform.key] ?? 0;
                return (
                  <TouchableOpacity
                    key={platform.key}
                    activeOpacity={0.7}
                    onPress={() => handleShare(platform.key)}
                    accessibilityRole="button"
                    accessibilityLabel={`Share via ${platform.label}`}
                    style={{ width: '33.33%', paddingHorizontal: 4, marginBottom: 12 }}
                  >
                    <View style={{ alignItems: 'center' }}>
                      <View
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 16,
                          backgroundColor: platform.color + '18',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1,
                          borderColor: platform.color + '30',
                        }}
                      >
                        {platform.icon}
                        {shareCount > 0 && (
                          <View
                            style={{
                              position: 'absolute',
                              top: -4,
                              right: -4,
                              backgroundColor: colors.primary,
                              borderRadius: 8,
                              minWidth: 16,
                              height: 16,
                              alignItems: 'center',
                              justifyContent: 'center',
                              paddingHorizontal: 3,
                            }}
                          >
                            <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>
                              {shareCount}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        style={{
                          fontSize: 11,
                          color: colors.mutedForeground,
                          marginTop: 6,
                          textAlign: 'center',
                        }}
                      >
                        {platform.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── Performance Stats ─────────────────────────────────────────────── */}
        <SectionHeader title="Your Performance" />
        <View style={{ marginHorizontal: 16 }}>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: 'hidden',
            }}
          >
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
                  <Zap size={17} color={colors.secondary} />
                </View>
                <Text style={{ fontWeight: '600', fontSize: 14, color: colors.foreground }}>
                  Track your referral activity
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 12 }}>
              {[
                {
                  label: 'Link Clicks',
                  value: totalClicks,
                  icon: <Globe size={16} color={colors.primary} />,
                },
                {
                  label: 'Times Shared',
                  value: totalShares,
                  icon: <Share2 size={16} color={colors.secondary} />,
                },
                {
                  label: 'Friends Joined',
                  value: totalSignups,
                  icon: <Users size={16} color={colors.success} />,
                },
                {
                  label: 'Credits Earned',
                  value: totalCredits,
                  icon: <Zap size={16} color={colors.accent} />,
                },
              ].map((stat) => (
                <View
                  key={stat.label}
                  style={{ width: '50%', paddingHorizontal: 4, marginBottom: 8 }}
                >
                  <View style={{ backgroundColor: colors.muted, borderRadius: 12, padding: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      {stat.icon}
                    </View>
                    <Text style={{ fontSize: 22, fontWeight: '700', color: colors.foreground }}>
                      {stat.value}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>
                      {stat.label}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── How It Works ──────────────────────────────────────────────────── */}
        <SectionHeader title="How It Works" />
        <View style={{ marginHorizontal: 16 }}>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: 'hidden',
            }}
          >
            {[
              {
                step: '1',
                title: 'Share Your Link',
                subtitle: 'Send your unique referral link to friends',
                color: colors.primary,
              },
              {
                step: '2',
                title: 'Friends Sign Up',
                subtitle: 'They create an account using your link',
                color: colors.secondary,
              },
              {
                step: '3',
                title: 'Both Get Rewarded',
                subtitle: `You both receive ${settings?.referrer_credits ?? 1} free AI credit!`,
                color: colors.success,
              },
            ].map((item, i, arr) => (
              <View
                key={item.step}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: item.color,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 14,
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                    {item.step}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600', fontSize: 14, color: colors.foreground }}>
                    {item.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
                    {item.subtitle}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Milestones (from API) ─────────────────────────────────────────── */}
        <SectionHeader title="Milestones" />
        <Text
          style={{
            fontSize: 12,
            color: colors.mutedForeground,
            paddingHorizontal: 20,
            marginBottom: 8,
          }}
        >
          Unlock bonus rewards as you refer more friends
        </Text>
        <View style={{ marginHorizontal: 16 }}>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: 'hidden',
            }}
          >
            {milestones.length > 0 ? (
              milestones.map((milestone, i) => {
                const isAchieved = milestonesAchieved.includes(milestone.badge_name);
                const isLast = i === milestones.length - 1;
                const accentColor = MILESTONE_COLORS[i % MILESTONE_COLORS.length];

                return (
                  <View
                    key={`${milestone.badge_name}-${i}`}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 16,
                      borderBottomWidth: isLast ? 0 : 1,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: isAchieved ? accentColor + '20' : colors.muted,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 14,
                      }}
                    >
                      <BadgeIcon
                        icon={milestone.badge_icon}
                        size={18}
                        color={isAchieved ? accentColor : colors.mutedForeground}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontWeight: '600',
                          fontSize: 14,
                          color: isAchieved ? colors.foreground : colors.mutedForeground,
                        }}
                      >
                        {milestone.badge_name}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
                        {milestone.referrals_required} referrals
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View
                        style={{
                          backgroundColor: isAchieved ? colors.success + '20' : colors.muted,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '700',
                            color: isAchieved ? colors.success : colors.mutedForeground,
                          }}
                        >
                          +{milestone.reward_value}
                        </Text>
                      </View>
                      {isAchieved ? (
                        <Check size={16} color={colors.success} />
                      ) : (
                        <Lock size={14} color={colors.mutedForeground} />
                      )}
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={{ alignItems: 'center', padding: 32 }}>
                <Trophy size={32} color={colors.border} />
                <Text style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 10 }}>
                  No milestones available
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Next Milestone progress hint ─────────────────────────────────── */}
        {stats?.next_milestone && (
          <>
            <SectionHeader title="Next Milestone" />
            <View style={{ marginHorizontal: 16 }}>
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.primary + '20',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 14,
                  }}
                >
                  <BadgeIcon
                    icon={stats.next_milestone.badge_icon}
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600', fontSize: 14, color: colors.foreground }}>
                    {stats.next_milestone.badge_name}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
                    Refer {stats.next_milestone.referrals_required - totalSignups} more friend
                    {stats.next_milestone.referrals_required - totalSignups !== 1 ? 's' : ''} to
                    unlock +{stats.next_milestone.reward_value} credits
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.mutedForeground} />
              </View>
            </View>
          </>
        )}

        {/* ── Recent Referrals ──────────────────────────────────────────────── */}
        <SectionHeader title="Recent Referrals" />
        <View style={{ marginHorizontal: 16 }}>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: 'hidden',
            }}
          >
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: colors.destructive + '20',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Users size={17} color={colors.destructive} />
                </View>
                <View>
                  <Text style={{ fontWeight: '600', fontSize: 14, color: colors.foreground }}>
                    Recent Referrals
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
                    Friends who joined using your link
                  </Text>
                </View>
              </View>
            </View>

            {/* Use stats.referrals as authoritative source, fall back to referral.referrals */}
            {(() => {
              const list = stats?.referrals ?? referral?.referrals ?? [];
              if (list.length === 0) {
                return (
                  <View style={{ alignItems: 'center', padding: 40 }}>
                    <Users size={40} color={colors.border} />
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '600',
                        color: colors.foreground,
                        marginTop: 14,
                      }}
                    >
                      No referrals yet
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: colors.mutedForeground,
                        marginTop: 6,
                        textAlign: 'center',
                      }}
                    >
                      Start sharing your link to see your referrals here!
                    </Text>
                  </View>
                );
              }
              return list.map((ref, i) => (
                <View
                  key={ref._id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    borderBottomWidth: i < list.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      backgroundColor: colors.muted,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Users size={16} color={colors.mutedForeground} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '500', fontSize: 14, color: colors.foreground }}>
                      Friend #{i + 1}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
                      {ref.status ?? 'Signed up'} · {new Date(ref.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: colors.success + '20',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '600', color: colors.success }}>
                      Joined
                    </Text>
                  </View>
                </View>
              ));
            })()}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
