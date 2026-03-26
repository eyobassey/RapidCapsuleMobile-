import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CheckCircle, ChevronRight, ShieldCheck, X } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Header, Text } from '../../../components/ui';
import type { BookingsStackParamList } from '../../../navigation/stacks/BookingsStack';
import { colors } from '../../../theme/colors';

type Nav = NativeStackNavigationProp<BookingsStackParamList>;
type Route = RouteProp<BookingsStackParamList, 'ConsentScreen'>;

// ─── Content types ────────────────────────────────────────
type Section =
  | { heading: string; body: string; bullets?: never }
  | { heading: string; bullets: string[]; body?: never };

// ─── Consent items ────────────────────────────────────────
const CONSENT_ITEMS = [
  {
    id: 'telemedicine',
    title: 'Telemedicine Consent',
    description:
      'I understand and consent to receive healthcare services via telemedicine technology.',
    required: true,
    sections: [
      {
        heading: 'Understanding Telemedicine',
        body: 'Telemedicine involves the use of electronic communications to enable healthcare providers to deliver services remotely. This may include video consultations, audio calls, or text-based messaging.',
      },
      {
        heading: 'Benefits and Limitations',
        bullets: [
          'Convenient access to healthcare from your location',
          'Reduced travel time and waiting periods',
          'May not be suitable for all medical conditions',
          'Physical examination limitations apply',
        ],
      },
      {
        heading: 'Your Responsibilities',
        body: 'You agree to provide accurate and complete information about your health history, current symptoms, and any medications you are taking. You understand that incomplete or inaccurate information may affect the quality of care.',
      },
      {
        heading: 'Emergency Situations',
        body: 'If you are experiencing a medical emergency, please call your local emergency services immediately. Telemedicine is not a substitute for emergency care.',
      },
    ] as Section[],
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    description:
      'I have read and agree to the privacy policy regarding my personal health information.',
    required: true,
    sections: [
      {
        heading: 'Information We Collect',
        body: 'We collect personal information including your name, contact details, health history, and consultation records to provide you with healthcare services.',
      },
      {
        heading: 'How We Use Your Information',
        bullets: [
          'To provide and improve our healthcare services',
          'To match you with appropriate healthcare providers',
          'To communicate with you about your appointments',
          'To comply with legal and regulatory requirements',
        ],
      },
      {
        heading: 'Data Security',
        body: 'We implement industry-standard security measures to protect your personal health information. All data is encrypted in transit and at rest.',
      },
      {
        heading: 'Your Rights',
        body: 'You have the right to access, correct, or request deletion of your personal information. Contact our support team to exercise these rights.',
      },
    ] as Section[],
  },
  {
    id: 'data_sharing',
    title: 'Doctor Matching Data Sharing',
    description:
      'I consent to sharing my health data for matching with appropriate healthcare providers.',
    required: true,
    sections: [
      {
        heading: 'How We Match You with Specialists',
        body: 'To provide you with the best possible care, we use your health information to match you with appropriate healthcare specialists.',
      },
      {
        heading: 'Information Shared',
        bullets: [
          'Your symptoms and health concerns',
          'Relevant medical history',
          'Preferred consultation method',
          'Scheduling preferences',
        ],
      },
      {
        heading: 'Specialist Access',
        body: 'Healthcare providers will have access to relevant health information necessary for your consultation. They are bound by professional confidentiality obligations.',
      },
      {
        heading: 'AI-Assisted Matching',
        body: 'We may use AI technology to suggest specialists based on your health profile. Final selection remains your choice.',
      },
    ] as Section[],
  },
  {
    id: 'prescription',
    title: 'Prescription Verification',
    description: 'I understand prescriptions may require verification and in-person follow-up.',
    required: true,
    sections: [
      {
        heading: 'Prescription Process',
        body: 'Prescriptions issued through telemedicine consultations are subject to verification and may require additional steps before fulfillment.',
      },
      {
        heading: 'Controlled Substances',
        body: 'Certain medications, including controlled substances, may not be prescribed through telemedicine and may require an in-person evaluation.',
      },
      {
        heading: 'Pharmacy Coordination',
        bullets: [
          'Prescriptions will be sent electronically to your chosen pharmacy',
          'You may need to provide identification when picking up medications',
          'Some prescriptions may require prior authorization from insurance',
        ],
      },
      {
        heading: 'Follow-up Care',
        body: 'You understand that some conditions may require in-person follow-up care, laboratory tests, or additional consultations with specialists.',
      },
    ] as Section[],
  },
] as const;

type ConsentId = (typeof CONSENT_ITEMS)[number]['id'];
type ConsentItem = (typeof CONSENT_ITEMS)[number];

// Stable reference — derived from a constant so it never changes
const ALL_REQUIRED_IDS: ConsentId[] = CONSENT_ITEMS.filter((i) => i.required).map((i) => i.id);

// ─── Checkbox ─────────────────────────────────────────────
function ConsentCheckbox({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.7}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={[styles.checkbox, checked && styles.checkboxChecked]}
    >
      {checked && <CheckCircle size={14} color="#fff" strokeWidth={3} />}
    </TouchableOpacity>
  );
}

// ─── Detail sheet content ─────────────────────────────────
function ConsentDetailSheet({
  item,
  isChecked,
  onAccept,
  onClose,
}: {
  item: ConsentItem;
  isChecked: boolean;
  onAccept: () => void;
  onClose: () => void;
}) {
  const { bottom } = useSafeAreaInsets();

  return (
    <View style={[styles.sheet, { paddingBottom: bottom + 16 }]}>
      {/* Handle */}
      <View style={styles.sheetHandle} />

      {/* Header */}
      <View style={styles.sheetHeader}>
        <Text style={styles.sheetTitle}>{item.title}</Text>
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <X size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
      <View style={styles.sheetDivider} />

      {/* Scrollable content */}
      <ScrollView
        style={styles.sheetScroll}
        contentContainerStyle={styles.sheetScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {item.sections.map((section, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            {section.body ? (
              <Text style={styles.sectionBody}>{section.body}</Text>
            ) : (
              <View style={styles.bulletList}>
                {section.bullets?.map((bullet, bi) => (
                  <View key={bi} style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Sticky footer */}
      <View style={styles.sheetDivider} />
      <View style={styles.sheetFooter}>
        <TouchableOpacity
          onPress={onAccept}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={isChecked ? 'Revoke consent' : 'I understand and accept'}
          style={[styles.acceptBtn, isChecked && styles.revokeBtn]}
        >
          <Text style={[styles.acceptBtnLabel, isChecked && styles.revokeBtnLabel]}>
            {isChecked ? 'Revoke Consent' : 'I Understand & Accept'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────
export default function ConsentScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { bottom } = useSafeAreaInsets();

  const healthCheckupId = route.params?.healthCheckupId;
  const healthCheckupSummary = route.params?.healthCheckupSummary;

  const [checked, setChecked] = useState<Set<ConsentId>>(new Set());
  const [detailItem, setDetailItem] = useState<ConsentItem | null>(null);

  const allChecked = ALL_REQUIRED_IDS.every((id) => checked.has(id));

  const toggleItem = useCallback((id: ConsentId) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (allChecked) {
      setChecked(new Set());
    } else {
      setChecked(new Set(ALL_REQUIRED_IDS));
    }
  }, [allChecked]);

  const handleSheetAccept = useCallback(() => {
    if (detailItem) toggleItem(detailItem.id);
    setDetailItem(null);
  }, [detailItem, toggleItem]);

  const handleContinue = useCallback(() => {
    navigation.navigate('SelectSpecialty', {
      ...(healthCheckupId ? { healthCheckupId, healthCheckupSummary } : {}),
    });
  }, [navigation, healthCheckupId, healthCheckupSummary]);

  const checkedCount = useMemo(() => checked.size, [checked]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Agreement & Consent" onBack={() => navigation.goBack()} />

      {/* Step progress */}
      <View style={styles.progressRow}>
        <View style={styles.progressBars}>
          {[1, 2, 3, 4, 5, 6].map((step) => (
            <View
              key={step}
              style={[
                styles.progressPill,
                step <= 2 ? styles.progressPillActive : styles.progressPillInactive,
              ]}
            />
          ))}
        </View>
        <Text style={styles.progressLabel}>Step 2 of 6</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroIconWrap}>
            <ShieldCheck size={32} color="#fff" strokeWidth={1.75} />
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>Terms & Consent</Text>
            <Text style={styles.heroSubtitle}>
              Please review and accept the following agreements to continue with your appointment
              booking.
            </Text>
          </View>
        </View>

        {/* Select all row */}
        <TouchableOpacity
          onPress={toggleAll}
          activeOpacity={0.7}
          accessibilityRole="checkbox"
          accessibilityLabel={allChecked ? 'Deselect all agreements' : 'Select all agreements'}
          accessibilityState={{ checked: allChecked }}
          style={styles.selectAllRow}
        >
          <ConsentCheckbox checked={allChecked} onToggle={toggleAll} />
          <Text style={styles.selectAllLabel}>Select all agreements</Text>
          {checkedCount > 0 && !allChecked && (
            <Text style={styles.checkedCount}>
              {checkedCount}/{CONSENT_ITEMS.length}
            </Text>
          )}
        </TouchableOpacity>

        {/* Consent items */}
        <View style={styles.itemsList}>
          {CONSENT_ITEMS.map((item) => {
            const isChecked = checked.has(item.id);
            return (
              <View
                key={item.id}
                style={[styles.consentCard, isChecked && styles.consentCardChecked]}
              >
                <View style={styles.consentCardTop}>
                  <ConsentCheckbox checked={isChecked} onToggle={() => toggleItem(item.id)} />
                  <View style={styles.consentCardText}>
                    <View style={styles.consentTitleRow}>
                      <Text style={styles.consentTitle}>{item.title}</Text>
                      {item.required && (
                        <View style={styles.requiredBadge}>
                          <Text style={styles.requiredLabel}>REQUIRED</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.consentDescription}>{item.description}</Text>
                    <TouchableOpacity
                      onPress={() => setDetailItem(item)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`View details for ${item.title}`}
                      style={styles.viewDetailsRow}
                    >
                      <Text style={styles.viewDetailsLabel}>View details</Text>
                      <ChevronRight size={13} color={colors.primary} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={[styles.footer, { paddingBottom: bottom }]}>
        {!allChecked && (
          <Text style={styles.footerHint}>
            Accept all {ALL_REQUIRED_IDS.length} required agreements to continue
          </Text>
        )}
        <Button variant="primary" onPress={handleContinue} disabled={!allChecked}>
          Continue
        </Button>
      </View>

      {/* Detail bottom sheet */}
      <Modal
        visible={detailItem !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailItem(null)}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setDetailItem(null)}
          />
          {detailItem && (
            <ConsentDetailSheet
              item={detailItem}
              isChecked={checked.has(detailItem.id)}
              onAccept={handleSheetAccept}
              onClose={() => setDetailItem(null)}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Progress
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  progressBars: { flexDirection: 'row', gap: 4 },
  progressPill: { height: 6, borderRadius: 3 },
  progressPillActive: { width: 32, backgroundColor: colors.primary },
  progressPillInactive: { width: 16, backgroundColor: colors.border },
  progressLabel: { fontSize: 12, color: colors.mutedForeground, marginLeft: 8 },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },

  // Hero banner
  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heroTextWrap: { flex: 1 },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 4 },
  heroSubtitle: { fontSize: 12, lineHeight: 18, color: 'rgba(255,255,255,0.8)' },

  // Select all row
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  selectAllLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: colors.foreground },
  checkedCount: { fontSize: 12, fontWeight: '600', color: colors.mutedForeground },

  // Consent items
  itemsList: { gap: 10 },
  consentCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  consentCardChecked: {
    borderColor: `${colors.primary}40`,
    backgroundColor: `${colors.primary}05`,
  },
  consentCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  consentCardText: { flex: 1 },
  consentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  consentTitle: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  consentDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.mutedForeground,
    marginBottom: 8,
  },
  viewDetailsRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewDetailsLabel: { fontSize: 12, fontWeight: '600', color: colors.primary },

  // Required badge
  requiredBadge: {
    backgroundColor: `${colors.primary}18`,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  requiredLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },

  // Checkbox
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },

  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: 8,
  },
  footerHint: { fontSize: 11, color: colors.mutedForeground, textAlign: 'center' },

  // Modal overlay
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  // Bottom sheet
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
    flex: 1,
    marginRight: 12,
  },
  sheetDivider: { height: 1, backgroundColor: colors.border },
  sheetScroll: { flexShrink: 1 },
  sheetScrollContent: { paddingHorizontal: 20, paddingVertical: 20, gap: 20 },

  // Content sections
  section: { gap: 8 },
  sectionHeading: { fontSize: 15, fontWeight: '700', color: colors.foreground },
  sectionBody: { fontSize: 14, lineHeight: 22, color: colors.mutedForeground },
  bulletList: { gap: 8 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.mutedForeground,
    marginTop: 8,
    flexShrink: 0,
  },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 22, color: colors.mutedForeground },

  // Sheet footer
  sheetFooter: { paddingHorizontal: 20, paddingTop: 16 },
  acceptBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  acceptBtnLabel: { fontSize: 15, fontWeight: '700', color: '#fff' },
  revokeBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  revokeBtnLabel: { color: colors.mutedForeground },
});
