import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../../screens/main/HomeScreen';
import NotificationsScreen from '../../screens/notifications/NotificationsScreen';
import VitalsScreen from '../../screens/vitals/VitalsScreen';
import VitalDetailScreen from '../../screens/vitals/VitalDetailScreen';
import LogVitalsScreen from '../../screens/vitals/LogVitalsScreen';
import HealthCheckupStartScreen from '../../screens/health-checkup/HealthCheckupStartScreen';
import PatientInfoScreen from '../../screens/health-checkup/PatientInfoScreen';
import RiskFactorsScreen from '../../screens/health-checkup/RiskFactorsScreen';
import SymptomSearchScreen from '../../screens/health-checkup/SymptomSearchScreen';
import InterviewScreen from '../../screens/health-checkup/InterviewScreen';
import ResultsScreen from '../../screens/health-checkup/ResultsScreen';
import HistoryScreen from '../../screens/health-checkup/HistoryScreen';
import HistoryDetailScreen from '../../screens/health-checkup/HistoryDetailScreen';
// Messages
import ConsentScreen from '../../screens/messages/ConsentScreen';
import ConversationsListScreen from '../../screens/messages/ConversationsListScreen';
import ChatScreen from '../../screens/messages/ChatScreen';
import NewConversationScreen from '../../screens/messages/NewConversationScreen';
import MediaPreviewScreen from '../../screens/messages/MediaPreviewScreen';
// Recovery
import RecoveryEnrollScreen from '../../screens/recovery/RecoveryEnrollScreen';
import RecoveryDashboardScreen from '../../screens/recovery/RecoveryDashboardScreen';
import DailyCheckInScreen from '../../screens/recovery/DailyCheckInScreen';
import ScreeningSelectScreen from '../../screens/recovery/ScreeningSelectScreen';
import ScreeningFlowScreen from '../../screens/recovery/ScreeningFlowScreen';
import ScreeningResultScreen from '../../screens/recovery/ScreeningResultScreen';
import ScreeningHistoryScreen from '../../screens/recovery/ScreeningHistoryScreen';
import MilestonesScreen from '../../screens/recovery/MilestonesScreen';
import CrisisScreen from '../../screens/recovery/CrisisScreen';
import CheckInHistoryScreen from '../../screens/recovery/CheckInHistoryScreen';
import CompanionChatScreen from '../../screens/recovery/CompanionChatScreen';
import RecoveryPlanScreen from '../../screens/recovery/RecoveryPlanScreen';
import GroupSessionsScreen from '../../screens/recovery/GroupSessionsScreen';
import PeerSupportScreen from '../../screens/recovery/PeerSupportScreen';
import MATDashboardScreen from '../../screens/recovery/MATDashboardScreen';
import HarmReductionScreen from '../../screens/recovery/HarmReductionScreen';
import RiskHistoryScreen from '../../screens/recovery/RiskHistoryScreen';
import ExerciseHistoryScreen from '../../screens/recovery/ExerciseHistoryScreen';
// Health Insights
import HealthInsightsScreen from '../../screens/main/HealthInsightsScreen';
// Dr. Eka
import DrEkaScreen from '../../screens/main/DrEkaScreen';

export type HomeStackParamList = {
  HomeScreen: undefined;
  Notifications: undefined;
  Vitals: undefined;
  VitalDetail: { vitalType: string };
  LogVitals: { vitalType?: string } | undefined;
  HealthCheckupStart: undefined;
  HealthCheckupPatientInfo: undefined;
  HealthCheckupRiskFactors: undefined;
  HealthCheckupSymptomSearch: undefined;
  HealthCheckupInterview: undefined;
  HealthCheckupResults: undefined;
  HealthCheckupHistory: undefined;
  HealthCheckupDetail: { id: string };
  // Messages
  MessagingConsent: undefined;
  ConversationsList: undefined;
  Chat: { conversationId: string; conversation?: any };
  NewConversation: undefined;
  MediaPreview: { url: string; type: string };
  // Recovery
  RecoveryEnroll: undefined;
  RecoveryDashboard: undefined;
  DailyCheckIn: undefined;
  ScreeningSelect: undefined;
  ScreeningFlow: { instrument: string; questions: any[] };
  ScreeningResult: { screeningId: string; result: any };
  ScreeningHistory: undefined;
  Milestones: undefined;
  Crisis: undefined;
  CheckInHistory: undefined;
  CompanionChat: { sessionId?: string };
  RecoveryPlan: undefined;
  GroupSessions: undefined;
  PeerSupport: undefined;
  MATDashboard: undefined;
  HarmReduction: undefined;
  RiskHistory: undefined;
  ExerciseHistory: undefined;
  // Health Insights
  HealthInsights: undefined;
  // Dr. Eka
  DrEka: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Vitals" component={VitalsScreen} />
      <Stack.Screen name="VitalDetail" component={VitalDetailScreen} />
      <Stack.Screen name="LogVitals" component={LogVitalsScreen} />
      <Stack.Screen name="HealthCheckupStart" component={HealthCheckupStartScreen} />
      <Stack.Screen name="HealthCheckupPatientInfo" component={PatientInfoScreen} />
      <Stack.Screen name="HealthCheckupRiskFactors" component={RiskFactorsScreen} />
      <Stack.Screen name="HealthCheckupSymptomSearch" component={SymptomSearchScreen} />
      <Stack.Screen name="HealthCheckupInterview" component={InterviewScreen} />
      <Stack.Screen name="HealthCheckupResults" component={ResultsScreen} />
      <Stack.Screen name="HealthCheckupHistory" component={HistoryScreen} />
      <Stack.Screen name="HealthCheckupDetail" component={HistoryDetailScreen} />
      {/* Messages */}
      <Stack.Screen name="MessagingConsent" component={ConsentScreen} />
      <Stack.Screen name="ConversationsList" component={ConversationsListScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="NewConversation" component={NewConversationScreen} />
      <Stack.Screen
        name="MediaPreview"
        component={MediaPreviewScreen}
        options={{ animation: 'fade' }}
      />
      {/* Recovery */}
      <Stack.Screen name="RecoveryEnroll" component={RecoveryEnrollScreen} />
      <Stack.Screen name="RecoveryDashboard" component={RecoveryDashboardScreen} />
      <Stack.Screen name="DailyCheckIn" component={DailyCheckInScreen} />
      <Stack.Screen name="ScreeningSelect" component={ScreeningSelectScreen} />
      <Stack.Screen name="ScreeningFlow" component={ScreeningFlowScreen} />
      <Stack.Screen name="ScreeningResult" component={ScreeningResultScreen} />
      <Stack.Screen name="ScreeningHistory" component={ScreeningHistoryScreen} />
      <Stack.Screen name="Milestones" component={MilestonesScreen} />
      <Stack.Screen name="Crisis" component={CrisisScreen} />
      <Stack.Screen name="CheckInHistory" component={CheckInHistoryScreen} />
      <Stack.Screen name="CompanionChat" component={CompanionChatScreen} />
      <Stack.Screen name="RecoveryPlan" component={RecoveryPlanScreen} />
      <Stack.Screen name="GroupSessions" component={GroupSessionsScreen} />
      <Stack.Screen name="PeerSupport" component={PeerSupportScreen} />
      <Stack.Screen name="MATDashboard" component={MATDashboardScreen} />
      <Stack.Screen name="HarmReduction" component={HarmReductionScreen} />
      <Stack.Screen name="RiskHistory" component={RiskHistoryScreen} />
      <Stack.Screen name="ExerciseHistory" component={ExerciseHistoryScreen} />
      {/* Health Insights */}
      <Stack.Screen name="HealthInsights" component={HealthInsightsScreen} />
      {/* Dr. Eka */}
      <Stack.Screen name="DrEka" component={DrEkaScreen} />
    </Stack.Navigator>
  );
}
