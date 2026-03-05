import React, {useState} from 'react';
import {View, Text, ScrollView, ActivityIndicator} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {MessageCircle, Shield, Lock} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import {Header, Button} from '../../components/ui';
import {colors} from '../../theme/colors';
import {useMessagingStore} from '../../store/messaging';

export default function ConsentScreen() {
  const navigation = useNavigation<any>();
  const giveConsent = useMessagingStore(s => s.giveConsent);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await giveConsent();
      navigation.replace('ConversationsList');
    } catch {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}} edges={['top']}>
      <Header title="Messaging" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={{padding: 24, paddingBottom: 40}}
        showsVerticalScrollIndicator={false}>
        {/* Icon */}
        <View style={{alignItems: 'center', marginTop: 20, marginBottom: 32}}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: `${colors.primary}15`,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <MessageCircle size={36} color={colors.primary} />
          </View>
        </View>

        {/* Title */}
        <Text
          style={{
            fontSize: 22,
            fontWeight: '700',
            color: colors.foreground,
            textAlign: 'center',
            marginBottom: 12,
          }}>
          Secure Messaging
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.mutedForeground,
            textAlign: 'center',
            lineHeight: 22,
            marginBottom: 32,
          }}>
          Communicate directly with your healthcare specialists in a secure,
          HIPAA-compliant environment.
        </Text>

        {/* Feature cards */}
        {[
          {
            icon: <Shield size={20} color={colors.primary} />,
            title: 'End-to-End Security',
            desc: 'All messages are encrypted and securely stored.',
          },
          {
            icon: <Lock size={20} color={colors.accent} />,
            title: 'Healthcare Compliance',
            desc: 'Communication follows medical data privacy standards.',
          },
          {
            icon: <MessageCircle size={20} color={colors.success} />,
            title: 'Direct Communication',
            desc: 'Text, images, files, and voice notes with your care team.',
          },
        ].map((item, i) => (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 14,
              marginBottom: 20,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              padding: 16,
            }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.muted,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {item.icon}
            </View>
            <View style={{flex: 1}}>
              <Text style={{fontSize: 14, fontWeight: '600', color: colors.foreground}}>
                {item.title}
              </Text>
              <Text style={{fontSize: 12, color: colors.mutedForeground, marginTop: 2, lineHeight: 18}}>
                {item.desc}
              </Text>
            </View>
          </View>
        ))}

        {/* Consent text */}
        <View
          style={{
            backgroundColor: `${colors.primary}08`,
            borderRadius: 12,
            padding: 14,
            marginBottom: 24,
          }}>
          <Text style={{fontSize: 11, color: colors.mutedForeground, lineHeight: 18}}>
            By continuing, you consent to using the secure messaging service.
            Your conversations may be audited for quality and safety purposes.
            You can revoke consent at any time from your settings.
          </Text>
        </View>

        {/* Actions */}
        <Button variant="primary" onPress={handleAccept} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            'Accept & Continue'
          )}
        </Button>

        <Button
          variant="ghost"
          onPress={() => navigation.goBack()}
          style={{marginTop: 8}}>
          Not Now
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
