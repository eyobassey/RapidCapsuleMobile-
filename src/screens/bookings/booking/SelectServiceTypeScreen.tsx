import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  ClipboardCheck,
  ClipboardList,
  Clock,
  FileText,
  Globe,
  Headphones,
  HeartPulse,
  MessageCircle,
  Phone,
  Plus,
  Sparkles,
  Stethoscope,
  Video,
  X,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Header, Skeleton, Text } from '../../../components/ui';
import { useConsultationServicesQuery, useRecentCheckupsQuery } from '../../../hooks/queries';
import type { BookingsStackParamList } from '../../../navigation/stacks/BookingsStack';
import { useAppointmentsStore } from '../../../store/appointments';
import { colors } from '../../../theme/colors';

type Nav = NativeStackNavigationProp<BookingsStackParamList>;
type Route = RouteProp<BookingsStackParamList, 'SelectServiceType'>;

type Urgency = 'routine' | 'urgent';
type ConsultationMethod = 'zoom' | 'phone' | 'chat';

// ─── Static data ─────────────────────────────────────────

const URGENCY_OPTIONS: {
  id: Urgency;
  label: string;
  description: string;
  icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  color: string;
  badge: string | null;
}[] = [
  {
    id: 'routine',
    label: 'Routine Checkup',
    description: 'Regular follow-ups, non-urgent symptoms, or general health inquiries.',
    icon: ClipboardCheck,
    color: colors.primary,
    badge: null,
  },
  {
    id: 'urgent',
    label: 'Urgent Care',
    description: "Sudden symptoms needing quick attention. We'll prioritize available doctors.",
    icon: AlertTriangle,
    color: colors.destructive,
    badge: 'High Priority',
  },
];

const CONSULTATION_METHODS: {
  id: ConsultationMethod;
  label: string;
  description: string;
  icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  color: string;
  footerLabel: string;
  footerIcon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  recommended: boolean;
}[] = [
  {
    id: 'zoom',
    label: 'Video Call',
    description: 'Face-to-face via secure HD video. Best for physical symptom examination.',
    icon: Video,
    color: colors.primary,
    footerLabel: 'Requires stable internet',
    footerIcon: Globe,
    recommended: true,
  },
  {
    id: 'phone',
    label: 'Audio Call',
    description: 'Voice-only consultation. Good for follow-ups or low bandwidth areas.',
    icon: Phone,
    color: colors.secondary,
    footerLabel: 'Low data usage',
    footerIcon: Activity,
    recommended: false,
  },
  {
    id: 'chat',
    label: 'Chat Consultation',
    description: 'Asynchronous messaging. Send photos and describe symptoms at your own pace.',
    icon: MessageCircle,
    color: '#a855f7',
    footerLabel: 'Reply within 2 hrs',
    footerIcon: Clock,
    recommended: false,
  },
];

// Maps service slug → default consultation method
const SERVICE_TO_METHOD: Record<string, ConsultationMethod> = {
  video_consultation: 'zoom',
  audio_consultation: 'phone',
  chat_consultation: 'chat',
};

// Maps backend HeroIcon slug → Lucide component
const ICON_MAP: Record<
  string,
  React.ComponentType<{ size: number; color: string; strokeWidth?: number }>
> = {
  'hi-video-camera': Video,
  'hi-phone': Phone,
  'hi-chat-alt-2': MessageCircle,
  'hi-clipboard-list': ClipboardList,
  'hi-document-text': FileText,
};

function getServiceIcon(slug: string) {
  return ICON_MAP[slug] ?? Stethoscope;
}

// ─── Sub-components ───────────────────────────────────────

function ServiceTypeSkeleton() {
  return (
    <View style={styles.cardList}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={[styles.listCard, { gap: 12 }]}>
          <Skeleton width={20} height={20} borderRadius={10} />
          <Skeleton width={40} height={40} borderRadius={12} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width="55%" height={13} />
            <Skeleton width="80%" height={11} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────
export default function SelectServiceTypeScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

  const { bottom } = useSafeAreaInsets();
  const healthCheckupId = route.params?.healthCheckupId;
  const healthCheckupSummary = route.params?.healthCheckupSummary;

  const { clearBookingData, setBookingData } = useAppointmentsStore();

  const { data: consultationServices = [], isLoading: servicesLoading } =
    useConsultationServicesQuery();
  const { data: recentCheckups = [] } = useRecentCheckupsQuery();

  const [selectedSlug, setSelectedSlug] = useState<string>('video_consultation');
  const [urgency, setUrgency] = useState<Urgency>('routine');
  const [consultationMethod, setConsultationMethod] = useState<ConsultationMethod>('zoom');
  const [assessmentBannerDismissed, setAssessmentBannerDismissed] = useState(false);
  const [linkedCheckupId, setLinkedCheckupId] = useState<string | null>(healthCheckupId ?? null);

  // This is the flow entry point — always start fresh
  useEffect(() => {
    clearBookingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: only run on mount
  }, []);

  // Once services load, default-select the first is_default service
  useEffect(() => {
    if (consultationServices.length > 0) {
      const defaultService =
        consultationServices.find((s: any) => s.is_default) ?? consultationServices[0];
      if (defaultService) {
        const slug = defaultService.slug as string;
        setSelectedSlug(slug);
        const method = SERVICE_TO_METHOD[slug];
        if (method) setConsultationMethod(method);
      }
    }
  }, [consultationServices]);

  const mostRecentCheckup = recentCheckups[0] ?? null;
  const showAssessmentBanner =
    !assessmentBannerDismissed && mostRecentCheckup !== null && !linkedCheckupId;

  const daysSinceCheckup = mostRecentCheckup
    ? Math.floor(
        (Date.now() - new Date(mostRecentCheckup.created_at).getTime()) / (1000 * 60 * 60 * 24)
      )
    : 0;

  const handleServiceTypeChange = useCallback((slug: string) => {
    setSelectedSlug(slug);
    const method = SERVICE_TO_METHOD[slug];
    if (method) setConsultationMethod(method);
  }, []);

  const handleLinkAssessment = useCallback(() => {
    if (mostRecentCheckup) {
      const id = mostRecentCheckup._id || mostRecentCheckup.id;
      const topCondition =
        mostRecentCheckup.response?.data?.conditions?.[0]?.common_name ||
        mostRecentCheckup.response?.data?.conditions?.[0]?.name;
      setLinkedCheckupId(id);
      setBookingData({
        health_checkup_id: id,
        healthCheckupSummary: topCondition
          ? `Health checkup: ${topCondition}`
          : 'Health checkup linked',
      });
      setAssessmentBannerDismissed(true);
    }
  }, [mostRecentCheckup, setBookingData]);

  // ─── FAB speed-dial ──────────────────────────────────────
  const [fabOpen, setFabOpen] = useState(false);
  const fabAnim = useRef(new Animated.Value(0)).current;

  const openFab = useCallback(() => {
    setFabOpen(true);
    Animated.spring(fabAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 18,
      stiffness: 200,
    }).start();
  }, [fabAnim]);

  const closeFab = useCallback(() => {
    Animated.timing(fabAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() =>
      setFabOpen(false)
    );
  }, [fabAnim]);

  const closeAndGo = useCallback(
    (fn: () => void) => {
      Animated.timing(fabAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
        setFabOpen(false);
        fn();
      });
    },
    [fabAnim]
  );

  const fabRotate = fabAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });
  const backdropOpacity = fabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] });

  const handleContinue = useCallback(() => {
    setBookingData({
      service_type: selectedSlug,
      urgency,
      meeting_channel: consultationMethod,
    });
    navigation.navigate('ConsentScreen', {
      ...(linkedCheckupId
        ? {
            healthCheckupId: linkedCheckupId,
            healthCheckupSummary: healthCheckupSummary,
          }
        : {}),
    });
  }, [
    selectedSlug,
    urgency,
    consultationMethod,
    linkedCheckupId,
    healthCheckupSummary,
    setBookingData,
    navigation,
  ]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Select Service Type" onBack={() => navigation.goBack()} />

      {/* Step progress */}
      <View style={styles.progressRow}>
        <View style={styles.progressBars}>
          {[1, 2, 3, 4, 5, 6].map((step) => (
            <View
              key={step}
              style={[
                styles.progressPill,
                step === 1 ? styles.progressPillActive : styles.progressPillInactive,
              ]}
            />
          ))}
        </View>
        <Text style={styles.progressLabel}>Step 1 of 6</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* AI Health Assessment Banner */}
        {showAssessmentBanner && (
          <View style={styles.assessmentBanner}>
            <View style={styles.assessmentBannerInner}>
              <View style={styles.assessmentIconWrap}>
                <BrainCircuit size={20} color={colors.success} strokeWidth={1.75} />
              </View>
              <View style={styles.assessmentTextWrap}>
                <Text style={styles.assessmentTitle}>Recent AI Health Assessment Found</Text>
                <Text style={styles.assessmentSubtitle}>
                  You completed a health checkup{' '}
                  <Text style={styles.assessmentBold}>{daysSinceCheckup} days ago</Text>. Would you
                  like to share it with your doctor?
                </Text>
              </View>
            </View>
            <View style={styles.assessmentActions}>
              <TouchableOpacity
                onPress={handleLinkAssessment}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Link health assessment"
                style={styles.assessmentLinkBtn}
              >
                <ClipboardCheck size={13} color="#fff" strokeWidth={2.5} />
                <Text style={styles.assessmentLinkLabel}>Link Assessment</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setAssessmentBannerDismissed(true)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Dismiss"
                style={styles.assessmentDismissBtn}
              >
                <Text style={styles.assessmentDismissLabel}>Not Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Linked assessment confirmation */}
        {linkedCheckupId && (
          <View style={styles.linkedBanner}>
            <ClipboardCheck size={16} color={colors.success} />
            <Text style={styles.linkedBannerText}>Health assessment linked</Text>
            <TouchableOpacity
              onPress={() => {
                setLinkedCheckupId(null);
                setBookingData({ health_checkup_id: undefined, healthCheckupSummary: undefined });
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        )}

        {/* Section: Service Type */}
        <Text style={styles.sectionTitle}>What type of appointment is this?</Text>
        {servicesLoading ? (
          <ServiceTypeSkeleton />
        ) : (
          <View style={styles.cardList}>
            {consultationServices.map((service: any) => {
              const Icon = getServiceIcon(service.icon ?? '');
              const isSelected = selectedSlug === service.slug;
              // Use backend colors when available, fall back to primary
              const color: string = service.icon_color ?? colors.primary;
              const bgColor: string = service.icon_bg_color ?? `${colors.primary}18`;

              return (
                <TouchableOpacity
                  key={service._id}
                  onPress={() => handleServiceTypeChange(service.slug)}
                  activeOpacity={0.7}
                  accessibilityRole="radio"
                  accessibilityLabel={service.name}
                  accessibilityState={{ selected: isSelected }}
                  style={[
                    styles.listCard,
                    isSelected && { borderColor: color, backgroundColor: `${color}08` },
                  ]}
                >
                  {/* Radio */}
                  <View style={[styles.radio, isSelected && { borderColor: color }]}>
                    {isSelected && <View style={[styles.radioDot, { backgroundColor: color }]} />}
                  </View>

                  {/* Icon */}
                  <View style={[styles.listIconWrap, { backgroundColor: bgColor }]}>
                    <Icon size={18} color={color} strokeWidth={1.75} />
                  </View>

                  {/* Text */}
                  <View style={styles.listTextWrap}>
                    <View style={styles.listNameRow}>
                      <Text style={styles.listName}>{service.name}</Text>
                      {service.show_ai_badge && (
                        <View style={styles.aiMatchBadge}>
                          <Sparkles size={9} color={colors.primary} strokeWidth={2} />
                          <Text style={styles.aiMatchLabel}>AI Match</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.listDescription} numberOfLines={1}>
                      {service.description}
                    </Text>
                    {!!service.info_text && (
                      <Text style={styles.infoText} numberOfLines={1}>
                        {service.info_text}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Section: Urgency */}
        <Text style={styles.sectionTitle}>How urgent is this appointment?</Text>
        <View style={styles.urgencyRow}>
          {URGENCY_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = urgency === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                onPress={() => setUrgency(option.id)}
                activeOpacity={0.7}
                accessibilityRole="radio"
                accessibilityLabel={option.label}
                accessibilityState={{ selected: isSelected }}
                style={[
                  styles.urgencyCard,
                  isSelected && {
                    borderColor: option.color,
                    backgroundColor: `${option.color}08`,
                  },
                ]}
              >
                {/* Top row: icon + radio */}
                <View style={styles.urgencyTopRow}>
                  <View style={[styles.urgencyIconWrap, { backgroundColor: `${option.color}18` }]}>
                    <Icon size={18} color={option.color} strokeWidth={1.75} />
                  </View>
                  <View style={[styles.radio, isSelected && { borderColor: option.color }]}>
                    {isSelected && (
                      <View style={[styles.radioDot, { backgroundColor: option.color }]} />
                    )}
                  </View>
                </View>

                {/* Label + badge */}
                <View style={styles.urgencyNameRow}>
                  <Text style={styles.urgencyName}>{option.label}</Text>
                  {option.badge && (
                    <View style={[styles.urgencyBadge, { backgroundColor: `${option.color}20` }]}>
                      <Text style={[styles.urgencyBadgeLabel, { color: option.color }]}>
                        {option.badge}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.urgencyDescription} numberOfLines={3}>
                  {option.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Section: Consultation Method — vertical list avoids cramped 3-col on narrow phones */}
        <Text style={styles.sectionTitle}>Choose Consultation Method</Text>
        <View style={styles.cardList}>
          {CONSULTATION_METHODS.map((method) => {
            const Icon = method.icon;
            const FooterIcon = method.footerIcon;
            const isSelected = consultationMethod === method.id;
            return (
              <TouchableOpacity
                key={method.id}
                onPress={() => setConsultationMethod(method.id)}
                activeOpacity={0.7}
                accessibilityRole="radio"
                accessibilityLabel={method.label}
                accessibilityState={{ selected: isSelected }}
                style={[
                  styles.listCard,
                  isSelected && {
                    borderColor: method.color,
                    backgroundColor: `${method.color}08`,
                  },
                ]}
              >
                {/* Radio */}
                <View style={[styles.radio, isSelected && { borderColor: method.color }]}>
                  {isSelected && (
                    <View style={[styles.radioDot, { backgroundColor: method.color }]} />
                  )}
                </View>

                {/* Icon */}
                <View style={[styles.listIconWrap, { backgroundColor: `${method.color}18` }]}>
                  <Icon size={18} color={method.color} strokeWidth={1.75} />
                </View>

                {/* Text */}
                <View style={styles.listTextWrap}>
                  <View style={styles.listNameRow}>
                    <Text style={styles.listName}>{method.label}</Text>
                    {method.recommended && (
                      <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedLabel}>Recommended</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.listDescription} numberOfLines={2}>
                    {method.description}
                  </Text>
                  <View style={styles.methodFooter}>
                    <FooterIcon size={10} color={colors.mutedForeground} strokeWidth={2} />
                    <Text style={styles.methodFooterLabel}>{method.footerLabel}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={[styles.footer, { paddingBottom: bottom }]}>
        <Button variant="primary" onPress={handleContinue} disabled={servicesLoading}>
          Continue
        </Button>
      </View>

      {/* Speed-dial backdrop */}
      <Animated.View
        pointerEvents={fabOpen ? 'auto' : 'none'}
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: '#000', opacity: backdropOpacity },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={closeFab} />
      </Animated.View>

      {/* Speed-dial sub-buttons — [label pill] [circle icon], staggered upward */}
      {(
        [
          { id: 'vitals', label: 'Vitals', icon: HeartPulse, color: '#ef4444', screen: 'Vitals' },
          {
            id: 'checkup',
            label: 'AI Health Check',
            icon: Sparkles,
            color: colors.primary,
            screen: 'HealthCheckupStart',
          },
          { id: 'support', label: 'Support', icon: Headphones, color: colors.secondary },
        ] as const
      ).map((action, i) => {
        const Icon = action.icon;
        const translateY = fabAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -(i + 1) * 64],
        });
        const opacity = fabAnim.interpolate({
          inputRange: [0, 0.2 + i * 0.1, 1],
          outputRange: [0, 0, 1],
        });

        const onPress =
          action.id === 'support'
            ? () => closeAndGo(() => void Linking.openURL('mailto:support@rapidcapsule.com'))
            : () =>
                closeAndGo(() =>
                  (navigation as any).navigate('Home', { screen: (action as any).screen })
                );

        return (
          <Animated.View
            key={action.id}
            pointerEvents={fabOpen ? 'auto' : 'none'}
            style={[
              styles.fabSubItem,
              { bottom: bottom + 80, transform: [{ translateY }], opacity },
            ]}
          >
            <View style={styles.fabSubLabelWrap}>
              <Text style={styles.fabSubLabel}>{action.label}</Text>
            </View>
            <TouchableOpacity
              onPress={onPress}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              style={[styles.fabSubBtn, { backgroundColor: action.color }]}
            >
              <Icon size={18} color="#fff" strokeWidth={2} />
            </TouchableOpacity>
          </Animated.View>
        );
      })}

      {/* Main FAB — rotates to × when open */}
      <TouchableOpacity
        onPress={fabOpen ? closeFab : openFab}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={fabOpen ? 'Close quick actions' : 'Quick actions'}
        style={[styles.fab, { bottom: bottom + 80 }]}
      >
        <Animated.View style={{ transform: [{ rotate: fabRotate }] }}>
          <Plus size={20} color="#fff" strokeWidth={2.5} />
        </Animated.View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Step progress
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  progressBars: {
    flexDirection: 'row',
    gap: 4,
  },
  progressPill: {
    height: 6,
    borderRadius: 3,
  },
  progressPillActive: {
    width: 32,
    backgroundColor: colors.primary,
  },
  progressPillInactive: {
    width: 16,
    backgroundColor: colors.border,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginLeft: 8,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },

  // AI Assessment Banner
  assessmentBanner: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${colors.success}30`,
    backgroundColor: `${colors.success}08`,
    padding: 14,
    marginBottom: 20,
  },
  assessmentBannerInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  assessmentIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${colors.success}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assessmentTextWrap: { flex: 1 },
  assessmentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 3,
  },
  assessmentSubtitle: {
    fontSize: 12,
    color: colors.mutedForeground,
    lineHeight: 18,
  },
  assessmentBold: {
    fontWeight: '700',
    color: colors.foreground,
  },
  assessmentActions: {
    flexDirection: 'row',
    gap: 10,
  },
  assessmentLinkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.success,
  },
  assessmentLinkLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  assessmentDismissBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  assessmentDismissLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.mutedForeground,
  },

  // Linked banner
  linkedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${colors.success}10`,
    borderWidth: 1,
    borderColor: `${colors.success}30`,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 20,
  },
  linkedBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: colors.success,
  },

  // Section title
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 10,
  },

  // Shared list card (service types + consultation method)
  cardList: {
    gap: 8,
    marginBottom: 24,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  listIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  listTextWrap: { flex: 1 },
  listNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  listName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.foreground,
  },
  listDescription: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  infoText: {
    fontSize: 10,
    color: colors.mutedForeground,
    fontStyle: 'italic',
    marginTop: 2,
  },

  // AI match badge
  aiMatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: `${colors.primary}15`,
  },
  aiMatchLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.3,
  },

  // Recommended badge (inline in method name row)
  recommendedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: `${colors.secondary}20`,
  },
  recommendedLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: 0.3,
  },

  // Method footer
  methodFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  methodFooterLabel: {
    fontSize: 10,
    color: colors.mutedForeground,
  },

  // Radio
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Urgency 2-col cards
  urgencyRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  urgencyCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  urgencyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  urgencyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgencyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  urgencyName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.foreground,
  },
  urgencyBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
  },
  urgencyBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  urgencyDescription: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.mutedForeground,
  },

  // Footer CTA
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },

  // FAB — main button
  fab: {
    position: 'absolute',
    right: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },

  // FAB sub-buttons — speed dial
  fabSubItem: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fabSubBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabSubLabelWrap: {
    backgroundColor: 'rgba(15,20,35,0.82)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  fabSubLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});
