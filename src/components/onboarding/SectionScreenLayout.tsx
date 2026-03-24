import React from 'react';
import { Platform, ScrollView } from 'react-native';
import {
  KeyboardAvoidingView,
  useReanimatedKeyboardAnimation,
} from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle, interpolate } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();

  // Keyboard animation for dynamic padding
  const keyboard = useReanimatedKeyboardAnimation();
  const animatedFooterStyle = useAnimatedStyle(() => {
    const height = Math.abs(keyboard.height.value || 0);
    const padding = interpolate(height, [0, 300], [Math.max(insets.bottom, 16), 12], 'clamp');
    return {
      paddingBottom: padding,
    };
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <Header title={title} onBack={onBack} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 20,
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

        <Animated.View
          style={[
            {
              paddingHorizontal: 20,
              paddingTop: 12,
              backgroundColor: colors.background,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            },
            animatedFooterStyle,
          ]}
        >
          <Button variant="primary" onPress={onSave} disabled={saveDisabled} loading={loading}>
            {saveLabel}
          </Button>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
