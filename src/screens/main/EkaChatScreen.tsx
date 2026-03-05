import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {
  ArrowLeft,
  BrainCircuit,
  Clock,
  Plus,
  Send,
  X,
  Stethoscope,
  Pill,
  Heart,
  BarChart3,
  ClipboardList,
  ShoppingBag,
  Calendar,
  Wallet,
  Upload,
  Activity,
  ClipboardCheck,
  HeartPulse,
  FileText,
  Trash2,
  MessageSquarePlus,
  MessageCircle,
  Home,
  Globe,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Shield,
  Phone,
  Check,
} from 'lucide-react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {colors} from '../../theme/colors';
import {useEkaStore} from '../../store/eka';
import {ekaService} from '../../services/eka.service';
import type {
  EkaMessage,
  EkaArtifact,
  CheckupQuestion,
  Suggestion,
  EkaConversation,
} from '../../types/eka.types';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.82;

// ─── Quick Actions ──────────────────────────────────
const QUICK_ACTIONS = [
  {label: 'Just Chat', message: null, icon: MessageCircle, color: colors.foreground, action: 'focus_input'},
  {label: 'Health Checkup', message: 'Start a health checkup', icon: Stethoscope, color: colors.primary},
  {label: 'Drug Interactions', message: 'Check my drug interactions', icon: Pill, color: colors.secondary},
  {label: 'My Vitals', message: 'Show my recent vitals', icon: Activity, color: colors.success},
  {label: 'Health Score', message: 'Show my health score', icon: BarChart3, color: colors.accent},
  {label: 'Prescriptions', message: 'Show my prescriptions', icon: ClipboardList, color: '#8b5cf6'},
  {label: 'Pharmacy', message: 'Search the pharmacy', icon: ShoppingBag, color: colors.primary},
  {label: 'Appointments', message: 'Show my appointments', icon: Calendar, color: colors.secondary},
  {label: 'Wallet & Credits', message: 'Show my wallet and credits', icon: Wallet, color: colors.success},
  {label: 'Upload Rx', message: null, icon: Upload, color: colors.accent, action: 'upload_prescription'},
  {label: 'Recovery', message: 'Show my recovery dashboard', icon: Heart, color: colors.destructive},
  {label: 'Daily Check-in', message: 'I want to do my daily check-in', icon: ClipboardCheck, color: '#14b8a6'},
  {label: 'Coping Exercise', message: 'I need a coping exercise', icon: HeartPulse, color: '#ec4899'},
  {label: 'Screening', message: 'I want to take a screening assessment', icon: FileText, color: '#f59e0b'},
];

// ─── Language Options ───────────────────────────────
const LANGUAGES = [
  {label: 'English', flag: '🇬🇧'},
  {label: 'Pidgin', flag: '🇳🇬'},
  {label: 'Yoruba', flag: '🇳🇬'},
  {label: 'Hausa', flag: '🇳🇬'},
  {label: 'Igbo', flag: '🇳🇬'},
  {label: 'Swahili', flag: '🇰🇪'},
  {label: 'Lingala', flag: '🇨🇩'},
  {label: 'French', flag: '🇫🇷'},
  {label: 'Spanish', flag: '🇪🇸'},
];

// ─── Tool Loading Messages ──────────────────────────
const TOOL_LOADING: Record<string, string> = {
  get_vitals: 'Checking your vitals...',
  get_health_checkups: 'Looking at your health history...',
  get_prescriptions: 'Fetching your prescriptions...',
  get_appointments: 'Looking at your appointments...',
  search_pharmacy: 'Searching the pharmacy...',
  get_orders: 'Checking your orders...',
  get_wallet: 'Checking your wallet...',
  get_profile: 'Loading your profile...',
  get_health_score: 'Calculating your health score...',
  start_health_checkup: 'Starting your health checkup...',
  submit_checkup_symptoms: 'Processing your symptoms...',
  run_checkup_interview: 'Continuing the interview...',
  generate_checkup_report: 'Preparing your health report...',
  check_drug_interactions: 'Analyzing drug interactions...',
  analyze_prescription_upload: 'Reading your prescription...',
  analyze_existing_prescription: 'Analyzing your prescription...',
  get_recovery_profile: 'Loading your recovery profile...',
  get_recovery_dashboard: 'Fetching your recovery dashboard...',
  get_sobriety_stats: 'Loading sobriety stats...',
  get_daily_logs: 'Checking your daily logs...',
  log_daily_checkin: 'Saving your check-in...',
  start_screening: 'Setting up screening...',
  submit_screening: 'Scoring your responses...',
  run_coping_exercise: 'Setting up your exercise...',
  get_risk_assessment: 'Calculating risk assessment...',
  refine_risk_assessment: 'Refining your assessment...',
};

// ─── Action Link Navigation ─────────────────────────
const ACTION_ROUTES: Record<string, {tab: string; screen?: string}> = {
  book_appointment: {tab: 'Bookings'},
  appointments: {tab: 'Bookings'},
  vitals: {tab: 'Home', screen: 'VitalDetail'},
  health_checkup: {tab: 'Home', screen: 'HealthCheckupPatientInfo'},
  prescriptions: {tab: 'Home', screen: 'Prescriptions'},
  pharmacy: {tab: 'Pharmacy'},
  orders: {tab: 'Pharmacy'},
  wallet: {tab: 'Profile', screen: 'Wallet'},
  profile: {tab: 'Profile'},
};

// ─── Triage Colors ──────────────────────────────────
const TRIAGE_COLORS: Record<string, string> = {
  emergency: '#ef4444',
  emergency_ambulance: '#ef4444',
  consultation_24: '#f97316',
  consultation: '#eab308',
  self_care: '#22c55e',
};

// ═══════════════════════════════════════════════════════
// Main Screen
// ═══════════════════════════════════════════════════════
export default function EkaChatScreen() {
  const navigation = useNavigation<any>();
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // Store
  const messages = useEkaStore(s => s.messages);
  const isStreaming = useEkaStore(s => s.isStreaming);
  const artifact = useEkaStore(s => s.artifact);
  const checkupQuestion = useEkaStore(s => s.checkupQuestion);
  const suggestions = useEkaStore(s => s.suggestions);
  const loadingTool = useEkaStore(s => s.loadingTool);
  const conversations = useEkaStore(s => s.conversations);
  const currentConversationId = useEkaStore(s => s.currentConversationId);
  const language = useEkaStore(s => s.language);
  const sendMessage = useEkaStore(s => s.sendMessage);
  const answerCheckupQuestion = useEkaStore(s => s.answerCheckupQuestion);
  const newConversation = useEkaStore(s => s.newConversation);
  const loadConversation = useEkaStore(s => s.loadConversation);
  const fetchConversations = useEkaStore(s => s.fetchConversations);
  const deleteConvoAction = useEkaStore(s => s.deleteConversation);
  const renameConvoAction = useEkaStore(s => s.renameConversation);
  const setLanguage = useEkaStore(s => s.setLanguage);
  const initLanguage = useEkaStore(s => s.initLanguage);

  // Local state
  const [inputText, setInputText] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Init
  useFocusEffect(
    useCallback(() => {
      initLanguage();
      fetchConversations();
    }, []),
  );

  // Pulsing animation for tool loading
  useEffect(() => {
    if (loadingTool) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {toValue: 0.4, duration: 800, useNativeDriver: true}),
          Animated.timing(pulseAnim, {toValue: 1, duration: 800, useNativeDriver: true}),
        ]),
      );
      anim.start();
      return () => anim.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [loadingTool]);

  // Auto-scroll on new messages
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({animated: true}), 100);
  }, [messages, loadingTool, checkupQuestion]);

  // ─── Sidebar ────────────────────────────────────
  const openSidebar = () => {
    setSidebarOpen(true);
    Animated.parallel([
      Animated.timing(sidebarAnim, {toValue: 0, duration: 250, useNativeDriver: true}),
      Animated.timing(backdropAnim, {toValue: 1, duration: 250, useNativeDriver: true}),
    ]).start();
  };

  const closeSidebar = () => {
    Animated.parallel([
      Animated.timing(sidebarAnim, {toValue: -SIDEBAR_WIDTH, duration: 200, useNativeDriver: true}),
      Animated.timing(backdropAnim, {toValue: 0, duration: 200, useNativeDriver: true}),
    ]).start(() => setSidebarOpen(false));
  };

  // ─── Handlers ───────────────────────────────────
  const handleSend = () => {
    const text = inputText.trim();
    if (!text || isStreaming) return;
    setInputText('');
    sendMessage(text);
  };

  const handleQuickAction = (action: typeof QUICK_ACTIONS[number]) => {
    if (action.action === 'focus_input') {
      inputRef.current?.focus();
      return;
    }
    if (action.action === 'upload_prescription') {
      handleUpload();
      return;
    }
    if (action.message) {
      sendMessage(action.message);
    }
  };

  const handleUpload = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'mixed',
        quality: 0.8,
        selectionLimit: 1,
      });
      if (result.didCancel || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const formData = new FormData();
      formData.append('prescription', {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || 'prescription.jpg',
      } as any);

      const {uploadId, filename} = await ekaService.uploadPrescription(formData);
      sendMessage(`[Prescription uploaded: ${filename || asset.fileName}, Upload ID: ${uploadId}]`);
    } catch {
      Alert.alert('Upload Failed', 'Could not upload the file. Please try again.');
    }
  };

  const handleSuggestionTap = (suggestion: Suggestion) => {
    sendMessage(suggestion.message);
  };

  const handleConvoTap = (convo: EkaConversation) => {
    closeSidebar();
    loadConversation(convo._id);
  };

  const handleConvoLongPress = (convo: EkaConversation) => {
    Alert.alert(convo.title || 'Conversation', undefined, [
      {
        text: 'Rename',
        onPress: () => {
          Alert.prompt?.('Rename Conversation', undefined, (newTitle: string) => {
            if (newTitle?.trim()) renameConvoAction(convo._id, newTitle.trim());
          }, 'plain-text', convo.title);
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteConvoAction(convo._id),
      },
      {text: 'Cancel', style: 'cancel'},
    ]);
  };

  const handleNewChat = () => {
    closeSidebar();
    newConversation();
  };

  const navigateAction = (routeKey: string) => {
    const route = ACTION_ROUTES[routeKey];
    if (!route) return;
    if (route.screen) {
      navigation.getParent()?.navigate(route.tab, {screen: route.screen});
    } else {
      navigation.getParent()?.navigate(route.tab);
    }
  };

  // ─── Group conversations by date ────────────────
  const groupedConversations = groupByDate(conversations);

  // ═══════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top', 'bottom']}>
      {/* ─── Header ─────────────────────────────── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 12,
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}>
        <View style={{flexDirection: 'row', gap: 8}}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Home')}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Home size={20} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={openSidebar}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Clock size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <BrainCircuit size={16} color={colors.white} />
          </View>
          <View>
            <Text style={{fontWeight: '700', fontSize: 14, color: colors.foreground}}>Eka AI</Text>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
              <View style={{width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary}} />
              <Text style={{fontSize: 10, color: colors.primary, fontWeight: '500'}}>Online</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleNewChat}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <MessageSquarePlus size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* ─── Chat Area ──────────────────────────── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{flex: 1}}
        keyboardVerticalOffset={0}>
        <ScrollView
          ref={scrollRef}
          style={{flex: 1}}
          contentContainerStyle={{padding: 16, paddingBottom: 180, gap: 12}}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Welcome Screen */}
          {messages.length === 0 && <WelcomeScreen onAction={handleQuickAction} />}

          {/* Messages */}
          {messages.map((msg, idx) => (
            <React.Fragment key={msg.id}>
              <MessageBubble
                message={msg}
                isLast={idx === messages.length - 1}
                isStreaming={isStreaming}
                onActionLink={navigateAction}
              />
              {msg.artifact && <ArtifactCard artifact={msg.artifact} />}
            </React.Fragment>
          ))}

          {/* Tool Loading */}
          {loadingTool && (
            <Animated.View style={{opacity: pulseAnim, paddingLeft: 44}}>
              <View
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 16,
                  borderBottomLeftRadius: 4,
                  padding: 12,
                  alignSelf: 'flex-start',
                  maxWidth: '80%',
                }}>
                <Text style={{fontSize: 13, color: colors.mutedForeground, fontStyle: 'italic'}}>
                  {TOOL_LOADING[loadingTool] || 'Working on it...'}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Checkup Question Buttons */}
          {checkupQuestion && (
            <CheckupQuestionUI
              question={checkupQuestion}
              onAnswer={answerCheckupQuestion}
            />
          )}
        </ScrollView>

        {/* ─── Bottom Input Area ────────────────── */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.background,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: 8,
          }}>
          {/* Suggestion chips */}
          {suggestions.length > 0 && !isStreaming && !checkupQuestion && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{marginBottom: 10}}
              contentContainerStyle={{gap: 8}}>
              {suggestions.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.7}
                  onPress={() => handleSuggestionTap(s)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 16,
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}>
                  <Text style={{fontSize: 12, color: colors.primary, fontWeight: '500'}}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Language selector row */}
          {languageOpen && (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 6,
                marginBottom: 10,
                backgroundColor: colors.card,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 10,
              }}>
              {LANGUAGES.map(lang => (
                <TouchableOpacity
                  key={lang.label}
                  onPress={() => {
                    setLanguage(lang.label);
                    setLanguageOpen(false);
                  }}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 12,
                    backgroundColor: language === lang.label ? `${colors.primary}20` : colors.muted,
                    borderWidth: 1,
                    borderColor: language === lang.label ? colors.primary : colors.border,
                  }}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '500',
                      color: language === lang.label ? colors.primary : colors.foreground,
                    }}>
                    {lang.flag} {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Input bar */}
          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 20,
              flexDirection: 'row',
              alignItems: 'center',
              padding: 4,
            }}>
            <TouchableOpacity
              onPress={handleUpload}
              style={{width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center'}}>
              <Plus size={20} color={colors.mutedForeground} />
            </TouchableOpacity>

            <TextInput
              ref={inputRef}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask Eka anything..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              style={{
                flex: 1,
                fontSize: 14,
                color: colors.foreground,
                paddingHorizontal: 8,
                paddingVertical: 6,
                maxHeight: 100,
              }}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
              returnKeyType="send"
            />

            <TouchableOpacity
              onPress={() => setLanguageOpen(!languageOpen)}
              style={{width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center'}}>
              <Globe size={16} color={colors.mutedForeground} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSend}
              disabled={isStreaming || !inputText.trim()}
              style={{
                width: 38,
                height: 38,
                borderRadius: 14,
                backgroundColor: isStreaming || !inputText.trim() ? colors.muted : colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {isStreaming ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Send size={16} color={colors.white} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* ─── Sidebar Overlay ────────────────────── */}
      {sidebarOpen && (
        <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100}}>
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              opacity: backdropAnim,
            }}>
            <TouchableOpacity style={{flex: 1}} onPress={closeSidebar} activeOpacity={1} />
          </Animated.View>

          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: SIDEBAR_WIDTH,
              backgroundColor: colors.background,
              borderRightWidth: 1,
              borderRightColor: colors.border,
              transform: [{translateX: sidebarAnim}],
            }}>
            <SafeAreaView style={{flex: 1}} edges={['top']}>
              {/* Sidebar Header */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}>
                <Text style={{fontSize: 16, fontWeight: '700', color: colors.foreground}}>
                  Conversations
                </Text>
                <View style={{flexDirection: 'row', gap: 8}}>
                  <TouchableOpacity
                    onPress={handleNewChat}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      backgroundColor: colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Plus size={18} color={colors.white} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={closeSidebar}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      backgroundColor: colors.muted,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <X size={18} color={colors.foreground} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sidebar Body */}
              <ScrollView
                style={{flex: 1}}
                contentContainerStyle={{padding: 12, gap: 12}}
                showsVerticalScrollIndicator={false}>
                {groupedConversations.length === 0 && (
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.mutedForeground,
                      textAlign: 'center',
                      paddingTop: 40,
                    }}>
                    No conversations yet
                  </Text>
                )}
                {groupedConversations.map((group, groupIdx) => (
                  <ConversationGroup
                    key={group.label}
                    label={group.label}
                    count={group.items.length}
                    defaultOpen={groupIdx === 0}
                    items={group.items}
                    currentId={currentConversationId}
                    onTap={handleConvoTap}
                    onLongPress={handleConvoLongPress}
                    onDelete={deleteConvoAction}
                  />
                ))}
              </ScrollView>

              {/* Sidebar Footer — Home button */}
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  padding: 12,
                }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    closeSidebar();
                    navigation.navigate('Home');
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}>
                  <Home size={18} color={colors.primary} />
                  <Text style={{fontSize: 13, fontWeight: '600', color: colors.primary}}>
                    Back to Dashboard
                  </Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════
// Welcome Screen
// ═══════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════
// Collapsible Conversation Group
// ═══════════════════════════════════════════════════════
function ConversationGroup({
  label,
  count,
  defaultOpen,
  items,
  currentId,
  onTap,
  onLongPress,
  onDelete,
}: {
  label: string;
  count: number;
  defaultOpen: boolean;
  items: EkaConversation[];
  currentId: string | null;
  onTap: (c: EkaConversation) => void;
  onLongPress: (c: EkaConversation) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setOpen(!open)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 4,
          paddingVertical: 8,
        }}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: colors.mutedForeground,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
            {label}
          </Text>
          <View
            style={{
              backgroundColor: colors.muted,
              borderRadius: 8,
              paddingHorizontal: 6,
              paddingVertical: 1,
            }}>
            <Text style={{fontSize: 10, fontWeight: '700', color: colors.mutedForeground}}>
              {count}
            </Text>
          </View>
        </View>
        {open ? (
          <ChevronUp size={14} color={colors.mutedForeground} />
        ) : (
          <ChevronDown size={14} color={colors.mutedForeground} />
        )}
      </TouchableOpacity>

      {open && (
        <View style={{gap: 6, marginTop: 2}}>
          {items.map(convo => (
            <TouchableOpacity
              key={convo._id}
              activeOpacity={0.7}
              onPress={() => onTap(convo)}
              onLongPress={() => onLongPress(convo)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 12,
                borderRadius: 12,
                backgroundColor:
                  currentId === convo._id ? `${colors.primary}15` : colors.card,
                borderWidth: 1,
                borderColor:
                  currentId === convo._id ? `${colors.primary}40` : colors.border,
                gap: 10,
              }}>
              <BrainCircuit
                size={16}
                color={
                  currentId === convo._id ? colors.primary : colors.mutedForeground
                }
              />
              <View style={{flex: 1}}>
                <Text
                  numberOfLines={1}
                  style={{fontSize: 13, fontWeight: '500', color: colors.foreground}}>
                  {convo.title || 'Untitled'}
                </Text>
                <Text style={{fontSize: 10, color: colors.mutedForeground, marginTop: 2}}>
                  {formatRelativeDate(convo.updated_at || convo.created_at)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert('Delete?', 'This conversation will be permanently deleted.', [
                    {text: 'Cancel', style: 'cancel'},
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => onDelete(convo._id),
                    },
                  ]);
                }}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Trash2 size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════
// Welcome Screen
// ═══════════════════════════════════════════════════════
function WelcomeScreen({onAction}: {onAction: (a: typeof QUICK_ACTIONS[number]) => void}) {
  return (
    <View style={{alignItems: 'center', paddingTop: 20, paddingBottom: 20}}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}>
        <BrainCircuit size={32} color={colors.white} />
      </View>
      <Text style={{fontSize: 20, fontWeight: '800', color: colors.foreground}}>Hi, I'm Eka</Text>
      <Text
        style={{
          fontSize: 13,
          color: colors.mutedForeground,
          textAlign: 'center',
          marginTop: 6,
          paddingHorizontal: 40,
          lineHeight: 19,
        }}>
        Your AI health companion. I can check symptoms, analyze prescriptions, track your recovery, and more.
      </Text>

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 10,
          marginTop: 24,
          paddingHorizontal: 8,
        }}>
        {QUICK_ACTIONS.map((action, i) => {
          const Icon = action.icon;
          return (
            <TouchableOpacity
              key={i}
              activeOpacity={0.7}
              onPress={() => onAction(action)}
              style={{
                width: (SCREEN_WIDTH - 72) / 4,
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 4,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 14,
                gap: 6,
              }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: `${action.color}15`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Icon size={18} color={action.color} />
              </View>
              <Text
                numberOfLines={2}
                style={{
                  fontSize: 10,
                  fontWeight: '600',
                  color: colors.foreground,
                  textAlign: 'center',
                  lineHeight: 13,
                }}>
                {action.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════
// Message Bubble
// ═══════════════════════════════════════════════════════
function MessageBubble({
  message,
  isLast,
  isStreaming,
  onActionLink,
}: {
  message: EkaMessage;
  isLast: boolean;
  isStreaming: boolean;
  onActionLink: (key: string) => void;
}) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <View style={{flexDirection: 'row', justifyContent: 'flex-end'}}>
        <View
          style={{
            maxWidth: '80%',
            backgroundColor: colors.primary,
            borderRadius: 18,
            borderBottomRightRadius: 4,
            padding: 12,
          }}>
          <Text style={{fontSize: 14, color: colors.white, lineHeight: 20}}>{message.content}</Text>
        </View>
      </View>
    );
  }

  // Assistant message
  const showCursor = isLast && isStreaming && !message.content.endsWith('|');
  const displayText = message.content + (showCursor ? '|' : '');

  return (
    <View style={{flexDirection: 'row', gap: 10, alignItems: 'flex-start'}}>
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 2,
        }}>
        <BrainCircuit size={14} color={colors.white} />
      </View>
      <View
        style={{
          flex: 1,
          maxWidth: '85%',
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 18,
          borderBottomLeftRadius: 4,
          padding: 12,
        }}>
        <FormattedText text={displayText} onActionLink={onActionLink} />
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════
// Formatted Text (bold, bullets, action links)
// ═══════════════════════════════════════════════════════
function FormattedText({text, onActionLink}: {text: string; onActionLink: (key: string) => void}) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    if (lineIdx > 0) elements.push(<Text key={`br-${lineIdx}`}>{'\n'}</Text>);

    const isBullet = line.match(/^[\s]*[-•*]\s/);
    const content = isBullet ? line.replace(/^[\s]*[-•*]\s/, '') : line;
    const prefix = isBullet ? '  • ' : '';

    // Parse inline formatting: **bold** and [[action links]]
    const parts: React.ReactNode[] = [];
    let remaining = prefix + content;
    let partIdx = 0;

    while (remaining.length > 0) {
      // Check for action link [[Text|route]]
      const linkMatch = remaining.match(/\[\[([^|]+)\|([^\]]+)\]\]/);
      // Check for bold **text**
      const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);

      // Find earliest match
      let earliest: 'link' | 'bold' | null = null;
      let earliestIdx = remaining.length;

      if (linkMatch && linkMatch.index! < earliestIdx) {
        earliest = 'link';
        earliestIdx = linkMatch.index!;
      }
      if (boldMatch && boldMatch.index! < earliestIdx) {
        earliest = 'bold';
        earliestIdx = boldMatch.index!;
      }

      if (!earliest) {
        parts.push(
          <Text key={`${lineIdx}-${partIdx++}`} style={{fontSize: 14, color: colors.foreground, lineHeight: 20}}>
            {remaining}
          </Text>,
        );
        break;
      }

      // Text before match
      if (earliestIdx > 0) {
        parts.push(
          <Text key={`${lineIdx}-${partIdx++}`} style={{fontSize: 14, color: colors.foreground, lineHeight: 20}}>
            {remaining.slice(0, earliestIdx)}
          </Text>,
        );
      }

      if (earliest === 'link' && linkMatch) {
        const linkText = linkMatch[1];
        const routeKey = linkMatch[2];

        // Check for drug: prefix
        if (routeKey.startsWith('drug:')) {
          parts.push(
            <Text key={`${lineIdx}-${partIdx++}`} style={{fontSize: 14, color: colors.primary, fontWeight: '600'}}>
              {linkText}
            </Text>,
          );
        } else {
          parts.push(
            <Text
              key={`${lineIdx}-${partIdx++}`}
              style={{fontSize: 14, color: colors.primary, fontWeight: '600', textDecorationLine: 'underline'}}
              onPress={() => onActionLink(routeKey)}>
              {linkText}
            </Text>,
          );
        }
        remaining = remaining.slice(earliestIdx + linkMatch[0].length);
      } else if (earliest === 'bold' && boldMatch) {
        parts.push(
          <Text
            key={`${lineIdx}-${partIdx++}`}
            style={{fontSize: 14, color: colors.foreground, fontWeight: '700', lineHeight: 20}}>
            {boldMatch[1]}
          </Text>,
        );
        remaining = remaining.slice(earliestIdx + boldMatch[0].length);
      }
    }

    elements.push(
      <Text key={`line-${lineIdx}`}>
        {parts}
      </Text>,
    );
  });

  return <Text>{elements}</Text>;
}

// ═══════════════════════════════════════════════════════
// Artifact Card
// ═══════════════════════════════════════════════════════
function ArtifactCard({artifact}: {artifact: EkaArtifact}) {
  const [expanded, setExpanded] = useState(true);
  const data = artifact.data;

  const renderContent = () => {
    switch (artifact.type) {
      case 'health_checkup_start':
        return (
          <View style={{alignItems: 'center', gap: 8}}>
            <Stethoscope size={28} color={colors.primary} />
            <Text style={{fontSize: 13, fontWeight: '600', color: colors.foreground}}>
              Health Checkup in Progress
            </Text>
            <Text style={{fontSize: 11, color: colors.mutedForeground, textAlign: 'center'}}>
              Answer the questions below to complete your assessment
            </Text>
          </View>
        );

      case 'health_checkup_report':
        return <CheckupReportCard data={data} />;

      case 'drug_interaction_report':
        return <DrugInteractionCard data={data} />;

      case 'prescription_analysis':
        return <PrescriptionAnalysisCard data={data} />;

      case 'recovery_dashboard':
        return <RecoveryDashboardCard data={data} />;

      case 'screening_report':
        return <ScreeningReportCard data={data} />;

      case 'coping_exercise':
        return <CopingExerciseCard data={data} />;

      case 'safety_plan':
        return <SafetyPlanCard data={data} />;

      case 'risk_assessment':
        return <RiskAssessmentCard data={data} />;

      default:
        return (
          <Text style={{fontSize: 12, color: colors.mutedForeground}}>
            {artifact.type}
          </Text>
        );
    }
  };

  const title = getArtifactTitle(artifact.type);

  return (
    <View
      style={{
        marginLeft: 40,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        overflow: 'hidden',
      }}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setExpanded(!expanded)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 12,
          backgroundColor: `${colors.primary}08`,
        }}>
        <Text style={{fontSize: 12, fontWeight: '700', color: colors.primary}}>{title}</Text>
        {expanded ? (
          <ChevronUp size={14} color={colors.primary} />
        ) : (
          <ChevronDown size={14} color={colors.primary} />
        )}
      </TouchableOpacity>
      {expanded && <View style={{padding: 14, gap: 10}}>{renderContent()}</View>}
    </View>
  );
}

function getArtifactTitle(type: string): string {
  const titles: Record<string, string> = {
    health_checkup_start: 'Health Checkup',
    health_checkup_report: 'Health Report',
    drug_interaction_report: 'Drug Interactions',
    prescription_analysis: 'Prescription Analysis',
    recovery_dashboard: 'Recovery Dashboard',
    screening_report: 'Screening Report',
    coping_exercise: 'Coping Exercise',
    safety_plan: 'Safety Plan',
    risk_assessment: 'Risk Assessment',
  };
  return titles[type] || 'Report';
}

// ─── Artifact Sub-Cards ─────────────────────────────

function CheckupReportCard({data}: {data: any}) {
  const triage = data?.triage_level || data?.triage?.level || 'self_care';
  const conditions = data?.conditions?.slice(0, 3) || [];
  const triageColor = TRIAGE_COLORS[triage] || '#22c55e';

  return (
    <View style={{gap: 10}}>
      <View
        style={{
          backgroundColor: `${triageColor}15`,
          borderRadius: 10,
          padding: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}>
        <AlertTriangle size={16} color={triageColor} />
        <Text style={{fontSize: 12, fontWeight: '700', color: triageColor, textTransform: 'capitalize'}}>
          {triage.replace(/_/g, ' ')}
        </Text>
      </View>
      {conditions.map((c: any, i: number) => (
        <View key={i} style={{gap: 4}}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
            <Text style={{fontSize: 12, fontWeight: '600', color: colors.foreground, flex: 1}} numberOfLines={1}>
              {c.common_name || c.name}
            </Text>
            <Text style={{fontSize: 11, fontWeight: '700', color: colors.primary}}>
              {Math.round((c.probability || 0) * 100)}%
            </Text>
          </View>
          <View style={{height: 4, backgroundColor: colors.muted, borderRadius: 2}}>
            <View
              style={{
                height: 4,
                width: `${Math.min(Math.round((c.probability || 0) * 100), 100)}%`,
                backgroundColor: colors.primary,
                borderRadius: 2,
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

function DrugInteractionCard({data}: {data: any}) {
  const interactions = data?.interactions || data?.results || [];
  return (
    <View style={{gap: 8}}>
      {interactions.length === 0 && (
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          <Check size={16} color={colors.success} />
          <Text style={{fontSize: 12, fontWeight: '600', color: colors.success}}>
            No significant interactions found
          </Text>
        </View>
      )}
      {interactions.slice(0, 5).map((ix: any, i: number) => {
        const severity = ix.severity || 'moderate';
        const sevColor = severity === 'major' || severity === 'contraindicated' ? colors.destructive : severity === 'moderate' ? '#f97316' : colors.success;
        return (
          <View key={i} style={{gap: 4}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
              <View style={{backgroundColor: `${sevColor}15`, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2}}>
                <Text style={{fontSize: 9, fontWeight: '700', color: sevColor, textTransform: 'uppercase'}}>
                  {severity}
                </Text>
              </View>
              <Text style={{fontSize: 12, fontWeight: '600', color: colors.foreground, flex: 1}} numberOfLines={1}>
                {ix.drug1 || ix.drugs?.[0]} + {ix.drug2 || ix.drugs?.[1]}
              </Text>
            </View>
            {ix.description && (
              <Text style={{fontSize: 11, color: colors.mutedForeground}} numberOfLines={2}>
                {ix.description}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

function PrescriptionAnalysisCard({data}: {data: any}) {
  const medications = data?.medications || [];
  const readiness = data?.readiness_score ?? data?.confidence ?? 0;
  return (
    <View style={{gap: 8}}>
      <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
        <Text style={{fontSize: 12, fontWeight: '600', color: colors.foreground}}>
          {medications.length} medication{medications.length !== 1 ? 's' : ''} found
        </Text>
        <Text style={{fontSize: 11, fontWeight: '700', color: colors.primary}}>
          {Math.round(readiness * 100)}% confidence
        </Text>
      </View>
      <View style={{height: 4, backgroundColor: colors.muted, borderRadius: 2}}>
        <View
          style={{
            height: 4,
            width: `${Math.min(Math.round(readiness * 100), 100)}%`,
            backgroundColor: colors.primary,
            borderRadius: 2,
          }}
        />
      </View>
      {medications.slice(0, 4).map((med: any, i: number) => (
        <Text key={i} style={{fontSize: 12, color: colors.foreground}}>
          • {med.name || med.drug_name} {med.dosage || med.strength || ''}
        </Text>
      ))}
    </View>
  );
}

function RecoveryDashboardCard({data}: {data: any}) {
  const sobrietyDays = data?.sobriety_days ?? data?.profile?.sobriety_days ?? 0;
  const riskLevel = data?.risk_level ?? data?.profile?.risk_level ?? 'low';
  const riskColor = riskLevel === 'critical' || riskLevel === 'high' ? colors.destructive : riskLevel === 'moderate' ? '#f97316' : colors.success;

  return (
    <View style={{gap: 10}}>
      <View style={{flexDirection: 'row', gap: 12}}>
        <View style={{flex: 1, alignItems: 'center', backgroundColor: `${colors.success}10`, borderRadius: 12, padding: 12}}>
          <Text style={{fontSize: 24, fontWeight: '800', color: colors.success}}>{sobrietyDays}</Text>
          <Text style={{fontSize: 10, color: colors.mutedForeground, fontWeight: '600'}}>Sober Days</Text>
        </View>
        <View style={{flex: 1, alignItems: 'center', backgroundColor: `${riskColor}10`, borderRadius: 12, padding: 12}}>
          <Text style={{fontSize: 14, fontWeight: '700', color: riskColor, textTransform: 'capitalize'}}>{riskLevel}</Text>
          <Text style={{fontSize: 10, color: colors.mutedForeground, fontWeight: '600'}}>Risk Level</Text>
        </View>
      </View>
    </View>
  );
}

function ScreeningReportCard({data}: {data: any}) {
  const score = data?.total_score ?? data?.score ?? 0;
  const riskLevel = data?.risk_level || 'low';
  const instrument = data?.instrument || '';
  const riskColor = riskLevel === 'severe' || riskLevel === 'high' ? colors.destructive : riskLevel === 'moderate' || riskLevel === 'moderately_severe' ? '#f97316' : colors.success;

  return (
    <View style={{gap: 10}}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
        <View style={{alignItems: 'center'}}>
          <Text style={{fontSize: 28, fontWeight: '800', color: riskColor}}>{score}</Text>
          <Text style={{fontSize: 10, color: colors.mutedForeground, fontWeight: '600'}}>Score</Text>
        </View>
        <View style={{flex: 1}}>
          <View style={{backgroundColor: `${riskColor}15`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start'}}>
            <Text style={{fontSize: 11, fontWeight: '700', color: riskColor, textTransform: 'capitalize'}}>
              {riskLevel.replace(/_/g, ' ')}
            </Text>
          </View>
          {instrument && (
            <Text style={{fontSize: 11, color: colors.mutedForeground, marginTop: 4, textTransform: 'uppercase'}}>
              {instrument}
            </Text>
          )}
        </View>
      </View>
      {data?.subscale_scores && Object.entries(data.subscale_scores).slice(0, 4).map(([key, val]: [string, any]) => (
        <View key={key} style={{gap: 3}}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <Text style={{fontSize: 11, color: colors.foreground, fontWeight: '500', textTransform: 'capitalize'}}>
              {key.replace(/_/g, ' ')}
            </Text>
            <Text style={{fontSize: 11, color: colors.mutedForeground}}>{val}</Text>
          </View>
          <View style={{height: 3, backgroundColor: colors.muted, borderRadius: 2}}>
            <View style={{height: 3, width: `${Math.min(Number(val) * 10, 100)}%`, backgroundColor: riskColor, borderRadius: 2}} />
          </View>
        </View>
      ))}
    </View>
  );
}

function CopingExerciseCard({data}: {data: any}) {
  const steps = data?.steps || [];
  const name = data?.exercise_name || data?.name || 'Coping Exercise';
  const currentStep = data?.current_step ?? 0;

  return (
    <View style={{gap: 8}}>
      <Text style={{fontSize: 13, fontWeight: '700', color: colors.foreground}}>{name}</Text>
      {steps.map((step: any, i: number) => {
        const done = i < currentStep;
        return (
          <View key={i} style={{flexDirection: 'row', alignItems: 'flex-start', gap: 8}}>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: done ? colors.success : colors.muted,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 1,
              }}>
              {done ? (
                <Check size={12} color={colors.white} />
              ) : (
                <Text style={{fontSize: 10, fontWeight: '700', color: colors.mutedForeground}}>{i + 1}</Text>
              )}
            </View>
            <Text style={{fontSize: 12, color: done ? colors.success : colors.foreground, flex: 1, lineHeight: 18}}>
              {typeof step === 'string' ? step : step.instruction || step.text || ''}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function SafetyPlanCard({data}: {data: any}) {
  const resources = data?.emergency_resources || data?.resources || [];
  return (
    <View style={{gap: 10}}>
      <View
        style={{
          backgroundColor: `${colors.destructive}15`,
          borderRadius: 10,
          padding: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}>
        <Shield size={20} color={colors.destructive} />
        <View style={{flex: 1}}>
          <Text style={{fontSize: 13, fontWeight: '700', color: colors.destructive}}>
            Safety Plan Active
          </Text>
          <Text style={{fontSize: 11, color: colors.mutedForeground}}>
            If you're in immediate danger, call emergency services
          </Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => Linking.openURL('tel:999')}
        style={{
          backgroundColor: colors.destructive,
          borderRadius: 12,
          padding: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}>
        <Phone size={18} color={colors.white} />
        <Text style={{fontSize: 14, fontWeight: '700', color: colors.white}}>Call Emergency (999)</Text>
      </TouchableOpacity>
      {resources.map((r: any, i: number) => (
        <TouchableOpacity
          key={i}
          onPress={() => r.phone && Linking.openURL(`tel:${r.phone}`)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            padding: 10,
            backgroundColor: colors.muted,
            borderRadius: 10,
          }}>
          <Phone size={14} color={colors.primary} />
          <View style={{flex: 1}}>
            <Text style={{fontSize: 12, fontWeight: '600', color: colors.foreground}}>
              {r.name || r.title}
            </Text>
            {r.phone && (
              <Text style={{fontSize: 11, color: colors.primary}}>{r.phone}</Text>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function RiskAssessmentCard({data}: {data: any}) {
  const score = data?.score ?? data?.risk_score ?? 0;
  const level = data?.level ?? data?.risk_level ?? 'low';
  const factors = data?.top_factors?.slice(0, 3) || [];
  const riskColor = level === 'critical' || level === 'high' ? colors.destructive : level === 'moderate' ? '#f97316' : colors.success;

  return (
    <View style={{gap: 10}}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
        <View style={{alignItems: 'center'}}>
          <Text style={{fontSize: 28, fontWeight: '800', color: riskColor}}>{score}</Text>
          <Text style={{fontSize: 10, color: colors.mutedForeground, fontWeight: '600'}}>/ 100</Text>
        </View>
        <View style={{flex: 1}}>
          <View style={{backgroundColor: `${riskColor}15`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start'}}>
            <Text style={{fontSize: 11, fontWeight: '700', color: riskColor, textTransform: 'capitalize'}}>
              {level} Risk
            </Text>
          </View>
        </View>
      </View>
      {factors.map((f: any, i: number) => (
        <View key={i} style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <Text style={{fontSize: 12, color: colors.foreground, flex: 1}}>{f.label || f.signal}</Text>
          <View style={{backgroundColor: `${colors.destructive}15`, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2}}>
            <Text style={{fontSize: 10, fontWeight: '700', color: colors.destructive}}>+{f.contribution}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ═══════════════════════════════════════════════════════
// Checkup Question UI
// ═══════════════════════════════════════════════════════
function CheckupQuestionUI({
  question,
  onAnswer,
}: {
  question: CheckupQuestion;
  onAnswer: (answer: string) => void;
}) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  if (question.type === 'single') {
    return (
      <View style={{marginLeft: 40, gap: 8}}>
        <Text style={{fontSize: 12, fontWeight: '600', color: colors.mutedForeground}}>
          Select your answer:
        </Text>
        <View style={{flexDirection: 'row', gap: 8}}>
          {['Yes', 'No', 'Not sure'].map(opt => (
            <TouchableOpacity
              key={opt}
              activeOpacity={0.7}
              onPress={() => onAnswer(opt)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
              }}>
              <Text style={{fontSize: 13, fontWeight: '600', color: colors.foreground}}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  if (question.type === 'group_single') {
    return (
      <View style={{marginLeft: 40, gap: 6}}>
        <Text style={{fontSize: 12, fontWeight: '600', color: colors.mutedForeground}}>
          Select one:
        </Text>
        {(question.items || []).map(item => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.7}
            onPress={() => onAnswer(item.common_name || item.name)}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 12,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
            <Text style={{fontSize: 13, color: colors.foreground}}>{item.common_name || item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  // group_multiple
  const toggleItem = (name: string) => {
    setSelectedItems(prev =>
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name],
    );
  };

  return (
    <View style={{marginLeft: 40, gap: 8}}>
      <Text style={{fontSize: 12, fontWeight: '600', color: colors.mutedForeground}}>
        Select all that apply:
      </Text>
      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 6}}>
        {(question.items || []).map(item => {
          const name = item.common_name || item.name;
          const selected = selectedItems.includes(name);
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              onPress={() => toggleItem(name)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 12,
                backgroundColor: selected ? `${colors.primary}15` : colors.card,
                borderWidth: 1,
                borderColor: selected ? colors.primary : colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}>
              {selected && <Check size={12} color={colors.primary} />}
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '500',
                  color: selected ? colors.primary : colors.foreground,
                }}>
                {name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {selectedItems.length > 0 && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            onAnswer(selectedItems.join(', '));
            setSelectedItems([]);
          }}
          style={{
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: colors.primary,
            alignItems: 'center',
          }}>
          <Text style={{fontSize: 13, fontWeight: '600', color: colors.white}}>
            Continue with {selectedItems.length} selected
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════
function groupByDate(convos: EkaConversation[]) {
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000).toDateString();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);

  const groups: {label: string; items: EkaConversation[]}[] = [
    {label: 'Today', items: []},
    {label: 'Yesterday', items: []},
    {label: 'This Week', items: []},
    {label: 'Older', items: []},
  ];

  const sorted = [...convos].sort(
    (a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime(),
  );

  for (const c of sorted) {
    const d = new Date(c.updated_at || c.created_at);
    const ds = d.toDateString();
    if (ds === today) groups[0].items.push(c);
    else if (ds === yesterday) groups[1].items.push(c);
    else if (d >= weekAgo) groups[2].items.push(c);
    else groups[3].items.push(c);
  }

  return groups.filter(g => g.items.length > 0);
}

function formatRelativeDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-GB', {day: 'numeric', month: 'short'});
}
