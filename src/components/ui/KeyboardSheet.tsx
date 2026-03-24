/**
 * KeyboardSheet — a bottom-sheet Modal whose content automatically slides
 * above the software keyboard on both iOS and Android.
 *
 * How it works:
 *  - react-native-keyboard-controller's KeyboardAvoidingView uses the real
 *    keyboard height reported by the OS (via WindowInsetsCompat on Android,
 *    keyboardWillShow on iOS) instead of the frame-measurement hack in RN core.
 *  - behavior="padding" is safe here because the sheet content is not full-
 *    screen — it is already positioned at the bottom via flex-end.
 *  - KeyboardStickyView is NOT used because we want the whole sheet to rise,
 *    not just the input bar.
 *
 * Usage:
 *   <KeyboardSheet visible={show} onClose={() => setShow(false)}>
 *     <TextInput ... />
 *     <Button ... />
 *   </KeyboardSheet>
 */

import React from 'react';
import { Modal, Pressable, View, useWindowDimensions } from 'react-native';
import {
  KeyboardAvoidingView,
  useReanimatedKeyboardAnimation,
} from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle, interpolate } from 'react-native-reanimated';
import { colors } from '../../theme/colors';

interface KeyboardSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Extra bottom padding inside the sheet when keyboard is closed (default 32). */
  bottomPadding?: number;
}

export default function KeyboardSheet({
  visible,
  onClose,
  children,
  bottomPadding = 32,
}: KeyboardSheetProps) {
  const { width: windowWidth } = useWindowDimensions();
  const keyboard = useReanimatedKeyboardAnimation();

  // Dynamically reduce padding as keyboard opens to avoid a 'huge distance' gap.
  // When height is 0 (closed), we use full bottomPadding.
  // As height increases (absolute value), we interpolate towards a smaller padding.
  const animatedStyle = useAnimatedStyle(() => {
    const height = Math.abs(keyboard.height.value || 0);
    const padding = interpolate(height, [0, 300], [bottomPadding, 12], 'clamp');
    return {
      paddingBottom: padding,
    };
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Tap-away overlay */}
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.55)',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        {/*
         * KeyboardAvoidingView from react-native-keyboard-controller:
         *  - behavior="padding" pushes the sheet content up by the keyboard height
         *  - Works correctly inside a Modal on both platforms
         */}
        <KeyboardAvoidingView
          behavior="padding"
          style={{ width: windowWidth, alignItems: 'center' }}
        >
          {/* Stop taps on the sheet from closing the modal */}
          <Pressable onPress={(e) => e.stopPropagation()} style={{ width: windowWidth }}>
            <Animated.View
              style={[
                {
                  backgroundColor: colors.card,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  width: windowWidth,
                  maxWidth: windowWidth,
                },
                animatedStyle,
              ]}
            >
              {/* Drag handle */}
              <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
                <View
                  style={{
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: colors.border,
                  }}
                />
              </View>

              {children}
            </Animated.View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
