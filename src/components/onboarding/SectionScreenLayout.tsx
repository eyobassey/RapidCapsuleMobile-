import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { Button, Header } from '../ui';
import { Text } from '../ui/Text';

interface SectionScreenLayoutProps {
  title: string;
  description?: string;
  onBack: () => void;
  onSave: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

export default function SectionScreenLayout({
  title,
  description,
  onBack,
  onSave,
  saveLabel = 'Save & Continue',
  saveDisabled = false,
  loading = false,
  children,
}: SectionScreenLayoutProps) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <Header title={title} onBack={onBack} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 100,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {description ? (
            <Text
              style={{
                fontSize: 13,
                color: colors.mutedForeground,
                marginBottom: 20,
                lineHeight: 18,
              }}
            >
              {description}
            </Text>
          ) : null}

          {children}
        </ScrollView>

        {/* Bottom sticky save button */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: Platform.OS === 'ios' ? 28 : 16,
            backgroundColor: colors.background,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <Button variant="primary" onPress={onSave} disabled={saveDisabled} loading={loading}>
            {saveLabel}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
