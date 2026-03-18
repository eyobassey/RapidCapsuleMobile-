import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Download,
  FileText,
  Globe,
  Heart,
  HeartPulse,
  Home,
  MessageCircle,
  MessageSquarePlus,
  PanelLeft,
  Phone,
  Pill,
  Plus,
  Search,
  Send,
  Shield,
  ShoppingBag,
  Stethoscope,
  Trash2,
  Upload,
  Wallet,
  X,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Linking,
  Platform,
  TextInput as RNTextInput,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Polyline, Circle as SvgCircle, Text as SvgText } from 'react-native-svg';
import WebView from 'react-native-webview';
import { Text } from '../../components/ui/Text';
import { TextInput } from '../../components/ui/TextInput';
import { ekaService } from '../../services/eka.service';
import { healthCheckupService } from '../../services/healthCheckup.service';
import { useAuthStore } from '../../store/auth';
import { useEkaStore } from '../../store/eka';
import { colors } from '../../theme/colors';
import type {
  CheckupQuestion,
  EkaArtifact,
  EkaConversation,
  EkaMessage,
  Suggestion,
} from '../../types/eka.types';
import {
  generateCopingExercisePDF,
  generateDrugInteractionPDF,
  generatePrescriptionPDF,
  generateRecoveryDashboardPDF,
  generateRiskAssessmentPDF,
  generateScreeningReportPDF,
} from '../../utils/artifactPdf';
import { generateHealthCheckupPDF } from '../../utils/healthCheckupPdf';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.82;

// ─── Quick Actions ──────────────────────────────────
const QUICK_ACTIONS = [
  {
    label: 'Just Chat',
    message: null,
    icon: MessageCircle,
    color: colors.foreground,
    action: 'focus_input',
  },
  {
    label: 'Health Checkup',
    message: 'Start a health checkup',
    icon: Stethoscope,
    color: colors.primary,
  },
  {
    label: 'Drug Interactions',
    message: 'Check my drug interactions',
    icon: Pill,
    color: colors.secondary,
  },
  { label: 'My Vitals', message: 'Show my recent vitals', icon: Activity, color: colors.success },
  { label: 'Health Score', message: 'Show my health score', icon: BarChart3, color: colors.accent },
  {
    label: 'Prescriptions',
    message: 'Show my prescriptions',
    icon: ClipboardList,
    color: '#8b5cf6',
  },
  { label: 'Pharmacy', message: 'Search the pharmacy', icon: ShoppingBag, color: colors.primary },
  {
    label: 'Appointments',
    message: 'Show my appointments',
    icon: Calendar,
    color: colors.secondary,
  },
  {
    label: 'Wallet & Credits',
    message: 'Show my wallet and credits',
    icon: Wallet,
    color: colors.success,
  },
  {
    label: 'Upload Rx',
    message: null,
    icon: Upload,
    color: colors.accent,
    action: 'upload_prescription',
  },
  {
    label: 'Recovery',
    message: 'Show my recovery dashboard',
    icon: Heart,
    color: colors.destructive,
  },
  {
    label: 'Daily Check-in',
    message: 'I want to do my daily check-in',
    icon: ClipboardCheck,
    color: '#14b8a6',
  },
  {
    label: 'Coping Exercise',
    message: 'I need a coping exercise',
    icon: HeartPulse,
    color: '#ec4899',
  },
  {
    label: 'Screening',
    message: 'I want to take a screening assessment',
    icon: FileText,
    color: '#f59e0b',
  },
];

// ─── Language Options ───────────────────────────────
const LANGUAGES = [
  { label: 'English', flag: '🇬🇧' },
  { label: 'Pidgin', flag: '🇳🇬' },
  { label: 'Yoruba', flag: '🇳🇬' },
  { label: 'Hausa', flag: '🇳🇬' },
  { label: 'Igbo', flag: '🇳🇬' },
  { label: 'Swahili', flag: '🇰🇪' },
  { label: 'Lingala', flag: '🇨🇩' },
  { label: 'French', flag: '🇫🇷' },
  { label: 'Spanish', flag: '🇪🇸' },
];

// ─── Tool Loading Witty Phrases ─────────────────────
// Phrases are keyed by tool name. Each entry has:
//   - `default`: shown when no keyword context is detected
//   - `keywords`: map of word → phrase, matched against the user's message
// This lets the phrase echo what the user actually asked without any backend changes.
type PhraseEntry = {
  default: string[];
  keywords: Record<string, string>;
};

const TOOL_LOADING_PHRASES: Record<string, PhraseEntry> = {
  get_vitals: {
    default: [
      'Pulling up your vitals… no stethoscope required.',
      'Checking the numbers — heart rate, BP, the works.',
      'Fetching your vitals. The body has a lot to say.',
      "Reading your vitals… let's see what's going on.",
      'Looking up your health readings — one moment.',
      "Digging into your biometrics. Data doesn't lie.",
      'Gathering your latest vital signs…',
      'Your numbers are loading — almost there.',
      'Pulling the full vitals picture together…',
      'Cross-checking your vitals history right now.',
    ],
    keywords: {
      heart: 'Fetching your heart rate data…',
      'blood pressure': 'Pulling up your blood pressure readings…',
      bp: "Checking your BP — let's see the trend.",
      oxygen: 'Looking up your oxygen levels…',
      spo2: 'Fetching your SpO₂ readings…',
      sugar: 'Pulling your blood sugar data…',
      glucose: 'Checking your glucose readings…',
      weight: 'Fetching your weight history…',
      temperature: 'Looking up your temperature readings…',
    },
  },
  get_health_checkups: {
    default: [
      'Flipping through your health history…',
      'Consulting past-you to help present-you.',
      'Digging through the archives — one sec.',
      'Pulling up your previous checkups…',
      'Reviewing your health records carefully.',
      "Looking back at what's been checked before.",
      'Searching through your checkup history…',
      'Fetching your past health assessments…',
      'Loading your checkup timeline…',
      "Going through what's on file for you.",
    ],
    keywords: {
      last: 'Fetching your most recent checkup…',
      previous: 'Looking up your previous checkup results…',
      history: 'Digging into your health history…',
      report: 'Pulling your health checkup report…',
      result: 'Fetching your checkup results…',
    },
  },
  get_prescriptions: {
    default: [
      'Fetching your prescriptions… no white coat required.',
      'Rounding up your meds — digitally, of course.',
      'Checking what the doctor ordered.',
      'Pulling your prescription list…',
      'Looking up your current medications.',
      'Gathering your prescription records.',
      'Loading your medication history…',
      'Retrieving your active prescriptions…',
      'Pulling everything the doctor prescribed…',
      'Compiling your full medications list.',
    ],
    keywords: {
      medication: 'Looking up your current medications…',
      medicine: 'Pulling your medicine list…',
      tablet: 'Checking your prescription for tablets…',
      capsule: 'Fetching your capsule prescriptions…',
      dose: 'Looking up your dosage details…',
      dosage: 'Checking dosage instructions from your prescriptions…',
      refill: 'Checking which prescriptions are due for a refill…',
      current: 'Loading your current prescriptions…',
      active: 'Pulling your active prescriptions…',
    },
  },
  get_appointments: {
    default: [
      'Scanning your calendar for appointments…',
      "Checking what's on the health horizon.",
      'Pulling your schedule — hopefully not too packed.',
      'Looking up your upcoming appointments…',
      'Fetching your bookings — back in a sec.',
      "Checking what's been lined up for you.",
      'Loading your appointment history…',
      'Reviewing your scheduled consultations…',
      "Looking at what's coming up for you…",
      'Pulling together your booking details.',
    ],
    keywords: {
      next: 'Looking for your next appointment…',
      upcoming: 'Checking your upcoming appointments…',
      today: 'Checking if you have anything booked today…',
      tomorrow: 'Looking for appointments lined up for tomorrow…',
      doctor: 'Fetching your doctor appointments…',
      specialist: 'Looking for your specialist bookings…',
      missed: 'Checking for any missed appointments…',
      cancel: 'Pulling up appointments you might want to reschedule…',
      book: "Looking at what's been scheduled for you…",
    },
  },
  search_pharmacy: {
    default: [
      "Searching the pharmacy… won't be long.",
      'Combing the shelves for what you need.',
      'Checking availability and prices for you.',
      'Looking up your medication at nearby pharmacies…',
      'Scanning pharmacy stock — one moment.',
      'Finding the best options near you.',
      'Searching across pharmacies for a match…',
      'Checking which pharmacies have this in stock…',
      'Hunting down the best price for you.',
      'Browsing the pharmacy catalogue right now.',
    ],
    keywords: {
      price: 'Comparing prices across pharmacies…',
      cost: "Looking up how much that'll cost…",
      generic: 'Searching for generic alternatives…',
      brand: 'Looking up branded options…',
      near: 'Finding pharmacies near you…',
      cheap: 'Finding the most affordable option…',
      stock: 'Checking current stock levels…',
      available: 'Checking availability right now…',
      deliver: 'Looking for delivery options…',
    },
  },
  get_orders: {
    default: [
      'Tracking down your orders…',
      "Checking what's been dispatched your way.",
      'Order history incoming — hope they all arrived!',
      'Pulling up your recent orders…',
      'Fetching your order details.',
      "Looking at what's been ordered recently.",
      'Loading your order history…',
      'Checking the latest on your deliveries…',
      'Pulling your full order log…',
      "Seeing what's been sent and what's pending.",
    ],
    keywords: {
      track: 'Tracking your order right now…',
      status: 'Checking the status of your order…',
      deliver: 'Looking up your delivery status…',
      arrived: 'Checking if your order has arrived…',
      pending: 'Looking for pending orders…',
      recent: 'Fetching your most recent orders…',
      cancel: 'Pulling up your order history…',
    },
  },
  get_wallet: {
    default: [
      'Peeking at your wallet… discreetly.',
      "Counting your credits — won't take long.",
      'Checking your balance. No judgement here.',
      'Fetching your wallet details…',
      'Looking up your credit balance.',
      'Pulling your RapidCapsule credits…',
      "Checking what's available to spend…",
      'Loading your credits and transactions…',
      'Calculating your current wallet balance…',
      'Fetching your spending and credit summary.',
    ],
    keywords: {
      balance: 'Checking your current balance…',
      credit: 'Looking up your available credits…',
      spend: 'Reviewing your spending history…',
      transaction: 'Fetching your recent transactions…',
      topup: 'Checking your wallet for top-up details…',
      'how much': 'Calculating what you have available…',
    },
  },
  get_profile: {
    default: [
      'Loading your profile…',
      'Getting your details together.',
      'Pulling up what we know about you.',
      'Fetching your profile information…',
      'Looking up your account details.',
      'Retrieving your profile — one moment.',
      'Loading your personal health information…',
      'Checking your account settings and profile…',
      'Gathering your saved health details…',
      'Pulling up your full profile now.',
    ],
    keywords: {
      age: 'Checking your profile details…',
      name: 'Pulling up your profile…',
      update: 'Loading your current profile to update…',
      allergies: 'Fetching your health profile including allergies…',
      blood: 'Looking up your blood type and profile…',
      address: 'Retrieving your saved address…',
    },
  },
  get_health_score: {
    default: [
      'Crunching your health score… the math is good.',
      'Running the numbers on your wellness.',
      "Calculating — you're probably doing better than you think.",
      'Computing your health score…',
      'Pulling together your wellness metrics.',
      'Analysing your overall health data…',
      'Scoring your health across all dimensions…',
      'Weighing up your health indicators…',
      'Building your personalised wellness score…',
      'Putting the full health picture into a number.',
    ],
    keywords: {
      improve: 'Calculating your score and looking for improvement areas…',
      good: "Checking how well you're doing overall…",
      bad: 'Honestly assessing your health score…',
      overall: 'Looking at your overall health picture…',
      wellness: 'Running your wellness analysis…',
      fitness: 'Checking your fitness and health metrics…',
    },
  },
  start_health_checkup: {
    default: [
      'Firing up the health checkup engine…',
      'Preparing your personalised checkup.',
      'Getting the diagnostic wheels turning.',
      'Setting up your health assessment…',
      'Initialising your checkup — almost ready.',
      'Starting the checkup process for you.',
      'Getting the right questions lined up for you…',
      'Spinning up your personalised health interview…',
      'Calibrating the checkup to your profile…',
      'Warming up the health assessment — nearly there.',
    ],
    keywords: {
      quick: 'Preparing a quick checkup for you…',
      full: 'Setting up a full health checkup…',
      start: 'Starting your health checkup now…',
      begin: 'Beginning the checkup process…',
      first: 'Getting everything ready for your first checkup…',
    },
  },
  submit_checkup_symptoms: {
    default: [
      'Reading your symptoms carefully…',
      'Processing what your body is telling us.',
      'Mapping your symptoms — stay with me.',
      "Analysing what you've described…",
      'Taking your symptoms seriously — one moment.',
      'Cross-referencing your symptoms against our database.',
      'Matching your symptoms to possible causes…',
      'Thinking through what these symptoms could mean…',
      'Running your symptoms through the clinical model…',
      "Parsing every detail of what you've told me.",
    ],
    keywords: {
      pain: "Analysing the pain you've described…",
      fever: 'Looking at your fever symptoms…',
      cough: 'Processing your cough and respiratory symptoms…',
      tired: 'Analysing your fatigue symptoms…',
      headache: 'Looking into your headache carefully…',
      nausea: 'Reviewing your nausea and digestive symptoms…',
      chest: 'Taking your chest symptoms very seriously…',
      breathe: 'Prioritising your breathing-related symptoms…',
      dizzy: 'Analysing your dizziness and related symptoms…',
      rash: 'Reviewing your skin symptoms…',
    },
  },
  run_checkup_interview: {
    default: [
      'Following the clinical trail…',
      'Asking the right questions behind the scenes.',
      'The interview continues — nearly there.',
      'Progressing through your health interview…',
      'Working through the next set of questions.',
      'Building a clearer picture — just a moment.',
      'Narrowing things down with the next question…',
      'Using your answers to guide the next step…',
      'Thinking about what to ask you next…',
      'The interview is helping us understand more.',
    ],
    keywords: {
      yes: 'Noted — moving to the next question.',
      no: 'Got it — adjusting the assessment.',
      'not sure': 'Understood — factoring in the uncertainty.',
      sometimes: 'Logged — continuing the interview.',
    },
  },
  generate_checkup_report: {
    default: [
      'Compiling your health report…',
      'Assembling the findings — almost done.',
      'Writing up your results with care.',
      'Putting your full report together…',
      'Generating your personalised health summary.',
      "Crafting your checkup report — won't be long.",
      'Translating your answers into clear insights…',
      'Turning your responses into a health report…',
      'Building your personalised clinical summary…',
      'Pulling together everything to give you a clear picture.',
    ],
    keywords: {
      report: 'Building your detailed health report…',
      summary: 'Summarising your health findings…',
      result: 'Compiling your checkup results…',
      recommend: 'Pulling together recommendations based on your results…',
    },
  },
  check_drug_interactions: {
    default: [
      'Running interaction analysis… chemistry is complex.',
      'Cross-referencing your medications — takes a moment.',
      'Checking for any red flags between your drugs.',
      'Scanning for drug interactions now…',
      'Analysing medication compatibility…',
      'Checking if these can be taken together safely.',
      'Looking for conflicts in your medication combination…',
      'Running this through the interaction database…',
      'Checking the literature on these drug combinations…',
      'Being thorough — your safety depends on it.',
    ],
    keywords: {
      safe: 'Checking if these medications are safe together…',
      together: 'Verifying these can be taken at the same time…',
      combine: 'Analysing what happens when these are combined…',
      mix: 'Checking for interactions between these drugs…',
      alcohol: 'Checking interactions including alcohol…',
      food: 'Looking at drug-food interactions too…',
      paracetamol: 'Cross-checking paracetamol interactions…',
      ibuprofen: 'Analysing ibuprofen combination safety…',
      aspirin: 'Checking aspirin interactions…',
      antibiotic: 'Reviewing antibiotic interaction profile…',
    },
  },
  analyze_prescription_upload: {
    default: [
      'Reading your prescription… including the handwriting.',
      'Parsing what was prescribed — one sec.',
      'Decoding your prescription carefully.',
      'Extracting details from your prescription image…',
      'Reading the prescription you uploaded…',
      'Processing your prescription document.',
      'Running OCR on your prescription…',
      'Extracting medication details from the image…',
      'Interpreting the prescription format…',
      'Digitising what was written for you.',
    ],
    keywords: {
      upload: 'Reading the prescription you just uploaded…',
      photo: 'Processing the prescription photo…',
      image: 'Extracting information from the prescription image…',
      scan: 'Scanning your prescription document…',
      doctor: 'Reading what your doctor prescribed…',
    },
  },
  analyze_existing_prescription: {
    default: [
      'Analysing your prescription on file…',
      'Taking a closer look at your current meds.',
      'Deep-diving into your prescription details.',
      'Reviewing your saved prescription…',
      'Pulling and analysing your prescription record.',
      'Going through your prescription carefully.',
      "Reading through what's been prescribed for you…",
      'Looking at the details of your existing prescription…',
      'Checking your prescription for all the key details…',
      'Reviewing dosage, frequency, and instructions for you.',
    ],
    keywords: {
      what: "Reading what's in your prescription…",
      how: 'Checking instructions and dosage details…',
      when: 'Looking at timing and frequency in your prescription…',
      'side effect': 'Cross-checking your prescription for side effect info…',
      dosage: 'Reviewing the dosage details in your prescription…',
    },
  },
  get_recovery_profile: {
    default: [
      'Loading your recovery profile…',
      'Checking in on your journey.',
      'Pulling up where you left off.',
      'Fetching your recovery details…',
      'Looking at your recovery setup…',
      'Retrieving your personalised recovery profile.',
      'Loading your recovery journey so far…',
      'Pulling the details of your recovery plan…',
      'Reviewing your recovery history and current status…',
      'Getting a full picture of where you are right now.',
    ],
    keywords: {
      progress: 'Loading your recovery progress…',
      plan: 'Fetching your recovery plan details…',
      goal: 'Looking at your recovery goals…',
      support: 'Pulling up your recovery support resources…',
    },
  },
  get_recovery_dashboard: {
    default: [
      'Fetching your recovery dashboard…',
      'Your progress is loading — and it matters.',
      'Pulling your recovery story together.',
      'Loading your full recovery overview…',
      'Gathering everything for your dashboard.',
      'Compiling your recovery metrics…',
      'Building your personalised recovery view…',
      'Loading streaks, logs, and milestones…',
      "Pulling in everything that shows how far you've come…",
      'Your recovery data is coming together.',
    ],
    keywords: {
      how: "Pulling together how you've been doing…",
      today: "Checking in on today's recovery status…",
      week: 'Looking at your recovery over the past week…',
      month: 'Reviewing your monthly recovery progress…',
      overall: 'Loading the full picture of your recovery…',
      streak: 'Checking your current streak — keep it going.',
    },
  },
  get_sobriety_stats: {
    default: [
      'Loading your sobriety stats — every day counts.',
      "Counting the milestones. You've earned each one.",
      'Pulling your streak data.',
      'Fetching your sobriety timeline…',
      "Looking at how far you've come.",
      'Tallying up your sober days — this is worth looking at.',
      'Counting the days, weeks, months — all of it.',
      'Pulling together your full sobriety journey…',
      'Your stats are loading — the numbers tell a powerful story.',
      'Gathering your sobriety milestones right now.',
    ],
    keywords: {
      day: 'Counting your sober days — one moment.',
      streak: 'Pulling up your current streak…',
      milestone: "Checking your milestones — you've hit some big ones.",
      'how long': "Calculating how long you've been on this journey…",
      since: 'Looking up your stats from when you started…',
    },
  },
  get_daily_logs: {
    default: [
      'Checking your daily logs…',
      'Reviewing how your days have been going.',
      'Pulling your recent check-in history.',
      'Fetching your daily log entries…',
      'Looking over your recent logs.',
      "Reading through what you've recorded.",
      'Loading your daily tracking entries…',
      "Going through what you've logged recently…",
      'Fetching mood, sleep, and daily notes…',
      'Pulling your recent daily check-in data.',
    ],
    keywords: {
      today: "Checking if you've logged anything today…",
      yesterday: "Pulling up yesterday's log…",
      week: 'Reviewing logs from the past week…',
      mood: 'Looking at your recent mood logs…',
      sleep: 'Checking your sleep log entries…',
      craving: 'Reviewing your craving log history…',
    },
  },
  log_daily_checkin: {
    default: [
      'Saving your check-in… noted.',
      "Logging today's update — it all adds up.",
      'Recorded. Keep showing up.',
      'Saving your daily check-in…',
      'Logging this moment — every entry matters.',
      'Recording your check-in. You showed up today.',
      "Saving today's data point in your journey…",
      'Locking in your check-in for today.',
      'Adding this to your log — it counts.',
      'Recording where you are today. That matters.',
    ],
    keywords: {
      good: "Saving today's positive check-in…",
      bad: 'Logging today — even hard days count.',
      okay: 'Saving your check-in — okay days matter too.',
      great: 'Recording your great day — well done.',
      tough: 'Logging your check-in — tough days are still progress.',
      struggle: 'Saving this — reaching out takes strength.',
    },
  },
  start_screening: {
    default: [
      'Setting up your screening…',
      'Preparing a few important questions.',
      'Getting the assessment ready for you.',
      'Initialising your screening tool…',
      'Building your personalised screening set.',
      'Setting the stage for your assessment.',
      'Loading the clinical screening questions…',
      'Putting together your tailored assessment…',
      'Getting the screening framework ready for you…',
      'This will only take a few questions — starting now.',
    ],
    keywords: {
      anxiety: 'Preparing your anxiety screening…',
      depression: 'Setting up the depression screening…',
      stress: 'Getting your stress assessment ready…',
      mental: 'Preparing your mental health screening…',
      phq: 'Setting up the PHQ screening…',
      gad: 'Preparing the GAD anxiety screening…',
      alcohol: 'Setting up your alcohol use screening…',
      drug: 'Preparing your substance use screening…',
    },
  },
  submit_screening: {
    default: [
      'Scoring your responses… thoughtfully.',
      'Calculating your results.',
      'Processing what you shared with us.',
      'Working through your screening responses…',
      "Analysing what you've told us…",
      'Running the scoring model on your answers.',
      'Applying the clinical scoring framework…',
      'Translating your answers into a score…',
      'Interpreting your responses carefully…',
      'Running the final analysis on your screening.',
    ],
    keywords: {
      done: 'All responses received — calculating your results…',
      finish: 'Wrapping up — scoring your screening now.',
      complete: 'Completing your screening analysis…',
      submit: 'Submitting and scoring your responses…',
    },
  },
  run_coping_exercise: {
    default: [
      'Finding just the right coping exercise for you…',
      'Preparing something that might help.',
      "Setting up your exercise — this one's for you.",
      'Curating a coping technique…',
      "Pulling up an exercise suited to what you're feeling.",
      'Getting your coping exercise ready.',
      "Selecting a technique based on how you're doing…",
      'Matching the exercise to your current state…',
      'Finding something practical and calming for you…',
      'Setting up an evidence-based coping technique.',
    ],
    keywords: {
      breathe: 'Preparing a breathing exercise for you…',
      breathing: 'Setting up a guided breathing technique…',
      ground: 'Getting a grounding exercise ready…',
      relax: 'Finding a relaxation technique for you…',
      calm: 'Preparing something to help you feel calmer…',
      anxious: 'Finding an exercise to help with anxiety right now…',
      stress: 'Preparing a stress-relief technique…',
      mind: 'Setting up a mindfulness exercise…',
    },
  },
  get_risk_assessment: {
    default: [
      'Calculating your risk profile…',
      'Running the assessment models.',
      'Putting the picture together — carefully.',
      'Pulling your risk assessment data…',
      'Running risk analysis — this needs precision.',
      'Evaluating your risk factors thoughtfully.',
      'Weighing up the relevant risk indicators…',
      'Building your personalised risk picture…',
      'Analysing the factors that matter for your risk score…',
      'Taking a careful look at your current risk level.',
    ],
    keywords: {
      how: 'Calculating how at-risk you currently are…',
      relapse: 'Assessing your current relapse risk…',
      high: 'Running a thorough risk analysis…',
      low: 'Checking where you stand on the risk scale…',
      current: 'Fetching your current risk assessment…',
    },
  },
  refine_risk_assessment: {
    default: [
      "Refining the assessment with what you've shared…",
      'Updating your risk picture.',
      'Getting more precise — one moment.',
      'Recalculating based on your latest input…',
      'Fine-tuning the risk model with your answers.',
      'Adjusting the assessment — almost there.',
      'Incorporating your latest responses into the model…',
      'Updating the risk score with what you just told me…',
      'Running the refined assessment now…',
      'The picture is getting clearer — recalculating.',
    ],
    keywords: {
      change: 'Updating the assessment with the change you described…',
      worse: 'Recalibrating — taking your input seriously.',
      better: 'Good to hear — updating your risk profile accordingly.',
      different: "Adjusting the assessment based on what's changed…",
    },
  },
};

// Fallback for unknown tools
const TOOL_LOADING_FALLBACK: PhraseEntry = {
  default: [
    'Working on it…',
    'Just a moment…',
    'Thinking this through…',
    'On it — give me a second.',
    'Pulling the right information together…',
    'Processing your request carefully.',
    'Checking on that for you now…',
    "Won't be long — fetching what you need.",
    'Gathering the details — nearly ready.',
    'Almost there — just putting it together.',
  ],
  keywords: {},
};

// Pick the most contextual phrase available for the given tool + user message.
// Strategy: check user message for keywords first, fall back to rotating defaults.
function getToolPhrase(
  tool: string,
  indexRef: React.MutableRefObject<number>,
  userMessage: string
): string {
  const entry = TOOL_LOADING_PHRASES[tool] ?? TOOL_LOADING_FALLBACK;
  const lower = userMessage.toLowerCase();

  // Try to find a keyword match in the user's message
  for (const [kw, phrase] of Object.entries(entry.keywords)) {
    if (lower.includes(kw)) return phrase;
  }

  // Fall back to rotating default phrases
  const idx = indexRef.current % entry.default.length;
  return entry.default[idx];
}

// ─── Action Link Navigation ─────────────────────────
const ACTION_ROUTES: Record<string, { tab: string; screen?: string }> = {
  book_appointment: { tab: 'Bookings' },
  appointments: { tab: 'Bookings' },
  vitals: { tab: 'Home', screen: 'Vitals' },
  health_checkup: { tab: 'Home', screen: 'HealthCheckupPatientInfo' },
  prescriptions: { tab: 'Profile', screen: 'PrescriptionsList' },
  pharmacy: { tab: 'Pharmacy' },
  orders: { tab: 'Pharmacy' },
  wallet: { tab: 'Profile', screen: 'Wallet' },
  profile: { tab: 'Profile' },
};

// Action links that send a message to Eka (triggers backend tools + artifacts)
const ACTION_MESSAGES: Record<string, string> = {
  recovery: 'Show my recovery dashboard',
  recovery_checkin: 'I want to do my daily check-in',
  recovery_screening: 'I want to take a screening assessment',
  recovery_plan: 'Show my recovery plan',
  coping_exercise: 'I need a coping exercise',
  crisis: 'I need help right now, this is urgent',
  screening: 'I want to take a screening assessment',
  upload_prescription: 'I want to upload a prescription',
  health_tips: 'Show me health tips',
};

// ─── Triage Colors ──────────────────────────────────
// const TRIAGE_COLORS: Record<string, string> = {
//   emergency: '#ef4444',
//   emergency_ambulance: '#ef4444',
//   consultation_24: '#f97316',
//   consultation: '#eab308',
//   self_care: '#22c55e',
// };

// ═══════════════════════════════════════════════════════
// Main Screen
// ═══════════════════════════════════════════════════════
export default function EkaChatScreen() {
  const navigation = useNavigation<any>();
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<RNTextInput>(null);

  // Store
  const messages = useEkaStore((s) => s.messages);
  const isStreaming = useEkaStore((s) => s.isStreaming);
  const checkupQuestion = useEkaStore((s) => s.checkupQuestion);
  const suggestions = useEkaStore((s) => s.suggestions);
  const loadingTool = useEkaStore((s) => s.loadingTool);
  const conversations = useEkaStore((s) => s.conversations);
  const currentConversationId = useEkaStore((s) => s.currentConversationId);
  const language = useEkaStore((s) => s.language);
  const sendMessage = useEkaStore((s) => s.sendMessage);
  const answerCheckupQuestion = useEkaStore((s) => s.answerCheckupQuestion);
  const newConversation = useEkaStore((s) => s.newConversation);
  const loadConversation = useEkaStore((s) => s.loadConversation);
  const fetchConversations = useEkaStore((s) => s.fetchConversations);
  const deleteConvoAction = useEkaStore((s) => s.deleteConversation);
  const renameConvoAction = useEkaStore((s) => s.renameConversation);
  const setLanguage = useEkaStore((s) => s.setLanguage);
  const initLanguage = useEkaStore((s) => s.initLanguage);

  // Local state
  const [inputText, setInputText] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  // Cycles through witty phrases on each new tool invocation
  const toolPhraseIndexRef = useRef(0);
  const [toolPhrase, setToolPhrase] = useState('');

  // Init
  useFocusEffect(
    useCallback(() => {
      initLanguage();
      fetchConversations();
    }, [initLanguage, fetchConversations])
  );

  // Online dot pulse animation (always running)
  const onlinePulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(onlinePulse, { toValue: 0.3, duration: 900, useNativeDriver: true }),
        Animated.timing(onlinePulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [onlinePulse]);

  // Tool loading dots animation
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (loadingTool) {
      // Find the last user message to make the phrase contextual
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
      const userText = lastUserMsg?.content ?? '';

      // Pick and advance the witty phrase for this tool invocation
      toolPhraseIndexRef.current += 1;
      setToolPhrase(getToolPhrase(loadingTool, toolPhraseIndexRef, userText));

      const makeDot = (anim: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
            Animated.delay(600 - delay),
          ])
        );
      const a1 = makeDot(dot1, 0);
      const a2 = makeDot(dot2, 200);
      const a3 = makeDot(dot3, 400);
      a1.start();
      a2.start();
      a3.start();
      return () => {
        a1.stop();
        a2.stop();
        a3.stop();
        dot1.setValue(0);
        dot2.setValue(0);
        dot3.setValue(0);
      };
    }
  }, [loadingTool, dot1, dot2, dot3]);

  // Pulsing animation (kept for backward compat, unused visually now)
  useEffect(() => {
    if (loadingTool) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [loadingTool, pulseAnim]);

  // Auto-scroll on new messages
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, loadingTool, checkupQuestion]);

  // ─── Sidebar ────────────────────────────────────
  const openSidebar = () => {
    setSidebarOpen(true);
    Animated.parallel([
      Animated.timing(sidebarAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const closeSidebar = () => {
    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: -SIDEBAR_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setSidebarOpen(false));
  };

  // ─── Handlers ───────────────────────────────────
  const handleSend = () => {
    const text = inputText.trim();
    if (!text || isStreaming) return;
    setInputText('');
    sendMessage(text);
  };

  const handleQuickAction = (action: (typeof QUICK_ACTIONS)[number]) => {
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

      const { uploadId, filename } = await ekaService.uploadPrescription(formData);
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
          Alert.prompt?.(
            'Rename Conversation',
            undefined,
            (newTitle: string) => {
              if (newTitle?.trim()) renameConvoAction(convo._id, newTitle.trim());
            },
            'plain-text',
            convo.title
          );
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteConvoAction(convo._id),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleNewChat = () => {
    closeSidebar();
    newConversation();
  };

  const navigateAction = (routeKey: string) => {
    // Handle parameterized route keys like book_appointment:CHECKUP_ID
    const [baseKey, param] = routeKey.split(':');

    // 1. Check if it's a navigation route
    const route = ACTION_ROUTES[baseKey] || ACTION_ROUTES[routeKey];
    if (route) {
      if (baseKey === 'book_appointment' && param) {
        // Pass health checkup ID to booking flow
        (navigation as any).navigate(route.tab, {
          screen: 'SelectSpecialty',
          params: {
            healthCheckupId: param,
            healthCheckupSummary:
              'Health checkup completed via Eka — results will be shared with specialist',
          },
        });
      } else if (route.screen) {
        (navigation as any).navigate(route.tab, { screen: route.screen });
      } else {
        (navigation as any).navigate(route.tab);
      }
      return;
    }

    // 2. Check if it's a "send message to Eka" action (triggers tools + artifacts)
    const message = ACTION_MESSAGES[routeKey];
    if (message) {
      if (routeKey === 'upload_prescription') {
        handleUpload();
      } else {
        sendMessage(message);
      }
      return;
    }

    // 3. Drug deep links (drug:MONGO_ID) — ignore for now
  };

  // ─── Group conversations by date ────────────────
  const groupedConversations = groupByDate(conversations);

  // ═══════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      {/* ─── Header ─────────────────────────────── */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: 10,
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        {/* True-center identity via absolute positioning */}
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          {/* Left — Home + History */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Home')}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Go to home"
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Home size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={openSidebar}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open conversation history"
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PanelLeft size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Center — Eka identity (absolutely centered) */}
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.4,
                  shadowRadius: 6,
                  elevation: 4,
                }}
              >
                <BrainCircuit size={17} color={colors.white} />
              </View>
              <View>
                <Text
                  style={{
                    fontWeight: '800',
                    fontSize: 15,
                    color: colors.foreground,
                    letterSpacing: -0.4,
                    lineHeight: 18,
                  }}
                >
                  Eka AI
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Animated.View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: colors.primary,
                      opacity: onlinePulse,
                    }}
                  />
                  <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '600' }}>
                    Online
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Right — New Chat (primary CTA) */}
          <TouchableOpacity
            onPress={handleNewChat}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="New chat"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 12,
              backgroundColor: `${colors.primary}18`,
              borderWidth: 1,
              borderColor: `${colors.primary}35`,
            }}
          >
            <MessageSquarePlus size={15} color={colors.primary} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Chat Area ──────────────────────────── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 12 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Welcome Screen */}
          {messages.length === 0 && <WelcomeScreen onAction={handleQuickAction} />}

          {/* Messages */}
          {messages.map((msg, idx) => {
            const isLast = idx === messages.length - 1;
            return (
              <React.Fragment key={msg.id}>
                <MessageBubble
                  message={msg}
                  isLast={isLast}
                  isStreaming={isStreaming}
                  loadingTool={isLast && msg.role === 'assistant' ? loadingTool : null}
                  toolPhrase={isLast && msg.role === 'assistant' ? toolPhrase : ''}
                  dot1={dot1}
                  dot2={dot2}
                  dot3={dot3}
                  onActionLink={navigateAction}
                />
                {msg.artifact && <ArtifactCard artifact={msg.artifact} />}
              </React.Fragment>
            );
          })}

          {/* Loading is now rendered inside the last assistant MessageBubble — no separate element needed */}

          {/* Checkup Question Buttons — only show when not streaming (same as web) */}
          {checkupQuestion && !isStreaming && (
            <CheckupQuestionUI question={checkupQuestion} onAnswer={answerCheckupQuestion} />
          )}
        </ScrollView>

        {/* ─── Bottom Input Area ────────────────── */}
        <View
          style={{
            backgroundColor: colors.background,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: 8,
          }}
        >
          {/* Suggestion chips */}
          {suggestions.length > 0 && !isStreaming && !checkupQuestion && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 10 }}
              contentContainerStyle={{ gap: 8 }}
            >
              {suggestions.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.6}
                  onPress={() => handleSuggestionTap(s)}
                  accessibilityRole="button"
                  accessibilityLabel={s.label}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: `${colors.primary}12`,
                    borderWidth: 1,
                    borderColor: `${colors.primary}30`,
                  }}
                >
                  <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>
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
                borderRadius: 16,
                borderWidth: 1,
                borderColor: `${colors.primary}25`,
                padding: 12,
              }}
            >
              <Text
                style={{
                  width: '100%',
                  fontSize: 10,
                  fontWeight: '700',
                  color: colors.mutedForeground,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                Response Language
              </Text>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.label}
                  activeOpacity={0.7}
                  onPress={() => {
                    setLanguage(lang.label);
                    setLanguageOpen(false);
                  }}
                  accessibilityRole="radio"
                  accessibilityLabel={lang.label}
                  accessibilityState={{ selected: language === lang.label }}
                  style={{
                    paddingHorizontal: 11,
                    paddingVertical: 6,
                    borderRadius: 14,
                    backgroundColor: language === lang.label ? `${colors.primary}18` : colors.muted,
                    borderWidth: 1,
                    borderColor: language === lang.label ? colors.primary : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: language === lang.label ? '700' : '500',
                      color: language === lang.label ? colors.primary : colors.foreground,
                    }}
                  >
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
              borderWidth: 1.5,
              borderColor: inputText.trim() ? `${colors.primary}50` : colors.border,
              borderRadius: 24,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 4,
              paddingVertical: 4,
            }}
          >
            <TouchableOpacity
              onPress={handleUpload}
              accessibilityRole="button"
              accessibilityLabel="Upload file"
              style={{
                width: 38,
                height: 38,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: `${colors.primary}10`,
                marginLeft: 2,
              }}
            >
              <Plus size={18} color={colors.primary} />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <TextInput
                ref={inputRef}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask Eka anything..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                style={{
                  fontSize: 14,
                  color: colors.foreground,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  maxHeight: 100,
                }}
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
                returnKeyType="send"
                accessibilityLabel="Ask Eka anything"
              />
              {/* Subtle character counter — only visible when typing */}
              {inputText.length > 0 && (
                <Text
                  style={{
                    fontSize: 9,
                    color: inputText.length > 800 ? colors.destructive : colors.mutedForeground,
                    textAlign: 'right',
                    paddingRight: 10,
                    paddingBottom: 2,
                    opacity: 0.7,
                  }}
                >
                  {inputText.length}
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={() => setLanguageOpen(!languageOpen)}
              accessibilityRole="button"
              accessibilityLabel="Change language"
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Globe size={16} color={languageOpen ? colors.primary : colors.mutedForeground} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSend}
              disabled={isStreaming || !inputText.trim()}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Send message"
              style={{
                width: 38,
                height: 38,
                borderRadius: 16,
                backgroundColor:
                  isStreaming || !inputText.trim() ? `${colors.muted}` : colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 2,
                shadowColor: inputText.trim() ? colors.primary : 'transparent',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.35,
                shadowRadius: 4,
                elevation: inputText.trim() ? 3 : 0,
              }}
            >
              {isStreaming ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Send size={15} color={inputText.trim() ? colors.white : colors.mutedForeground} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* ─── Sidebar Overlay ────────────────────── */}
      {sidebarOpen && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }}>
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              opacity: backdropAnim,
            }}
          >
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={closeSidebar}
              activeOpacity={1}
              accessibilityRole="button"
              accessibilityLabel="Close sidebar"
            />
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
              transform: [{ translateX: sidebarAnim }],
            }}
          >
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
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
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground }}>
                  Conversations
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={handleNewChat}
                    accessibilityRole="button"
                    accessibilityLabel="New conversation"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      backgroundColor: colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Plus size={18} color={colors.white} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={closeSidebar}
                    accessibilityRole="button"
                    accessibilityLabel="Close sidebar"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      backgroundColor: colors.muted,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <X size={18} color={colors.foreground} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sidebar Body */}
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 12, gap: 12 }}
                showsVerticalScrollIndicator={false}
              >
                {groupedConversations.length === 0 && (
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.mutedForeground,
                      textAlign: 'center',
                      paddingTop: 40,
                    }}
                  >
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
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    closeSidebar();
                    navigation.navigate('Home');
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Back to dashboard"
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
                  }}
                >
                  <Home size={18} color={colors.primary} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}>
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
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${count} conversations`}
        accessibilityState={{ expanded: open }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 4,
          paddingVertical: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: colors.mutedForeground,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {label}
          </Text>
          <View
            style={{
              backgroundColor: colors.muted,
              borderRadius: 8,
              paddingHorizontal: 6,
              paddingVertical: 1,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: '700', color: colors.mutedForeground }}>
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
        <View style={{ gap: 6, marginTop: 2 }}>
          {items.map((convo) => (
            <TouchableOpacity
              key={convo._id}
              activeOpacity={0.7}
              onPress={() => onTap(convo)}
              onLongPress={() => onLongPress(convo)}
              accessibilityRole="button"
              accessibilityLabel={convo.title || 'Untitled conversation'}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 12,
                backgroundColor: currentId === convo._id ? `${colors.primary}12` : colors.card,
                borderWidth: 1,
                borderColor: currentId === convo._id ? `${colors.primary}35` : colors.border,
                overflow: 'hidden',
              }}
            >
              {/* Active accent bar */}
              {currentId === convo._id && (
                <View
                  style={{
                    width: 3,
                    alignSelf: 'stretch',
                    backgroundColor: colors.primary,
                    borderTopLeftRadius: 12,
                    borderBottomLeftRadius: 12,
                  }}
                />
              )}
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 11,
                  paddingLeft: currentId === convo._id ? 10 : 12,
                  gap: 10,
                }}
              >
                <BrainCircuit
                  size={15}
                  color={currentId === convo._id ? colors.primary : colors.mutedForeground}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 13,
                      fontWeight: currentId === convo._id ? '600' : '500',
                      color: currentId === convo._id ? colors.foreground : colors.foreground,
                    }}
                  >
                    {convo.title || 'Untitled'}
                  </Text>
                  <Text style={{ fontSize: 10, color: colors.mutedForeground, marginTop: 2 }}>
                    {formatRelativeDate(convo.updated_at || convo.created_at)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert('Delete?', 'This conversation will be permanently deleted.', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => onDelete(convo._id),
                      },
                    ]);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${convo.title || 'conversation'}`}
                >
                  <Trash2 size={13} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
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
function WelcomeScreen({ onAction }: { onAction: (a: (typeof QUICK_ACTIONS)[number]) => void }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 24, paddingBottom: 20 }}>
      {/* Avatar with glow ring */}
      <View style={{ position: 'relative', marginBottom: 20 }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 26,
            backgroundColor: `${colors.primary}18`,
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            top: -8,
            left: -8,
            right: -8,
            bottom: -8,
          }}
        />
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <BrainCircuit size={36} color={colors.white} />
        </View>
      </View>

      <Text
        style={{ fontSize: 22, fontWeight: '800', color: colors.foreground, letterSpacing: -0.5 }}
      >
        Hi, I'm Eka
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: colors.mutedForeground,
          textAlign: 'center',
          marginTop: 6,
          paddingHorizontal: 36,
          lineHeight: 20,
        }}
      >
        Your AI health companion. Ask me anything — symptoms, prescriptions, recovery, and more.
      </Text>

      {/* Quick action grid — 3 across for breathing room */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 10,
          marginTop: 28,
          paddingHorizontal: 4,
        }}
      >
        {QUICK_ACTIONS.map((action, i) => {
          const Icon = action.icon;
          return (
            <TouchableOpacity
              key={i}
              activeOpacity={0.65}
              onPress={() => onAction(action)}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              style={{
                width: (SCREEN_WIDTH - 68) / 3,
                alignItems: 'center',
                paddingVertical: 14,
                paddingHorizontal: 6,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 16,
                gap: 8,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: `${action.color}18`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={20} color={action.color} />
              </View>
              <Text
                numberOfLines={2}
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: colors.foreground,
                  textAlign: 'center',
                  lineHeight: 15,
                }}
              >
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
  loadingTool,
  toolPhrase,
  dot1,
  dot2,
  dot3,
  onActionLink,
}: {
  message: EkaMessage;
  isLast: boolean;
  isStreaming: boolean;
  loadingTool: string | null;
  toolPhrase: string;
  dot1: Animated.Value;
  dot2: Animated.Value;
  dot3: Animated.Value;
  onActionLink: (key: string) => void;
}) {
  const isUser = message.role === 'user';
  const hasContent = message.content.length > 0;

  // Entry animation — fade + slide up on mount
  const entryAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(entryAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  }, []);

  // Controls crossfade between loading shimmer (0) and streamed text (1)
  // Transitions from 0→1 as soon as content starts arriving
  const contentReveal = useRef(new Animated.Value(hasContent ? 1 : 0)).current;
  useEffect(() => {
    if (hasContent) {
      Animated.timing(contentReveal, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      contentReveal.setValue(0);
    }
  }, [hasContent, contentReveal]);

  // Streaming border pulse — only once content is flowing
  const streamingBorder = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isLast && isStreaming && !isUser && hasContent) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(streamingBorder, { toValue: 1, duration: 700, useNativeDriver: false }),
          Animated.timing(streamingBorder, { toValue: 0, duration: 700, useNativeDriver: false }),
        ])
      );
      anim.start();
      return () => {
        anim.stop();
        streamingBorder.setValue(0);
      };
    } else {
      streamingBorder.setValue(0);
    }
  }, [isLast, isStreaming, isUser, hasContent, streamingBorder]);

  const entryStyle = {
    opacity: entryAnim,
    transform: [
      {
        translateY: entryAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
    ],
  };

  if (isUser) {
    return (
      <Animated.View style={[{ flexDirection: 'row', justifyContent: 'flex-end' }, entryStyle]}>
        <View
          style={{
            maxWidth: '78%',
            backgroundColor: colors.primary,
            borderRadius: 20,
            borderBottomRightRadius: 5,
            paddingHorizontal: 14,
            paddingVertical: 10,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Text style={{ fontSize: 14, color: colors.white, lineHeight: 21 }}>
            {message.content}
          </Text>
        </View>
      </Animated.View>
    );
  }

  // ── Assistant bubble ──────────────────────────────────
  const showLoadingLayer = isLast && isStreaming && !hasContent && !!loadingTool;
  const showCursor = isLast && isStreaming && hasContent && !message.content.endsWith('|');
  const displayText = message.content + (showCursor ? '|' : '');

  const borderColor = streamingBorder.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, `${colors.primary}70`],
  });

  return (
    <Animated.View style={[{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }, entryStyle]}>
      {/* Avatar */}
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 10,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 2,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.25,
          shadowRadius: 3,
          elevation: 2,
        }}
      >
        <BrainCircuit size={14} color={colors.white} />
      </View>

      {/* Bubble */}
      <Animated.View
        style={{
          flex: 1,
          maxWidth: '85%',
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor,
          borderRadius: 18,
          borderTopLeftRadius: 5,
          borderBottomLeftRadius: 5,
          paddingHorizontal: 14,
          paddingVertical: 10,
          // Ensure bubble has a minimum height while loading so it doesn't collapse
          minHeight: showLoadingLayer ? 80 : undefined,
        }}
      >
        {/* ── Loading layer (shimmer + witty phrase + dots) ── */}
        {/* Stays mounted until content arrives, then fades out */}
        {isLast && isStreaming && (
          <Animated.View
            style={{
              opacity: contentReveal.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
              // Collapse height to 0 after fade so it doesn't push content down
              // We use absolute + zIndex so both layers overlay at same position
              position: hasContent ? 'absolute' : 'relative',
              top: hasContent ? 10 : 0,
              left: hasContent ? 14 : 0,
              right: hasContent ? 14 : 0,
              pointerEvents: 'none',
              gap: 10,
            }}
          >
            {/* Witty phrase */}
            {!!toolPhrase && (
              <Text style={{ fontSize: 12, color: colors.mutedForeground, fontStyle: 'italic' }}>
                {toolPhrase}
              </Text>
            )}

            {/* Shimmer lines */}
            <View style={{ gap: 7 }}>
              <ShimmerRow width={SCREEN_WIDTH * 0.42} height={9} />
              <ShimmerRow width={SCREEN_WIDTH * 0.32} height={9} />
              <ShimmerRow width={SCREEN_WIDTH * 0.38} height={9} />
            </View>

            {/* Animated dots */}
            <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
              {[dot1, dot2, dot3].map((dot, i) => (
                <Animated.View
                  key={i}
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 2.5,
                    backgroundColor: colors.primary,
                    opacity: dot,
                    transform: [
                      {
                        scale: dot.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.6, 1],
                        }),
                      },
                    ],
                  }}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {/* ── Content layer (streamed text) ── */}
        {/* Fades in as content arrives */}
        <Animated.View style={{ opacity: contentReveal }}>
          <FormattedText text={displayText} onActionLink={onActionLink} />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════
// Formatted Text (bold, bullets, action links)
// ═══════════════════════════════════════════════════════
function FormattedText({
  text,
  onActionLink,
}: {
  text: string;
  onActionLink: (key: string) => void;
}) {
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
          <Text
            key={`${lineIdx}-${partIdx++}`}
            style={{ fontSize: 14, color: colors.foreground, lineHeight: 20 }}
          >
            {remaining}
          </Text>
        );
        break;
      }

      // Text before match
      if (earliestIdx > 0) {
        parts.push(
          <Text
            key={`${lineIdx}-${partIdx++}`}
            style={{ fontSize: 14, color: colors.foreground, lineHeight: 20 }}
          >
            {remaining.slice(0, earliestIdx)}
          </Text>
        );
      }

      if (earliest === 'link' && linkMatch) {
        const linkText = linkMatch[1];
        const routeKey = linkMatch[2];

        // Check for drug: prefix
        if (routeKey.startsWith('drug:')) {
          parts.push(
            <Text
              key={`${lineIdx}-${partIdx++}`}
              style={{ fontSize: 14, color: colors.primary, fontWeight: '600' }}
            >
              {linkText}
            </Text>
          );
        } else {
          parts.push(
            <Text
              key={`${lineIdx}-${partIdx++}`}
              style={{
                fontSize: 14,
                color: colors.primary,
                fontWeight: '600',
                textDecorationLine: 'underline',
              }}
              onPress={() => onActionLink(routeKey)}
            >
              {linkText}
            </Text>
          );
        }
        remaining = remaining.slice(earliestIdx + linkMatch[0].length);
      } else if (earliest === 'bold' && boldMatch) {
        parts.push(
          <Text
            key={`${lineIdx}-${partIdx++}`}
            style={{ fontSize: 14, color: colors.foreground, fontWeight: '700', lineHeight: 20 }}
          >
            {boldMatch[1]}
          </Text>
        );
        remaining = remaining.slice(earliestIdx + boldMatch[0].length);
      }
    }

    elements.push(<Text key={`line-${lineIdx}`}>{parts}</Text>);
  });

  return <Text>{elements}</Text>;
}

// ═══════════════════════════════════════════════════════
// Health Checkup Start — Body Avatar + Symptom Search
// ═══════════════════════════════════════════════════════
function HealthCheckupStartCard({ data }: { data: any }) {
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selected, setSelected] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bodyPartResults, setBodyPartResults] = useState<any[]>([]);
  const [bodyPartLoading, setBodyPartLoading] = useState(false);
  const [tappedPart, setTappedPart] = useState<string | null>(null);
  const [avatarReady, setAvatarReady] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const webviewRef = useRef<any>(null);
  const sendMessage = useEkaStore((s) => s.sendMessage);

  const sex = data?.patient_gender || 'male';
  const age = data?.patient_age || 25;

  // Body avatar WebView message handler
  const onWebViewMessage = useCallback(
    async (event: any) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg.type === 'body_part' && msg.part) {
          setTappedPart(msg.part);
          setBodyPartLoading(true);
          setBodyPartResults([]);
          try {
            const res = await healthCheckupService.searchSymptoms({ phrase: msg.part, age, sex });
            setBodyPartResults(res || []);
          } catch {
            setBodyPartResults([]);
          } finally {
            setBodyPartLoading(false);
          }
        }
      } catch {}
    },
    [age, sex]
  );

  const dismissBodyPartResults = useCallback(() => {
    setTappedPart(null);
    setBodyPartResults([]);
  }, []);

  // Text search
  const doSearch = useCallback(
    async (phrase: string) => {
      if (phrase.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }
      try {
        const res = await healthCheckupService.searchSymptoms({ phrase, age, sex });
        setResults(res || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [age, sex]
  );

  const onSearchChange = useCallback(
    (text: string) => {
      setSearchText(text);
      if (searchTimer.current) clearTimeout(searchTimer.current);
      if (text.trim().length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      searchTimer.current = setTimeout(() => doSearch(text.trim()), 400);
    },
    [doSearch]
  );

  const isSelected = useCallback((id: string) => selected.some((s) => s.id === id), [selected]);

  const toggleSymptom = useCallback((sym: any) => {
    setSelected((prev) =>
      prev.some((s) => s.id === sym.id) ? prev.filter((s) => s.id !== sym.id) : [...prev, sym]
    );
  }, []);

  const onContinue = useCallback(() => {
    if (selected.length === 0) return;
    const names = selected.map((s) => s.label || s.common_name || s.name).join(', ');
    const message = `I've selected these symptoms from the body diagram: ${names}. Please proceed with the symptom assessment.`;
    setSubmitted(true);
    sendMessage(message);
  }, [selected, sendMessage]);

  const avatarUri = `https://rapidcapsule.com/body-avatar/?gender=${sex}`;

  if (submitted) {
    return (
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Check size={24} color={colors.success} />
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>
          {selected.length} symptom{selected.length !== 1 ? 's' : ''} submitted
        </Text>
        <Text style={{ fontSize: 11, color: colors.mutedForeground, textAlign: 'center' }}>
          Health checkup in progress...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      {/* Body Avatar WebView */}
      <View
        style={{
          height: 340,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: '#ffffff',
        }}
      >
        {!avatarReady && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1,
            }}
          >
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 6 }}>
              Loading body map...
            </Text>
          </View>
        )}
        <WebView
          ref={webviewRef}
          source={{ uri: avatarUri }}
          onMessage={onWebViewMessage}
          onLoad={() => setAvatarReady(true)}
          style={{ flex: 1, opacity: avatarReady ? 1 : 0 }}
          scrollEnabled={false}
          javaScriptEnabled
          originWhitelist={['*']}
        />
      </View>

      {/* Body part tap results */}
      {tappedPart && (
        <View
          style={{
            backgroundColor: `${colors.primary}08`,
            borderRadius: 10,
            padding: 10,
            gap: 8,
          }}
        >
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.foreground }}>
              Symptoms for: {tappedPart}
            </Text>
            <TouchableOpacity
              onPress={dismissBodyPartResults}
              accessibilityRole="button"
              accessibilityLabel="Dismiss body part results"
            >
              <X size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          {bodyPartLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : bodyPartResults.length > 0 ? (
            <View style={{ maxHeight: 150 }}>
              <ScrollView nestedScrollEnabled>
                {bodyPartResults.map((sym) => {
                  const sel = isSelected(sym.id);
                  return (
                    <TouchableOpacity
                      key={sym.id}
                      activeOpacity={0.7}
                      onPress={() => toggleSymptom(sym)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: 7,
                        paddingHorizontal: 8,
                        backgroundColor: sel ? `${colors.success}15` : 'transparent',
                        borderBottomWidth: 1,
                        borderBottomColor: `${colors.border}40`,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: sel ? colors.success : colors.foreground,
                          flex: 1,
                        }}
                        numberOfLines={1}
                      >
                        {sym.label || sym.common_name || sym.name}
                      </Text>
                      {sel ? (
                        <Check size={14} color={colors.success} />
                      ) : (
                        <Plus size={14} color={colors.mutedForeground} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : (
            <Text style={{ fontSize: 11, color: colors.mutedForeground, textAlign: 'center' }}>
              No symptoms found for this area
            </Text>
          )}
        </View>
      )}

      {/* Search input */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: `${colors.muted}40`,
          borderRadius: 10,
          paddingHorizontal: 10,
          height: 38,
          gap: 8,
        }}
      >
        <Search size={16} color={colors.mutedForeground} />
        <TextInput
          value={searchText}
          onChangeText={onSearchChange}
          placeholder="Or search symptoms by name..."
          placeholderTextColor={colors.mutedForeground}
          accessibilityLabel="Search symptoms"
          style={{
            flex: 1,
            fontSize: 13,
            color: colors.foreground,
            padding: 0,
          }}
        />
        {searchText.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchText('');
              setResults([]);
            }}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <X size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search results */}
      {loading && (
        <Text style={{ fontSize: 11, color: colors.mutedForeground, textAlign: 'center' }}>
          Searching...
        </Text>
      )}
      {results.length > 0 && (
        <View style={{ maxHeight: 150, borderRadius: 8, overflow: 'hidden' }}>
          <ScrollView nestedScrollEnabled>
            {results.map((sym) => {
              const sel = isSelected(sym.id);
              return (
                <TouchableOpacity
                  key={sym.id}
                  activeOpacity={0.7}
                  onPress={() => toggleSymptom(sym)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 8,
                    paddingHorizontal: 10,
                    backgroundColor: sel ? `${colors.success}15` : 'transparent',
                    borderBottomWidth: 1,
                    borderBottomColor: `${colors.border}60`,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: sel ? colors.success : colors.foreground,
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {sym.label || sym.common_name || sym.name}
                  </Text>
                  {sel ? (
                    <Check size={14} color={colors.success} />
                  ) : (
                    <Plus size={14} color={colors.mutedForeground} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
      {searchText.length > 0 && !loading && results.length === 0 && (
        <Text style={{ fontSize: 11, color: colors.mutedForeground, textAlign: 'center' }}>
          No symptoms found
        </Text>
      )}

      {/* Selected symptoms */}
      {selected.length > 0 && (
        <View style={{ gap: 6 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: colors.mutedForeground,
              textTransform: 'uppercase',
            }}
          >
            Selected ({selected.length})
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {selected.map((sym) => (
              <TouchableOpacity
                key={sym.id}
                onPress={() => toggleSymptom(sym)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: `${colors.primary}15`,
                  borderWidth: 1,
                  borderColor: `${colors.primary}30`,
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 5,
                }}
              >
                <Text style={{ fontSize: 11, color: colors.primary }}>
                  {sym.label || sym.common_name || sym.name}
                </Text>
                <X size={12} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Hint + Continue */}
      {selected.length === 0 ? (
        <Text style={{ fontSize: 11, color: colors.mutedForeground, textAlign: 'center' }}>
          Tap a body part or search to select symptoms
        </Text>
      ) : (
        <TouchableOpacity
          onPress={onContinue}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Continue with ${selected.length} selected symptom${
            selected.length !== 1 ? 's' : ''
          }`}
          style={{
            backgroundColor: colors.accent,
            borderRadius: 10,
            paddingVertical: 10,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>
            Continue with checkup
          </Text>
          <Send size={14} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════
// Artifact Card
// ═══════════════════════════════════════════════════════
function ArtifactCard({ artifact }: { artifact: EkaArtifact }) {
  const [expanded, setExpanded] = useState(true);
  const data = artifact.data;

  const renderContent = () => {
    switch (artifact.type) {
      case 'health_checkup_start':
        return <HealthCheckupStartCard data={data} />;

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
        return <Text style={{ fontSize: 12, color: colors.mutedForeground }}>{artifact.type}</Text>;
    }
  };

  const title = getArtifactTitle(artifact.type);
  const { Icon: ArtifactIcon, color: artifactColor } = getArtifactIcon(artifact.type);

  return (
    <View
      style={{
        marginLeft: 40,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: `${artifactColor}25`,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setExpanded(!expanded)}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${expanded ? 'collapse' : 'expand'}`}
        accessibilityState={{ expanded }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: `${artifactColor}12`,
          borderBottomWidth: expanded ? 1 : 0,
          borderBottomColor: `${artifactColor}20`,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              backgroundColor: `${artifactColor}20`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArtifactIcon size={14} color={artifactColor} />
          </View>
          <Text style={{ fontSize: 12, fontWeight: '700', color: artifactColor }}>{title}</Text>
        </View>
        {expanded ? (
          <ChevronUp size={14} color={artifactColor} />
        ) : (
          <ChevronDown size={14} color={artifactColor} />
        )}
      </TouchableOpacity>
      {expanded && <View style={{ padding: 14, gap: 10 }}>{renderContent()}</View>}
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

function getArtifactIcon(type: string) {
  const map: Record<string, { Icon: React.ComponentType<any>; color: string }> = {
    health_checkup_start: { Icon: Stethoscope, color: colors.primary },
    health_checkup_report: { Icon: ClipboardCheck, color: colors.success },
    drug_interaction_report: { Icon: AlertTriangle, color: '#f97316' },
    prescription_analysis: { Icon: Pill, color: colors.secondary },
    recovery_dashboard: { Icon: Heart, color: colors.destructive },
    screening_report: { Icon: FileText, color: '#f59e0b' },
    coping_exercise: { Icon: HeartPulse, color: '#ec4899' },
    safety_plan: { Icon: Shield, color: colors.primary },
    risk_assessment: { Icon: BarChart3, color: '#8b5cf6' },
  };
  return map[type] ?? { Icon: FileText, color: colors.primary };
}

// ─── Artifact Sub-Cards ─────────────────────────────

const TRIAGE_CONFIG: Record<string, { label: string; desc: string; color: string }> = {
  emergency: { label: 'Emergency', desc: 'Seek immediate medical attention', color: '#ef4444' },
  emergency_ambulance: {
    label: 'Emergency',
    desc: 'Call an ambulance immediately',
    color: '#ef4444',
  },
  consultation_24: {
    label: 'See a Doctor Within 24h',
    desc: 'Medical attention recommended soon',
    color: '#f97316',
  },
  consultation: {
    label: 'Consultation Recommended',
    desc: 'Schedule a visit with a specialist',
    color: '#eab308',
  },
  self_care: { label: 'Self Care', desc: 'Monitor symptoms at home', color: '#22c55e' },
};

function CheckupReportCard({ data }: { data: any }) {
  const triage = data?.triage_level || data?.triage?.level || 'self_care';
  const triageCfg = TRIAGE_CONFIG[triage] || TRIAGE_CONFIG.consultation;
  const conditions = data?.conditions?.slice(0, 5) || [];
  const checkupId = data?.checkup_id;

  const [report, setReport] = useState<any>(data?.report || null);
  const [generating, setGenerating] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);

  const conditionExplanations = report?.possible_conditions_explained || [];

  const handleShareReport = async () => {
    setPdfLoading(true);
    try {
      const patientName =
        `${user?.profile?.first_name || ''} ${user?.profile?.last_name || ''}`.trim() || 'Patient';
      const patientAge =
        data?.patient?.age ||
        (user?.profile?.date_of_birth
          ? Math.floor((Date.now() - new Date(user.profile.date_of_birth).getTime()) / 31557600000)
          : 0);
      const patientSex = data?.patient?.gender || user?.profile?.gender || '';
      await generateHealthCheckupPDF({
        patientName,
        age: patientAge,
        sex: patientSex,
        date: data?.date || new Date().toISOString(),
        triageLevel: triage,
        hasEmergency: triage === 'emergency' || triage === 'emergency_ambulance',
        conditions: conditions.map((c: any) => ({
          name: c.name,
          common_name: c.common_name || c.name,
          probability: (c.probability || 0) / 100, // PDF util expects 0-1 range
        })),
        claudeSummary: report?.overview ? report : null,
      });
    } finally {
      setPdfLoading(false);
    }
  };

  const getExplanation = (name: string) => {
    const match = conditionExplanations.find(
      (e: any) => e.condition?.toLowerCase() === name?.toLowerCase()
    );
    return match?.explanation;
  };

  const barColor = (prob: number) => {
    if (prob >= 60) return '#ef4444';
    if (prob >= 30) return '#f97316';
    return colors.primary;
  };

  const generateAISummary = async () => {
    if (!checkupId) return;
    setGenerating(true);
    setError(null);
    try {
      const status = await healthCheckupService.getClaudeSummaryStatus();
      if (!status?.can_generate) {
        setError('No AI credits available. Go to your Dashboard to top up your AI credit wallet.');
        return;
      }
      const result = await healthCheckupService.generateClaudeSummary(checkupId);
      const summary = result?.claude_summary?.content || result?.content || result;
      if (summary?.overview) {
        setReport(summary);
      } else {
        setError('Could not generate summary. Please try again.');
      }
    } catch {
      setError('Failed to generate AI summary. Please try again later.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      {/* Triage banner */}
      <View
        style={{
          backgroundColor: `${triageCfg.color}15`,
          borderLeftWidth: 3,
          borderLeftColor: triageCfg.color,
          borderRadius: 8,
          padding: 10,
          gap: 2,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={14} color={triageCfg.color} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: triageCfg.color }}>
            {triageCfg.label}
          </Text>
        </View>
        <Text style={{ fontSize: 11, color: colors.mutedForeground, paddingLeft: 20 }}>
          {triageCfg.desc}
        </Text>
      </View>

      {/* Conditions (always shown — from Infermedica) */}
      {conditions.length > 0 && (
        <View style={{ gap: 8 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: colors.mutedForeground,
              textTransform: 'uppercase',
            }}
          >
            Possible Conditions
          </Text>
          {conditions.map((c: any, i: number) => {
            const prob = Math.min(Math.round(c.probability || 0), 100);
            const explanation = getExplanation(c.common_name || c.name);
            return (
              <View key={i} style={{ gap: 3 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{ fontSize: 12, fontWeight: '600', color: colors.foreground, flex: 1 }}
                    numberOfLines={1}
                  >
                    {c.common_name || c.name}
                  </Text>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: barColor(prob) }}>
                    {prob}%
                  </Text>
                </View>
                <View style={{ height: 4, backgroundColor: `${colors.muted}60`, borderRadius: 2 }}>
                  <View
                    style={{
                      height: 4,
                      width: `${prob}%`,
                      backgroundColor: barColor(prob),
                      borderRadius: 2,
                    }}
                  />
                </View>
                {explanation && (
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.mutedForeground,
                      lineHeight: 16,
                      marginTop: 1,
                    }}
                  >
                    {explanation}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* AI Summary section */}
      {report?.overview ? (
        <>
          {/* Overview */}
          <Text style={{ fontSize: 12, color: colors.foreground, lineHeight: 18 }}>
            {report.overview}
          </Text>

          {/* Key Findings */}
          {report.key_findings?.length > 0 && (
            <View style={{ gap: 4 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: colors.mutedForeground,
                  textTransform: 'uppercase',
                }}
              >
                Key Findings
              </Text>
              {report.key_findings.map((f: string, i: number) => (
                <View key={i} style={{ flexDirection: 'row', gap: 6, paddingRight: 4 }}>
                  <Text style={{ fontSize: 11, color: colors.primary }}>•</Text>
                  <Text style={{ fontSize: 11, color: colors.foreground, lineHeight: 16, flex: 1 }}>
                    {f}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Recommendations */}
          {report.recommendations?.length > 0 && (
            <View style={{ gap: 4 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: colors.mutedForeground,
                  textTransform: 'uppercase',
                }}
              >
                Recommendations
              </Text>
              {report.recommendations.map((r: string, i: number) => (
                <View key={i} style={{ flexDirection: 'row', gap: 6, paddingRight: 4 }}>
                  <Check size={12} color={colors.success} style={{ marginTop: 2 }} />
                  <Text style={{ fontSize: 11, color: colors.foreground, lineHeight: 16, flex: 1 }}>
                    {r}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* When to Seek Care */}
          {report.when_to_seek_care && (
            <View style={{ backgroundColor: '#f9731610', borderRadius: 8, padding: 10, gap: 4 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: '#f97316',
                  textTransform: 'uppercase',
                }}
              >
                When to Seek Care
              </Text>
              <Text style={{ fontSize: 11, color: colors.foreground, lineHeight: 16 }}>
                {report.when_to_seek_care}
              </Text>
            </View>
          )}

          {/* Lifestyle Tips */}
          {report.lifestyle_tips?.length > 0 && (
            <View style={{ gap: 4 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: colors.mutedForeground,
                  textTransform: 'uppercase',
                }}
              >
                Lifestyle Tips
              </Text>
              {report.lifestyle_tips.map((t: string, i: number) => (
                <View key={i} style={{ flexDirection: 'row', gap: 6, paddingRight: 4 }}>
                  <Heart size={11} color={colors.accent} style={{ marginTop: 2 }} />
                  <Text style={{ fontSize: 11, color: colors.foreground, lineHeight: 16, flex: 1 }}>
                    {t}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      ) : (
        /* Generate AI Summary button */
        <View style={{ gap: 8 }}>
          <TouchableOpacity
            onPress={generateAISummary}
            disabled={generating}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={
              generating ? 'Generating AI summary' : 'Generate AI summary, costs 1 credit'
            }
            style={{
              backgroundColor: generating ? colors.muted : colors.accent,
              borderRadius: 10,
              paddingVertical: 11,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {generating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <BrainCircuit size={16} color="#fff" />
            )}
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>
              {generating ? 'Generating AI Summary...' : 'Generate AI Summary (1 credit)'}
            </Text>
          </TouchableOpacity>
          {error && (
            <Text style={{ fontSize: 11, color: colors.destructive, textAlign: 'center' }}>
              {error}
            </Text>
          )}
        </View>
      )}

      {/* Download / Share Report */}
      <TouchableOpacity
        onPress={handleShareReport}
        disabled={pdfLoading}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Download and share report"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 10,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
        }}
      >
        {pdfLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Download size={14} color={colors.primary} />
        )}
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.foreground }}>
          {pdfLoading ? 'Generating PDF...' : 'Download & Share Report'}
        </Text>
      </TouchableOpacity>

      {/* Disclaimer */}
      <Text
        style={{
          fontSize: 10,
          color: colors.mutedForeground,
          textAlign: 'center',
          fontStyle: 'italic',
        }}
      >
        This is an AI-generated health assessment, not a medical diagnosis.
      </Text>
    </View>
  );
}

function DrugInteractionCard({ data }: { data: any }) {
  const interactions = data?.interactions || data?.results || [];
  const drugsChecked = data?.drugs_checked || [];
  const [pdfLoading, setPdfLoading] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const sevColor = (severity: string) => {
    if (severity === 'major' || severity === 'contraindicated') return colors.destructive;
    if (severity === 'moderate') return '#f97316';
    return '#3b82f6';
  };

  const handleShare = async () => {
    setPdfLoading(true);
    try {
      await generateDrugInteractionPDF(data);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <View style={{ gap: 10 }}>
      {/* Drugs checked tags */}
      {drugsChecked.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          {drugsChecked.map((drug: string, i: number) => (
            <View
              key={i}
              style={{
                backgroundColor: `${colors.primary}10`,
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '600', color: colors.primary }}>{drug}</Text>
            </View>
          ))}
        </View>
      )}

      {/* No interactions */}
      {interactions.length === 0 && (
        <View style={{ alignItems: 'center', gap: 6, paddingVertical: 12 }}>
          <Shield size={24} color={colors.success} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.success }}>
            No Significant Interactions Found
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: colors.mutedForeground,
              textAlign: 'center',
              lineHeight: 16,
            }}
          >
            Based on current clinical evidence, no major drug-drug interactions were identified.
          </Text>
        </View>
      )}

      {/* Interaction cards */}
      {interactions.map((ix: any, i: number) => {
        const severity = ix.severity || 'moderate';
        const sc = sevColor(severity);
        const isExpanded = expandedIdx === i;
        return (
          <View
            key={i}
            style={{ borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: `${sc}30` }}
          >
            {/* Severity banner */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setExpandedIdx(isExpanded ? null : i)}
              style={{
                backgroundColor: `${sc}15`,
                padding: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertTriangle size={14} color={sc} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 10, fontWeight: '700', color: sc, textTransform: 'uppercase' }}
                >
                  {severity} interaction
                </Text>
                <Text
                  style={{ fontSize: 12, fontWeight: '600', color: colors.foreground }}
                  numberOfLines={1}
                >
                  {ix.drug1 || ix.drugs?.[0]} + {ix.drug2 || ix.drugs?.[1]}
                </Text>
              </View>
              {isExpanded ? (
                <ChevronUp size={14} color={sc} />
              ) : (
                <ChevronDown size={14} color={sc} />
              )}
            </TouchableOpacity>

            {/* Description (always visible) */}
            {ix.description && (
              <View
                style={{ paddingHorizontal: 10, paddingTop: 8, paddingBottom: isExpanded ? 0 : 8 }}
              >
                <Text style={{ fontSize: 11, color: colors.mutedForeground, lineHeight: 16 }}>
                  {ix.description}
                </Text>
              </View>
            )}

            {/* Expanded details */}
            {isExpanded && (
              <View style={{ padding: 10, gap: 8 }}>
                {/* Enzyme badge */}
                {ix.enzyme_involved && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View
                      style={{
                        backgroundColor: `${colors.primary}10`,
                        borderRadius: 6,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                      }}
                    >
                      <Text style={{ fontSize: 9, fontWeight: '600', color: colors.primary }}>
                        {ix.enzyme_involved}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Mechanism */}
                {ix.mechanism && (
                  <View
                    style={{ backgroundColor: colors.muted, borderRadius: 8, padding: 10, gap: 3 }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: colors.mutedForeground,
                        textTransform: 'uppercase',
                      }}
                    >
                      Mechanism
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.foreground, lineHeight: 16 }}>
                      {ix.mechanism}
                    </Text>
                  </View>
                )}

                {/* Management */}
                {ix.management?.length > 0 && (
                  <View
                    style={{ backgroundColor: colors.muted, borderRadius: 8, padding: 10, gap: 4 }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: colors.mutedForeground,
                        textTransform: 'uppercase',
                      }}
                    >
                      Management
                    </Text>
                    {ix.management.map((m: any, mi: number) => (
                      <View key={mi} style={{ gap: 1 }}>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: colors.foreground }}>
                          {m.title || m.type}
                        </Text>
                        {m.detail && (
                          <Text
                            style={{ fontSize: 11, color: colors.mutedForeground, lineHeight: 16 }}
                          >
                            {m.detail}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Monitoring */}
                {ix.monitoring?.length > 0 && (
                  <View
                    style={{ backgroundColor: colors.muted, borderRadius: 8, padding: 10, gap: 4 }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: colors.mutedForeground,
                        textTransform: 'uppercase',
                      }}
                    >
                      Monitoring
                    </Text>
                    {ix.monitoring.map((m: any, mi: number) => (
                      <View key={mi} style={{ gap: 1 }}>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: colors.foreground }}>
                          {m.test}
                        </Text>
                        {m.detail && (
                          <Text
                            style={{ fontSize: 11, color: colors.mutedForeground, lineHeight: 16 }}
                          >
                            {m.detail}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Alternatives */}
                {ix.alternatives?.length > 0 && (
                  <View
                    style={{ backgroundColor: colors.muted, borderRadius: 8, padding: 10, gap: 4 }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: colors.mutedForeground,
                        textTransform: 'uppercase',
                      }}
                    >
                      Alternatives
                    </Text>
                    {ix.alternatives.map((a: any, ai: number) => (
                      <View key={ai} style={{ gap: 1 }}>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: colors.foreground }}>
                          {a.suggestion}
                        </Text>
                        {a.detail && (
                          <Text
                            style={{ fontSize: 11, color: colors.mutedForeground, lineHeight: 16 }}
                          >
                            {a.detail}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Clinical significance */}
                {ix.clinical_significance && (
                  <View
                    style={{ backgroundColor: colors.muted, borderRadius: 8, padding: 10, gap: 4 }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: colors.mutedForeground,
                        textTransform: 'uppercase',
                      }}
                    >
                      Clinical Significance
                    </Text>
                    {ix.clinical_significance.risk_level && (
                      <View style={{ flexDirection: 'row', gap: 4 }}>
                        <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Risk:</Text>
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '600',
                            color: colors.foreground,
                            textTransform: 'capitalize',
                          }}
                        >
                          {ix.clinical_significance.risk_level}
                        </Text>
                      </View>
                    )}
                    {ix.clinical_significance.onset && (
                      <View style={{ flexDirection: 'row', gap: 4 }}>
                        <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Onset:</Text>
                        <Text style={{ fontSize: 11, color: colors.foreground }}>
                          {ix.clinical_significance.onset}
                        </Text>
                      </View>
                    )}
                    {ix.clinical_significance.documentation && (
                      <View style={{ flexDirection: 'row', gap: 4 }}>
                        <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                          Evidence:
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.foreground }}>
                          {ix.clinical_significance.documentation}
                        </Text>
                      </View>
                    )}
                    {ix.clinical_significance.primary_risk && (
                      <View style={{ flexDirection: 'row', gap: 4 }}>
                        <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                          Primary Risk:
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.foreground }}>
                          {ix.clinical_significance.primary_risk}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>
        );
      })}

      {/* Clinical summary */}
      {data?.summary && (
        <View style={{ gap: 3 }}>
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: colors.mutedForeground,
              textTransform: 'uppercase',
            }}
          >
            Clinical Summary
          </Text>
          <Text style={{ fontSize: 11, color: colors.foreground, lineHeight: 16 }}>
            {data.summary}
          </Text>
        </View>
      )}

      {/* Disclaimer */}
      <Text
        style={{
          fontSize: 10,
          color: colors.mutedForeground,
          textAlign: 'center',
          fontStyle: 'italic',
        }}
      >
        AI-generated report. Always consult a healthcare professional before making medication
        changes.
      </Text>

      {/* Download */}
      <TouchableOpacity
        onPress={handleShare}
        disabled={pdfLoading}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 10,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
        }}
      >
        {pdfLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Download size={14} color={colors.primary} />
        )}
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.foreground }}>
          {pdfLoading ? 'Generating PDF...' : 'Download & Share Report'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function PrescriptionAnalysisCard({ data }: { data: any }) {
  const medications = data?.medications || [];
  const readiness = data?.prescription_readiness;
  const totalCost = data?.total_estimated_cost;
  const [pdfLoading, setPdfLoading] = useState(false);

  const statusText = (med: any) => {
    if (!med.in_inventory) return 'Not Available';
    if (med.schedule_class && !['OTC', 'OTC_GENERAL'].includes(med.schedule_class))
      return 'Controlled';
    if (!med.in_stock) return 'Out of Stock';
    if (med.requires_prescription) return 'Rx Required';
    return 'In Stock';
  };

  const statusColor = (med: any) => {
    if (!med.in_inventory) return colors.mutedForeground;
    if (!med.in_stock) return colors.destructive;
    if (med.requires_prescription) return '#f97316';
    return colors.success;
  };

  const fmtPrice = (v: any) =>
    v != null
      ? Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '';

  const handleShare = async () => {
    setPdfLoading(true);
    try {
      await generatePrescriptionPDF(data);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <View style={{ gap: 10 }}>
      {/* Prescription info */}
      <View
        style={{
          backgroundColor: colors.muted,
          borderRadius: 8,
          padding: 10,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        {data?.doctor_name && (
          <Text style={{ fontSize: 11, color: colors.foreground }}>Dr. {data.doctor_name}</Text>
        )}
        {data?.confidence != null && (
          <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
            {Math.round(data.confidence)}% readable
          </Text>
        )}
        {data?.source && (
          <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
            {data.source === 'specialist' ? 'Specialist Rx' : 'Uploaded Rx'}
          </Text>
        )}
      </View>

      {/* Medications count */}
      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.foreground }}>
        Medications ({medications.length})
      </Text>

      {/* Medication cards */}
      {medications.map((med: any, i: number) => {
        const prices = med.prices || {};
        return (
          <View
            key={i}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              padding: 10,
              gap: 4,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.foreground }}>
                  {med.name || med.drug_name}
                </Text>
                {med.prescribed_dosage && (
                  <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                    {med.prescribed_dosage}
                  </Text>
                )}
              </View>
              <View
                style={{
                  backgroundColor: `${statusColor(med)}15`,
                  borderRadius: 6,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                }}
              >
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: '700',
                    color: statusColor(med),
                    textTransform: 'uppercase',
                  }}
                >
                  {statusText(med)}
                </Text>
              </View>
            </View>

            {med.in_inventory && med.matched_drug_name && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Check size={10} color={colors.success} />
                <Text style={{ fontSize: 11, color: colors.success }}>{med.matched_drug_name}</Text>
                {med.dosage_form && (
                  <Text style={{ fontSize: 10, color: colors.mutedForeground }}>
                    ({med.dosage_form})
                  </Text>
                )}
              </View>
            )}

            {/* Prices */}
            {Object.keys(prices).length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(prices).map(([currency, amount]: [string, any]) => (
                  <Text
                    key={currency}
                    style={{ fontSize: 10, color: colors.primary, fontWeight: '600' }}
                  >
                    {currency} {fmtPrice(amount)}
                  </Text>
                ))}
              </View>
            )}

            {med.instructions && (
              <Text style={{ fontSize: 11, color: colors.mutedForeground, lineHeight: 16 }}>
                {med.instructions}
              </Text>
            )}

            {!med.in_inventory && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <AlertTriangle size={10} color={colors.mutedForeground} />
                <Text style={{ fontSize: 10, color: colors.mutedForeground }}>
                  Not available in our pharmacy
                </Text>
              </View>
            )}
          </View>
        );
      })}

      {/* Total cost */}
      {totalCost && Object.values(totalCost).some((v) => v) && (
        <View style={{ backgroundColor: colors.muted, borderRadius: 10, padding: 10, gap: 4 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: colors.mutedForeground,
              textTransform: 'uppercase',
            }}
          >
            Estimated Total
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {Object.entries(totalCost)
              .filter(([, v]) => v)
              .map(([k, v]: [string, any]) => (
                <View key={k}>
                  <Text style={{ fontSize: 10, color: colors.mutedForeground }}>{k}</Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: k === 'NGN' ? colors.foreground : colors.mutedForeground,
                    }}
                  >
                    {fmtPrice(v)}
                  </Text>
                </View>
              ))}
          </View>
        </View>
      )}

      {/* Readiness score */}
      {readiness && (
        <View style={{ gap: 6 }}>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: colors.mutedForeground,
                textTransform: 'uppercase',
              }}
            >
              Order Readiness
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '800',
                color:
                  readiness.score >= 90
                    ? colors.success
                    : readiness.score >= 60
                    ? '#f97316'
                    : colors.destructive,
              }}
            >
              {readiness.score}%
            </Text>
          </View>
          {readiness.ready_for_order && (
            <View
              style={{
                backgroundColor: `${colors.success}15`,
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 6,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Check size={12} color={colors.success} />
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.success }}>
                Ready to order!
              </Text>
            </View>
          )}
          {readiness.issues?.map((issue: any, idx: number) => {
            const passed = issue.status === 'passed';
            return (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                {passed ? (
                  <Check size={12} color={colors.success} style={{ marginTop: 1 }} />
                ) : (
                  <AlertTriangle size={12} color={colors.destructive} style={{ marginTop: 1 }} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: colors.foreground }}>
                    {issue.check}
                  </Text>
                  <Text style={{ fontSize: 10, color: colors.mutedForeground }}>
                    {issue.message}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Disclaimer */}
      <Text
        style={{
          fontSize: 10,
          color: colors.mutedForeground,
          textAlign: 'center',
          fontStyle: 'italic',
        }}
      >
        Prices are estimates. This analysis does not constitute a medical recommendation.
      </Text>

      {/* Download */}
      <TouchableOpacity
        onPress={handleShare}
        disabled={pdfLoading}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 10,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
        }}
      >
        {pdfLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Download size={14} color={colors.primary} />
        )}
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.foreground }}>
          {pdfLoading ? 'Generating PDF...' : 'Download & Share Report'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function SparklineSvg({
  trend,
  color,
  maxVal = 10,
  width = 140,
  height = 36,
}: {
  trend: any[];
  color: string;
  maxVal?: number;
  width?: number;
  height?: number;
}) {
  if (!trend || trend.length < 2) return null;
  const pad = 4;
  const usableW = width - pad * 2;
  const usableH = height - pad * 2;
  const step = usableW / (trend.length - 1);
  const points = trend
    .map((pt: any, i: number) => {
      const x = pad + i * step;
      const y = pad + usableH - ((pt.value ?? pt) / maxVal) * usableH;
      return `${x},${y}`;
    })
    .join(' ');
  const lastPt = trend[trend.length - 1];
  const lastX = pad + (trend.length - 1) * step;
  const lastY = pad + usableH - ((lastPt.value ?? lastPt) / maxVal) * usableH;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <SvgCircle cx={lastX} cy={lastY} r={3} fill={color} />
    </Svg>
  );
}

function RecoveryDashboardCard({ data }: { data: any }) {
  const sobrietyDays = data?.sobriety_days ?? data?.profile?.sobriety_days ?? 0;
  const riskLevel = data?.risk_level ?? data?.profile?.risk_level ?? 'low';
  const riskColors: Record<string, string> = {
    low: colors.success,
    moderate: '#f97316',
    high: '#f97316',
    critical: colors.destructive,
  };
  const riskColor = riskColors[riskLevel] || colors.success;
  const [pdfLoading, setPdfLoading] = useState(false);

  const hasMood = data?.mood_trend?.length > 1;
  const hasCraving = data?.craving_trend?.length > 1;
  const milestoneProgress = data?.next_milestone
    ? Math.min(
        100,
        Math.round(
          ((data.next_milestone.days_required - data.next_milestone.days_remaining) /
            data.next_milestone.days_required) *
            100
        )
      )
    : 0;

  const handleShare = async () => {
    setPdfLoading(true);
    try {
      await generateRecoveryDashboardPDF(data);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <View style={{ gap: 10 }}>
      {/* Hero: sobriety + risk */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            backgroundColor: `${colors.success}10`,
            borderRadius: 12,
            padding: 12,
          }}
        >
          <Text style={{ fontSize: 10, color: colors.mutedForeground, fontWeight: '600' }}>
            Day
          </Text>
          <Text style={{ fontSize: 28, fontWeight: '800', color: colors.success }}>
            {sobrietyDays}
          </Text>
          {data?.sobriety_start_date && (
            <Text style={{ fontSize: 9, color: colors.mutedForeground }}>
              Since{' '}
              {new Date(data.sobriety_start_date).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
              })}
            </Text>
          )}
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <View
            style={{
              backgroundColor: `${riskColor}15`,
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: riskColor,
                textTransform: 'capitalize',
              }}
            >
              {riskLevel} Risk
            </Text>
          </View>
          {data?.primary_substance && (
            <View
              style={{
                backgroundColor: colors.muted,
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}
            >
              <Text style={{ fontSize: 10, color: colors.mutedForeground }}>
                {data.primary_substance}
              </Text>
            </View>
          )}
          {data?.care_level && (
            <Text style={{ fontSize: 10, color: colors.mutedForeground }}>{data.care_level}</Text>
          )}
        </View>
      </View>

      {/* Check-in status */}
      {data?.today_checked_in != null && (
        <View
          style={{
            backgroundColor: data.today_checked_in
              ? `${colors.success}10`
              : `${colors.destructive}10`,
            borderRadius: 8,
            padding: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {data.today_checked_in ? (
            <Check size={14} color={colors.success} />
          ) : (
            <AlertTriangle size={14} color={colors.destructive} />
          )}
          <Text
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: data.today_checked_in ? colors.success : colors.destructive,
            }}
          >
            {data.today_checked_in ? 'Daily check-in complete' : "You haven't checked in today"}
          </Text>
        </View>
      )}

      {/* Mood & Craving sparklines */}
      {(hasMood || hasCraving) && (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {hasMood && (
            <View
              style={{
                flex: 1,
                backgroundColor: colors.muted,
                borderRadius: 10,
                padding: 8,
                gap: 4,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '700', color: colors.mutedForeground }}>
                Mood Trend
              </Text>
              <SparklineSvg trend={data.mood_trend} color="#4FC3F7" />
              <Text style={{ fontSize: 10, color: colors.mutedForeground }}>
                Latest: {data.mood_trend[data.mood_trend.length - 1]?.value ?? '--'}/10
              </Text>
            </View>
          )}
          {hasCraving && (
            <View
              style={{
                flex: 1,
                backgroundColor: colors.muted,
                borderRadius: 10,
                padding: 8,
                gap: 4,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '700', color: colors.mutedForeground }}>
                Craving Trend
              </Text>
              <SparklineSvg trend={data.craving_trend} color="#F59E0B" />
              <Text style={{ fontSize: 10, color: colors.mutedForeground }}>
                Latest: {data.craving_trend[data.craving_trend.length - 1]?.value ?? '--'}/10
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Next milestone */}
      {data?.next_milestone && (
        <View style={{ gap: 4 }}>
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: colors.mutedForeground,
              textTransform: 'uppercase',
            }}
          >
            Next Milestone
          </Text>
          <View style={{ backgroundColor: colors.muted, borderRadius: 10, padding: 10, gap: 4 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.foreground }}>
                {data.next_milestone.name}
              </Text>
              <Text style={{ fontSize: 10, color: colors.mutedForeground }}>
                {data.next_milestone.days_remaining}d to go
              </Text>
            </View>
            <View style={{ height: 4, backgroundColor: `${colors.muted}80`, borderRadius: 2 }}>
              <View
                style={{
                  height: 4,
                  width: `${milestoneProgress}%`,
                  backgroundColor: colors.primary,
                  borderRadius: 2,
                }}
              />
            </View>
            <Text
              style={{
                fontSize: 10,
                color: colors.primary,
                fontWeight: '600',
                alignSelf: 'flex-end',
              }}
            >
              {milestoneProgress}%
            </Text>
          </View>
        </View>
      )}

      {/* Recent milestones */}
      {data?.recent_milestones?.length > 0 && (
        <View style={{ gap: 4 }}>
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: colors.mutedForeground,
              textTransform: 'uppercase',
            }}
          >
            Recent Milestones
          </Text>
          {data.recent_milestones.slice(0, 3).map((ms: any, i: number) => (
            <View
              key={i}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}
            >
              <Text style={{ fontSize: 14 }}>{ms.icon || '🏆'}</Text>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.foreground, flex: 1 }}>
                {ms.name}
              </Text>
              <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '600' }}>
                +{ms.points} pts
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Latest screening */}
      {data?.latest_screening && (
        <View style={{ gap: 4 }}>
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: colors.mutedForeground,
              textTransform: 'uppercase',
            }}
          >
            Latest Screening
          </Text>
          <View
            style={{
              backgroundColor: colors.muted,
              borderRadius: 10,
              padding: 10,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.foreground }}>
                {data.latest_screening.instrument}
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.foreground }}>
                {data.latest_screening.score}{' '}
                <Text style={{ fontSize: 11, fontWeight: '400', color: colors.mutedForeground }}>
                  / {data.latest_screening.max_score}
                </Text>
              </Text>
            </View>
            <View
              style={{
                backgroundColor: `${
                  riskColors[data.latest_screening.risk_level] || colors.mutedForeground
                }15`,
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: riskColors[data.latest_screening.risk_level] || colors.mutedForeground,
                  textTransform: 'capitalize',
                }}
              >
                {data.latest_screening.risk_level}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Disclaimer */}
      <Text
        style={{
          fontSize: 10,
          color: colors.mutedForeground,
          textAlign: 'center',
          fontStyle: 'italic',
        }}
      >
        Recovery tracking summary, not a clinical report. Share with your care team.
      </Text>

      {/* Download */}
      <TouchableOpacity
        onPress={handleShare}
        disabled={pdfLoading}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 10,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
        }}
      >
        {pdfLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Download size={14} color={colors.primary} />
        )}
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.foreground }}>
          {pdfLoading ? 'Generating PDF...' : 'Download & Share'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function ScreeningReportCard({ data }: { data: any }) {
  const score = data?.total_score ?? data?.score ?? 0;
  const maxScore = data?.max_score ?? 27;
  const riskLevel = data?.risk_level || 'low';
  const instrument = data?.instrument_name || data?.instrument || '';
  const riskColorMap: Record<string, string> = {
    low: colors.success,
    mild: colors.success,
    moderate: '#f59e0b',
    moderately_severe: '#f97316',
    high: colors.destructive,
    severe: colors.destructive,
    critical: '#991b1b',
  };
  const riskColor = riskColorMap[riskLevel] || colors.mutedForeground;
  const riskZones = data?.risk_zones || [];
  const markerPos = maxScore ? Math.min(100, Math.max(0, (score / maxScore) * 100)) : 0;
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showAI, setShowAI] = useState(false);

  const handleShare = async () => {
    setPdfLoading(true);
    try {
      await generateScreeningReportPDF(data);
    } finally {
      setPdfLoading(false);
    }
  };

  const zoneDefaultColor = (level: string) => {
    const c: Record<string, string> = {
      low: '#10B981',
      mild: '#10B981',
      moderate: '#F59E0B',
      moderately_severe: '#F97316',
      high: '#EF4444',
      severe: '#EF4444',
      critical: '#991B1B',
    };
    return c[level] || '#94A3B8';
  };

  return (
    <View style={{ gap: 10 }}>
      {/* Instrument name */}
      {instrument && (
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.foreground }}>
            {instrument}
          </Text>
          {data?.is_baseline && (
            <View
              style={{
                backgroundColor: `${colors.primary}15`,
                borderRadius: 6,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}
            >
              <Text style={{ fontSize: 9, fontWeight: '700', color: colors.primary }}>
                BASELINE
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Score gauge bar */}
      {riskZones.length > 0 ? (
        <View style={{ gap: 4 }}>
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: colors.mutedForeground,
              textTransform: 'uppercase',
            }}
          >
            Score
          </Text>
          <View
            style={{
              height: 16,
              borderRadius: 8,
              overflow: 'hidden',
              flexDirection: 'row',
              position: 'relative',
            }}
          >
            {riskZones.map((zone: any, i: number) => {
              const w = maxScore ? ((zone.max_score - zone.min_score) / maxScore) * 100 : 0;
              return (
                <View
                  key={i}
                  style={{
                    width: `${w}%`,
                    backgroundColor: zone.colour || zoneDefaultColor(zone.level),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 7, fontWeight: '700', color: '#fff' }} numberOfLines={1}>
                    {zone.label}
                  </Text>
                </View>
              );
            })}
          </View>
          {/* Marker */}
          <View style={{ position: 'relative', height: 16 }}>
            <View
              style={{
                position: 'absolute',
                left: `${markerPos}%`,
                marginLeft: -12,
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 0,
                  height: 0,
                  borderLeftWidth: 6,
                  borderRightWidth: 6,
                  borderBottomWidth: 6,
                  borderLeftColor: 'transparent',
                  borderRightColor: 'transparent',
                  borderBottomColor: riskColor,
                }}
              />
              <View
                style={{
                  backgroundColor: riskColor,
                  borderRadius: 4,
                  paddingHorizontal: 4,
                  paddingVertical: 1,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>{score}</Text>
              </View>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 9, color: colors.mutedForeground }}>0</Text>
            <Text style={{ fontSize: 9, color: colors.mutedForeground }}>{maxScore}</Text>
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
          <Text style={{ fontSize: 32, fontWeight: '800', color: riskColor }}>{score}</Text>
          <Text style={{ fontSize: 13, color: colors.mutedForeground }}>/ {maxScore}</Text>
        </View>
      )}

      {/* Risk badge + recommendation */}
      <View style={{ alignItems: 'flex-start', gap: 4 }}>
        <View
          style={{
            backgroundColor: `${riskColor}20`,
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: riskColor,
              textTransform: 'capitalize',
            }}
          >
            {(data?.risk_zone_label || riskLevel || '').replace(/_/g, ' ')}
          </Text>
        </View>
        {data?.recommendation && (
          <Text style={{ fontSize: 11, color: colors.mutedForeground, lineHeight: 16 }}>
            {data.recommendation}
          </Text>
        )}
      </View>

      {/* Subscale breakdown */}
      {data?.subscale_scores && Object.keys(data.subscale_scores).length > 0 && (
        <View style={{ gap: 4 }}>
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: colors.mutedForeground,
              textTransform: 'uppercase',
            }}
          >
            Subscale Scores
          </Text>
          {Object.entries(data.subscale_scores).map(([key, val]: [string, any]) => (
            <View key={key} style={{ gap: 3 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.foreground,
                    fontWeight: '500',
                    textTransform: 'capitalize',
                  }}
                >
                  {key.replace(/_/g, ' ')}
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: colors.foreground }}>
                  {val}
                </Text>
              </View>
              <View style={{ height: 4, backgroundColor: colors.muted, borderRadius: 2 }}>
                <View
                  style={{
                    height: 4,
                    width: `${Math.min(Number(val) * 10, 100)}%`,
                    backgroundColor: riskColor,
                    borderRadius: 2,
                  }}
                />
              </View>
            </View>
          ))}
        </View>
      )}

      {/* AI Interpretation (collapsible) */}
      {data?.ai_interpretation && (
        <View style={{ gap: 4 }}>
          <TouchableOpacity
            onPress={() => setShowAI(!showAI)}
            activeOpacity={0.7}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                color: colors.mutedForeground,
                textTransform: 'uppercase',
              }}
            >
              AI Interpretation
            </Text>
            {showAI ? (
              <ChevronUp size={12} color={colors.mutedForeground} />
            ) : (
              <ChevronDown size={12} color={colors.mutedForeground} />
            )}
          </TouchableOpacity>
          {showAI && (
            <View style={{ backgroundColor: colors.muted, borderRadius: 10, padding: 10, gap: 8 }}>
              {data.ai_interpretation.summary && (
                <Text style={{ fontSize: 11, color: colors.foreground, lineHeight: 16 }}>
                  {data.ai_interpretation.summary}
                </Text>
              )}
              {data.ai_interpretation.risk_assessment && (
                <View style={{ gap: 2 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: colors.mutedForeground }}>
                    Risk Assessment
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.foreground, lineHeight: 16 }}>
                    {data.ai_interpretation.risk_assessment}
                  </Text>
                </View>
              )}
              {data.ai_interpretation.recommended_interventions?.length > 0 && (
                <View style={{ gap: 2 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: colors.mutedForeground }}>
                    Recommended Interventions
                  </Text>
                  {data.ai_interpretation.recommended_interventions.map(
                    (item: string, i: number) => (
                      <View key={i} style={{ flexDirection: 'row', gap: 4 }}>
                        <Text style={{ fontSize: 11, color: colors.primary }}>•</Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: colors.foreground,
                            lineHeight: 16,
                            flex: 1,
                          }}
                        >
                          {item}
                        </Text>
                      </View>
                    )
                  )}
                </View>
              )}
              {data.ai_interpretation.motivational_message && (
                <View
                  style={{ backgroundColor: `${colors.success}10`, borderRadius: 8, padding: 8 }}
                >
                  <Text style={{ fontSize: 11, color: colors.success, lineHeight: 16 }}>
                    {data.ai_interpretation.motivational_message}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Score change comparison */}
      {data?.previous_score != null && (
        <View style={{ gap: 4 }}>
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: colors.mutedForeground,
              textTransform: 'uppercase',
            }}
          >
            Score Change
          </Text>
          <View
            style={{
              backgroundColor: colors.muted,
              borderRadius: 10,
              padding: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
              Previous: {data.previous_score}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color:
                    score > data.previous_score
                      ? colors.destructive
                      : score < data.previous_score
                      ? colors.success
                      : colors.mutedForeground,
                }}
              >
                {score > data.previous_score ? '↑' : score < data.previous_score ? '↓' : '='}{' '}
                {score > data.previous_score ? '+' : ''}
                {score - data.previous_score}
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: colors.foreground, fontWeight: '600' }}>
              Current: {score}
            </Text>
          </View>
        </View>
      )}

      {/* Disclaimer */}
      <Text
        style={{
          fontSize: 10,
          color: colors.mutedForeground,
          textAlign: 'center',
          fontStyle: 'italic',
        }}
      >
        Screening tool, not a clinical diagnosis. Review with a healthcare professional.
      </Text>

      {/* Download */}
      <TouchableOpacity
        onPress={handleShare}
        disabled={pdfLoading}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 10,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
        }}
      >
        {pdfLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Download size={14} color={colors.primary} />
        )}
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.foreground }}>
          {pdfLoading ? 'Generating PDF...' : 'Download & Share Report'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function CopingExerciseCard({ data }: { data: any }) {
  const steps: string[] = (data?.steps || []).map((s: any) =>
    typeof s === 'string' ? s : s.instruction || s.text || ''
  );
  const name = data?.exercise_name || data?.name || 'Coping Exercise';
  const isBoxBreathing = data?.exercise_id === 'box_breathing';
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [pdfLoading, setPdfLoading] = useState(false);

  // Box breathing state
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState(0);
  const [breathCycles, setBreathCycles] = useState(0);
  const [breathDone, setBreathDone] = useState(false);
  const breathTimer = useRef<any>(null);
  const breathPhaseLabels = ['Breathe In', 'Hold', 'Breathe Out', 'Hold'];
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Sync completed steps from backend
  useEffect(() => {
    if (data?.completed_steps && Array.isArray(data.completed_steps)) {
      const map: Record<number, boolean> = {};
      data.completed_steps.forEach((n: number) => {
        map[n - 1] = true;
      });
      setCompletedSteps(map);
    }
  }, [data?.completed_steps]);

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const doneCount = Object.values(completedSteps).filter(Boolean).length;
  const progress = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;

  // Box breathing logic
  const startBreathing = () => {
    setBreathingActive(true);
    let phase = 0;
    let cycles = 0;
    breathTimer.current = setInterval(() => {
      phase++;
      if (phase % 4 === 0) {
        cycles++;
        if (cycles >= 4) {
          clearInterval(breathTimer.current);
          setBreathingActive(false);
          setBreathDone(true);
          return;
        }
        setBreathCycles(cycles);
      }
      setBreathPhase(phase % 4);
    }, 4000);
  };

  const stopBreathing = () => {
    if (breathTimer.current) clearInterval(breathTimer.current);
    setBreathingActive(false);
  };

  useEffect(() => {
    if (breathingActive) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 4000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [breathingActive, pulseAnim]);

  useEffect(() => {
    return () => {
      if (breathTimer.current) clearInterval(breathTimer.current);
    };
  }, []);

  const handleShare = async () => {
    setPdfLoading(true);
    try {
      await generateCopingExercisePDF(data);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <View style={{ gap: 10 }}>
      {/* Header */}
      <View>
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.foreground }}>{name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
          {data?.category && (
            <View
              style={{
                backgroundColor: `${colors.primary}15`,
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '600', color: colors.primary }}>
                {data.category}
              </Text>
            </View>
          )}
          {data?.estimated_minutes && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Clock size={10} color={colors.mutedForeground} />
              <Text style={{ fontSize: 10, color: colors.mutedForeground }}>
                {data.estimated_minutes} min
              </Text>
            </View>
          )}
        </View>
        {data?.description && (
          <Text
            style={{ fontSize: 11, color: colors.mutedForeground, lineHeight: 16, marginTop: 4 }}
          >
            {data.description}
          </Text>
        )}
      </View>

      {/* Completion banner */}
      {data?.completed && (
        <View
          style={{
            backgroundColor: `${colors.success}10`,
            borderRadius: 10,
            padding: 12,
            alignItems: 'center',
            gap: 4,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Check size={16} color={colors.success} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.success }}>
              Exercise Completed
            </Text>
          </View>
          {data.outcome && (
            <Text style={{ fontSize: 11, color: colors.success, textAlign: 'center' }}>
              {data.outcome}
            </Text>
          )}
        </View>
      )}

      {/* Box breathing */}
      {isBoxBreathing && (
        <View style={{ alignItems: 'center', gap: 10, paddingVertical: 8 }}>
          <Animated.View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: breathingActive ? `${colors.primary}20` : colors.muted,
              borderWidth: 3,
              borderColor: breathingActive ? colors.primary : colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: pulseAnim }],
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: breathingActive ? colors.primary : colors.mutedForeground,
              }}
            >
              {breathingActive ? breathPhaseLabels[breathPhase] : breathDone ? 'Done!' : 'Ready'}
            </Text>
          </Animated.View>
          {breathCycles > 0 && (
            <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
              {breathCycles} / 4 cycles
            </Text>
          )}
          {!breathDone ? (
            <TouchableOpacity
              onPress={breathingActive ? stopBreathing : startBreathing}
              activeOpacity={0.7}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 10,
                paddingHorizontal: 20,
                paddingVertical: 10,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#fff' }}>
                {breathingActive ? 'Pause' : 'Start Breathing'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Check size={14} color={colors.success} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.success }}>
                Breathing complete!
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Steps */}
      {steps.length > 0 && (
        <View style={{ gap: 4 }}>
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: colors.mutedForeground,
              textTransform: 'uppercase',
            }}
          >
            Steps
          </Text>
          <Text style={{ fontSize: 10, color: colors.mutedForeground }}>
            Tap steps to mark complete
          </Text>
          {steps.map((step, i) => {
            const done = !!completedSteps[i];
            return (
              <TouchableOpacity
                key={i}
                activeOpacity={0.7}
                onPress={() => toggleStep(i)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 8,
                  paddingVertical: 4,
                }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: done ? colors.success : colors.muted,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 1,
                  }}
                >
                  {done ? (
                    <Check size={12} color="#fff" />
                  ) : (
                    <Text
                      style={{ fontSize: 10, fontWeight: '700', color: colors.mutedForeground }}
                    >
                      {i + 1}
                    </Text>
                  )}
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    color: done ? colors.success : colors.foreground,
                    flex: 1,
                    lineHeight: 18,
                    textDecorationLine: done ? 'line-through' : 'none',
                  }}
                >
                  {step}
                </Text>
              </TouchableOpacity>
            );
          })}
          {/* Progress bar */}
          <View style={{ gap: 2, marginTop: 4 }}>
            <View style={{ height: 4, backgroundColor: colors.muted, borderRadius: 2 }}>
              <View
                style={{
                  height: 4,
                  width: `${progress}%`,
                  backgroundColor: colors.success,
                  borderRadius: 2,
                }}
              />
            </View>
            <Text style={{ fontSize: 10, color: colors.mutedForeground, alignSelf: 'flex-end' }}>
              {doneCount} of {steps.length} steps
            </Text>
          </View>
        </View>
      )}

      {/* Evidence base */}
      {data?.evidence_base && (
        <View style={{ gap: 3 }}>
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: colors.mutedForeground,
              textTransform: 'uppercase',
            }}
          >
            Evidence Base
          </Text>
          <Text style={{ fontSize: 11, color: colors.foreground, lineHeight: 16 }}>
            {data.evidence_base}
          </Text>
        </View>
      )}

      {/* Disclaimer */}
      <Text
        style={{
          fontSize: 10,
          color: colors.mutedForeground,
          textAlign: 'center',
          fontStyle: 'italic',
        }}
      >
        For informational purposes. Not a substitute for professional treatment.
      </Text>

      {/* Download */}
      <TouchableOpacity
        onPress={handleShare}
        disabled={pdfLoading}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 10,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
        }}
      >
        {pdfLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Download size={14} color={colors.primary} />
        )}
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.foreground }}>
          {pdfLoading ? 'Generating PDF...' : 'Download & Share'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function SafetyPlanCard({ data }: { data: any }) {
  const resources = data?.emergency_resources || data?.resources || [];
  return (
    <View style={{ gap: 10 }}>
      <View
        style={{
          backgroundColor: `${colors.destructive}15`,
          borderRadius: 10,
          padding: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Shield size={20} color={colors.destructive} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.destructive }}>
            Safety Plan Active
          </Text>
          <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
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
        }}
      >
        <Phone size={18} color={colors.white} />
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.white }}>
          Call Emergency (999)
        </Text>
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
          }}
        >
          <Phone size={14} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.foreground }}>
              {r.name || r.title}
            </Text>
            {r.phone && <Text style={{ fontSize: 11, color: colors.primary }}>{r.phone}</Text>}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function RiskAssessmentCard({ data }: { data: any }) {
  const score = data?.score ?? data?.risk_score ?? 0;
  const level = data?.level ?? data?.risk_level ?? 'low';
  const levelColors: Record<string, string> = {
    low: '#10B981',
    moderate: '#F59E0B',
    high: '#F97316',
    critical: '#EF4444',
  };
  const levelLabels: Record<string, string> = {
    low: 'Low Risk',
    moderate: 'Moderate Risk',
    high: 'High Risk',
    critical: 'Critical Risk',
  };
  const lColor = levelColors[level] || '#94A3B8';
  const factors = data?.top_factors?.slice(0, 5) || [];
  const categories = data?.categories ? Object.entries(data.categories) : [];
  const history = data?.score_history || [];
  const [pdfLoading, setPdfLoading] = useState(false);

  const barColor = (s: number) => {
    if (s >= 75) return '#EF4444';
    if (s >= 50) return '#F97316';
    if (s >= 25) return '#F59E0B';
    return '#10B981';
  };

  // Semicircle gauge via SVG
  const arcRadius = 45;
  const totalArcLength = Math.PI * arcRadius; // ~141
  const fillRatio = Math.min(score / 100, 1);
  const dashOffset = totalArcLength * (1 - fillRatio);

  const handleShare = async () => {
    setPdfLoading(true);
    try {
      await generateRiskAssessmentPDF(data);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <View style={{ gap: 10 }}>
      {/* Gauge */}
      <View style={{ alignItems: 'center', gap: 4 }}>
        <Svg width={130} height={75} viewBox="0 0 130 75">
          <Path
            d="M 10 68 A 50 50 0 0 1 120 68"
            fill="none"
            stroke={colors.muted}
            strokeWidth={10}
            strokeLinecap="round"
          />
          <Path
            d="M 10 68 A 50 50 0 0 1 120 68"
            fill="none"
            stroke={lColor}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={`${totalArcLength}`}
            strokeDashoffset={`${dashOffset}`}
          />
          <SvgText x="65" y="55" textAnchor="middle" fontSize="22" fontWeight="800" fill={lColor}>
            {score}
          </SvgText>
          <SvgText x="65" y="68" textAnchor="middle" fontSize="10" fill="#64748B">
            / 100
          </SvgText>
        </Svg>
        <View
          style={{
            backgroundColor: `${lColor}20`,
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: lColor }}>
            {levelLabels[level] || `${level} Risk`}
          </Text>
        </View>
        {data?.updated_at && (
          <Text style={{ fontSize: 9, color: colors.mutedForeground }}>
            Updated{' '}
            {new Date(data.updated_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
            })}
          </Text>
        )}
      </View>

      {/* Category breakdown */}
      {categories.length > 0 && (
        <View style={{ gap: 4 }}>
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: colors.mutedForeground,
              textTransform: 'uppercase',
            }}
          >
            Signal Breakdown
          </Text>
          {categories.map(([key, cat]: [string, any]) => (
            <View key={key} style={{ gap: 3 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.foreground,
                    fontWeight: '500',
                    textTransform: 'capitalize',
                  }}
                >
                  {key.replace(/_/g, ' ')}
                </Text>
                <Text style={{ fontSize: 10, fontWeight: '600', color: colors.foreground }}>
                  {cat.score}/100
                </Text>
              </View>
              <View style={{ height: 4, backgroundColor: colors.muted, borderRadius: 2 }}>
                <View
                  style={{
                    height: 4,
                    width: `${Math.min(cat.score, 100)}%`,
                    backgroundColor: barColor(cat.score),
                    borderRadius: 2,
                  }}
                />
              </View>
              {cat.weight && (
                <Text style={{ fontSize: 9, color: colors.mutedForeground }}>
                  Weight: {cat.weight}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Top factors */}
      {factors.length > 0 && (
        <View style={{ gap: 4 }}>
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: colors.mutedForeground,
              textTransform: 'uppercase',
            }}
          >
            Top Contributing Factors
          </Text>
          {factors.map((f: any, i: number) => {
            const contrib = f.contribution || f.value || 0;
            return (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ height: 4, backgroundColor: colors.muted, borderRadius: 2 }}>
                    <View
                      style={{
                        height: 4,
                        width: `${Math.min(contrib, 100)}%`,
                        backgroundColor: barColor(contrib),
                        borderRadius: 2,
                      }}
                    />
                  </View>
                </View>
                <Text
                  style={{ fontSize: 11, color: colors.foreground, width: 100 }}
                  numberOfLines={1}
                >
                  {f.name || f.signal || f.label}
                </Text>
                <View
                  style={{
                    backgroundColor: `${colors.destructive}15`,
                    borderRadius: 6,
                    paddingHorizontal: 5,
                    paddingVertical: 1,
                  }}
                >
                  <Text style={{ fontSize: 9, fontWeight: '700', color: colors.destructive }}>
                    +{contrib}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* 7-day trend sparkline */}
      {history.length > 1 && (
        <View style={{ gap: 4 }}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                color: colors.mutedForeground,
                textTransform: 'uppercase',
              }}
            >
              7-Day Trend
            </Text>
            {data?.trend?.direction && (
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '600',
                  color:
                    data.trend.direction === 'increasing'
                      ? colors.destructive
                      : data.trend.direction === 'decreasing'
                      ? colors.success
                      : colors.mutedForeground,
                }}
              >
                {data.trend.direction === 'increasing'
                  ? '↑'
                  : data.trend.direction === 'decreasing'
                  ? '↓'
                  : '→'}{' '}
                {data.trend.direction}
              </Text>
            )}
          </View>
          <View style={{ backgroundColor: colors.muted, borderRadius: 10, padding: 8 }}>
            <SparklineSvg trend={history} color={lColor} maxVal={100} width={200} height={40} />
          </View>
        </View>
      )}

      {/* Suggestions */}
      {data?.suggestions?.length > 0 && (
        <View style={{ gap: 4 }}>
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: colors.mutedForeground,
              textTransform: 'uppercase',
            }}
          >
            Suggested Actions
          </Text>
          {data.suggestions.map((sug: any, i: number) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
              <Text style={{ fontSize: 11, color: colors.primary }}>›</Text>
              <Text style={{ fontSize: 11, color: colors.foreground, lineHeight: 16, flex: 1 }}>
                {sug.text || sug}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Disclaimer */}
      <Text
        style={{
          fontSize: 10,
          color: colors.mutedForeground,
          textAlign: 'center',
          fontStyle: 'italic',
        }}
      >
        AI-generated risk estimate, not a clinical diagnosis. Consult your care team.
      </Text>

      {/* Download */}
      <TouchableOpacity
        onPress={handleShare}
        disabled={pdfLoading}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 10,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
        }}
      >
        {pdfLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Download size={14} color={colors.primary} />
        )}
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.foreground }}>
          {pdfLoading ? 'Generating PDF...' : 'Download & Share Report'}
        </Text>
      </TouchableOpacity>
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

  // Reset selected items when question changes
  useEffect(() => {
    setSelectedItems([]);
  }, [question.text]);

  if (question.type === 'single') {
    const OPTS = [
      { label: 'Yes', color: colors.success },
      { label: 'No', color: colors.destructive },
      { label: 'Not sure', color: colors.mutedForeground },
    ];
    return (
      <View style={{ marginLeft: 40, gap: 8 }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: '600',
            color: colors.mutedForeground,
            textTransform: 'uppercase',
            letterSpacing: 0.4,
          }}
        >
          Select your answer
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {OPTS.map(({ label, color }) => (
            <TouchableOpacity
              key={label}
              activeOpacity={0.65}
              onPress={() => onAnswer(label)}
              style={{
                flex: 1,
                paddingVertical: 11,
                borderRadius: 14,
                backgroundColor: `${color}12`,
                borderWidth: 1.5,
                borderColor: `${color}35`,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  if (question.type === 'group_single') {
    return (
      <View style={{ marginLeft: 40, gap: 6 }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: '600',
            color: colors.mutedForeground,
            textTransform: 'uppercase',
            letterSpacing: 0.4,
          }}
        >
          Select one
        </Text>
        {(question.items || []).map((item, idx) => (
          <TouchableOpacity
            key={item.id || item.name || idx}
            activeOpacity={0.65}
            onPress={() => onAnswer(item.common_name || item.name)}
            style={{
              paddingVertical: 11,
              paddingHorizontal: 14,
              borderRadius: 14,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ fontSize: 13, color: colors.foreground, fontWeight: '500' }}>
              {item.common_name || item.name}
            </Text>
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                borderWidth: 1.5,
                borderColor: colors.border,
              }}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  // group_multiple
  const toggleItem = (name: string) => {
    setSelectedItems((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  };

  return (
    <View style={{ marginLeft: 40, gap: 8 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: '600',
          color: colors.mutedForeground,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
        }}
      >
        Select all that apply
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {(question.items || []).map((item, idx) => {
          const name = item.common_name || item.name;
          const selected = selectedItems.includes(name);
          return (
            <TouchableOpacity
              key={item.id || item.name || idx}
              activeOpacity={0.65}
              onPress={() => toggleItem(name)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 13,
                borderRadius: 14,
                backgroundColor: selected ? `${colors.primary}15` : colors.card,
                borderWidth: 1.5,
                borderColor: selected ? colors.primary : colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <View
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 4,
                  borderWidth: 1.5,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primary : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selected && <Check size={9} color={colors.white} />}
              </View>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '500',
                  color: selected ? colors.primary : colors.foreground,
                }}
              >
                {name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {selectedItems.length > 0 && (
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => {
            onAnswer(selectedItems.join(', '));
            setSelectedItems([]);
          }}
          style={{
            paddingVertical: 12,
            borderRadius: 14,
            backgroundColor: colors.primary,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 3,
          }}
        >
          <Check size={14} color={colors.white} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.white }}>
            Continue with {selectedItems.length} selected
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════
// Shimmer + Typing Loading Bubble
// ═══════════════════════════════════════════════════════

function ShimmerRow({ width, height = 10 }: { width: number; height?: number }) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const containerWidth = width;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-containerWidth, containerWidth],
  });

  return (
    <View
      style={{
        width,
        height,
        borderRadius: height / 2,
        backgroundColor: colors.muted,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: '60%',
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={['transparent', `${colors.border}`, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
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

  const groups: { label: string; items: EkaConversation[] }[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'This Week', items: [] },
    { label: 'Older', items: [] },
  ];

  const sorted = [...convos].sort(
    (a, b) =>
      new Date(b.updated_at || b.created_at).getTime() -
      new Date(a.updated_at || a.created_at).getTime()
  );

  for (const c of sorted) {
    const d = new Date(c.updated_at || c.created_at);
    const ds = d.toDateString();
    if (ds === today) groups[0].items.push(c);
    else if (ds === yesterday) groups[1].items.push(c);
    else if (d >= weekAgo) groups[2].items.push(c);
    else groups[3].items.push(c);
  }

  return groups.filter((g) => g.items.length > 0);
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
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
