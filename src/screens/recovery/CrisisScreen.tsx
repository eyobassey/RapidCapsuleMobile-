import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Phone, AlertTriangle, Heart, Wind, Shield } from 'lucide-react-native';
import { Header, Text } from '../../components/ui';
import { colors } from '../../theme/colors';
import { recoveryService } from '../../services/recovery.service';

const EMERGENCY_LINES = [
  { name: 'Emergency Services', number: '999', desc: 'UK emergency services' },
  { name: 'Samaritans', number: '116123', desc: '24/7 emotional support' },
  { name: 'FRANK Drug Helpline', number: '0300 123 6600', desc: 'Confidential drug advice' },
  { name: 'Alcoholics Anonymous', number: '0800 917 7650', desc: '24/7 helpline' },
];

const GROUNDING_STEPS = [
  { step: '5', label: 'things you can SEE' },
  { step: '4', label: 'things you can TOUCH' },
  { step: '3', label: 'things you can HEAR' },
  { step: '2', label: 'things you can SMELL' },
  { step: '1', label: 'thing you can TASTE' },
];

export default function CrisisScreen() {
  const navigation = useNavigation<any>();
  const [alerting, setAlerting] = useState(false);
  const [showGrounding, setShowGrounding] = useState(false);

  const handlePanicButton = () => {
    Alert.alert('Emergency Alert', 'This will notify your care team immediately. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Alert Care Team',
        style: 'destructive',
        onPress: async () => {
          setAlerting(true);
          try {
            await recoveryService.triggerEmergency('Patient pressed panic button');
            Alert.alert('Alert Sent', 'Your care team has been notified. Help is on the way.');
          } catch {
            Alert.alert('Error', 'Failed to send alert. Please call emergency services directly.');
          } finally {
            setAlerting(false);
          }
        },
      },
    ]);
  };

  const callNumber = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <Header title="Crisis Support" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Panic button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handlePanicButton}
          disabled={alerting}
          accessibilityRole="button"
          accessibilityLabel="Panic button, alert care team immediately"
          style={{
            backgroundColor: colors.destructive,
            borderRadius: 24,
            padding: 24,
            alignItems: 'center',
            gap: 8,
          }}
        >
          {alerting ? (
            <ActivityIndicator size="large" color={colors.white} />
          ) : (
            <AlertTriangle size={36} color={colors.white} />
          )}
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.white }}>
            {alerting ? 'Sending Alert...' : 'PANIC BUTTON'}
          </Text>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>
            Tap to alert your care team immediately
          </Text>
        </TouchableOpacity>

        {/* Breathing exercise */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowGrounding(!showGrounding)}
          accessibilityRole="button"
          accessibilityLabel="5-4-3-2-1 Grounding Exercise"
          accessibilityState={{ expanded: showGrounding }}
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: `${colors.primary}30`,
            borderRadius: 16,
            padding: 16,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              marginBottom: showGrounding ? 14 : 0,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: `${colors.primary}15`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wind size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.foreground }}>
                5-4-3-2-1 Grounding Exercise
              </Text>
              <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                Tap to {showGrounding ? 'hide' : 'start'} the exercise
              </Text>
            </View>
          </View>

          {showGrounding && (
            <View style={{ gap: 10 }}>
              {GROUNDING_STEPS.map((item, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    backgroundColor: `${colors.primary}08`,
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '800', color: colors.white }}>
                      {item.step}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, color: colors.foreground, fontWeight: '500' }}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>

        {/* Affirmation */}
        <View
          style={{
            backgroundColor: `${colors.success}08`,
            borderWidth: 1,
            borderColor: `${colors.success}20`,
            borderRadius: 16,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Heart size={20} color={colors.success} />
          <Text
            style={{
              flex: 1,
              fontSize: 13,
              color: colors.foreground,
              fontWeight: '500',
              lineHeight: 20,
            }}
          >
            You are not alone. This moment will pass. You have the strength to get through this.
          </Text>
        </View>

        {/* Emergency numbers */}
        <View>
          <Text
            style={{ fontSize: 14, fontWeight: '700', color: colors.foreground, marginBottom: 10 }}
          >
            Emergency Helplines
          </Text>
          <View style={{ gap: 8 }}>
            {EMERGENCY_LINES.map((line, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.7}
                onPress={() => callNumber(line.number)}
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 14,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: `${colors.success}15`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Phone size={16} color={colors.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>
                    {line.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.mutedForeground }}>{line.desc}</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary }}>
                  {line.number}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Safety notice */}
        <View
          style={{
            backgroundColor: `${colors.destructive}08`,
            borderRadius: 12,
            padding: 14,
            flexDirection: 'row',
            gap: 10,
          }}
        >
          <Shield size={16} color={colors.destructive} />
          <Text style={{ flex: 1, fontSize: 11, color: colors.mutedForeground, lineHeight: 18 }}>
            If you or someone else is in immediate danger, call 999 immediately. This app is not a
            replacement for emergency medical services.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
