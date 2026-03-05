import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
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

export type HomeStackParamList = {
  HomeScreen: undefined;
  Notifications: undefined;
  Vitals: undefined;
  VitalDetail: {vitalType: string};
  LogVitals: {vitalType?: string} | undefined;
  HealthCheckupStart: undefined;
  HealthCheckupPatientInfo: undefined;
  HealthCheckupRiskFactors: undefined;
  HealthCheckupSymptomSearch: undefined;
  HealthCheckupInterview: undefined;
  HealthCheckupResults: undefined;
  HealthCheckupHistory: undefined;
  HealthCheckupDetail: {id: string};
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
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
    </Stack.Navigator>
  );
}
